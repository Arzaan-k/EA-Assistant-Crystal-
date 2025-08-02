import { type NextRequest, NextResponse } from "next/server"
import { db, checkDatabaseConnection } from "@/lib/db"
import { users, emails } from "@/lib/schema"
import { GmailService } from "@/lib/gmail"
import { eq } from "drizzle-orm"
import { sql } from "drizzle-orm"

// Helper function to log database tables
async function logDatabaseTables() {
  try {
    const tables = await db.select().from(users).limit(1);
    console.log('Users table exists with data:', tables.length > 0);
    
    const emailCount = await db.select({ count: sql<number>`count(*)` }).from(emails);
    console.log('Total emails in database:', emailCount[0]?.count || 0);
    return true;
  } catch (error) {
    console.error('Error checking database tables:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check database connection first
    const isDbConnected = await checkDatabaseConnection();
    if (!isDbConnected) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }
    
    // Log database status
    await logDatabaseTables();
    
    const userId = request.cookies.get("user_id")?.value;
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userIdNum = Number.parseInt(userId);
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userIdNum))
      .limit(1)
      
    if (!user[0] || !user[0].accessToken) {
      return NextResponse.json({ error: "User not found or no access token" }, { status: 401 })
    }

    // Get the last sync time from the user record (default to 7 days ago if never synced)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    let lastSyncTime = user[0].lastEmailSync || sevenDaysAgo;
    
    console.log('Last sync time:', lastSyncTime);
    console.log('Current time:', new Date());
    
    try {
      const gmailService = new GmailService(
        userIdNum,
        user[0].accessToken,
        user[0].refreshToken || undefined
      );
      
      // Get emails since last sync
      console.log('Fetching new emails from Gmail API...');
      const startTime = Date.now();
      
      // Get emails with a larger batch size
      const { emails: fetchedEmails, lastSyncTime: newSyncTime } = await gmailService.getEmails(
        500, // Increase max results
        lastSyncTime
      );
      
      const fetchDuration = (Date.now() - startTime) / 1000;
      console.log(`Fetched ${fetchedEmails.length} emails in ${fetchDuration.toFixed(1)}s`);
      
      if (fetchedEmails.length === 0) {
        console.log('No new emails found in Gmail since last sync');
        
        // Still update the sync time even if no new emails
        await db
          .update(users)
          .set({ 
            lastEmailSync: new Date(),
            updatedAt: new Date()
          })
          .where(eq(users.id, userIdNum));
        
        return NextResponse.json({ 
          success: true, 
          emailsProcessed: 0,
          message: 'No new emails found since last sync',
          lastSyncTime: new Date().toISOString()
        });
      }
      
      let savedCount = 0;
      
      // Process each email individually without transaction
      console.log(`Processing ${fetchedEmails.length} emails...`);
      
      // Process emails one by one to handle conflicts properly
      for (const email of fetchedEmails) {
        try {
          console.log(`Processing email ID: ${email.id}`);
          console.log(`Subject: ${email.subject}`);
          console.log(`From: ${email.from}`);
          console.log(`Date: ${email.date}`);
          
          const emailData = {
            gmailId: email.id,
            threadId: email.threadId,
            fromEmail: email.from,
            toEmail: email.to || '',
            subject: email.subject,
            body: email.body?.substring(0, 100) + '...', // Log first 100 chars of body
            category: email.category,
            priority: email.priority,
            summary: email.summary || '',
            isRead: email.isRead,
            labels: email.labels || [],
            receivedAt: email.date,
            userId: userIdNum
          };
          
          console.log('Email data prepared for DB:', JSON.stringify(emailData, null, 2));
          
          try {
            console.log('Attempting to insert/update email:', email.id);
            
            // Prepare email data with proper types and defaults
            const emailData = {
              userId: userIdNum,
              gmailId: email.id,
              threadId: email.threadId || '',
              fromEmail: email.from || 'unknown@example.com',
              toEmail: email.to || '',
              subject: email.subject || '(No subject)',
              body: email.body || '',
              category: email.category || 'general',
              priority: email.priority || 'medium',
              summary: email.summary || '',
              isRead: email.isRead === true,
              labels: Array.isArray(email.labels) ? email.labels : [],
              receivedAt: email.date || new Date()
            };

            console.log('Prepared email data:', JSON.stringify({
              ...emailData,
              body: emailData.body.substring(0, 100) + (emailData.body.length > 100 ? '...' : '') // Log first 100 chars of body
            }, null, 2));
            
            // First try to update existing email
            const updated = await db.update(emails)
              .set({
                subject: emailData.subject,
                body: emailData.body,
                isRead: emailData.isRead,
                labels: emailData.labels
              })
              .where(
                eq(emails.gmailId, emailData.gmailId) &&
                eq(emails.userId, emailData.userId)
              )
              .returning();

            let result;
            if (!updated || updated.length === 0) {
              // If no rows were updated, try to insert
              console.log('No existing email found, inserting new one');
              result = await db.insert(emails)
                .values(emailData)
                .returning();
            } else {
              result = updated;
            }
            
            if (result && result.length > 0) {
              console.log(`Email ${email.id} processed successfully`);
              savedCount++;
            } else {
              console.warn(`No result returned for email ${email.id}`);
            }
          } catch (dbError) {
            console.error(`Database error for email ${email.id}:`, dbError);
            throw dbError; // Re-throw to be caught by the outer catch
          }
        } catch (error) {
          console.error(`Error processing email ${email.id}:`, error);
          // Continue with next email even if one fails
        }
      }
      
      console.log(`Successfully processed ${savedCount} out of ${fetchedEmails.length} emails`);

      // Update last sync time after all emails are processed
      await db
        .update(users)
        .set({ 
          lastEmailSync: newSyncTime,
          updatedAt: new Date()
        })
        .where(eq(users.id, userIdNum));

      // Get updated email stats
      const [stats] = await db
        .select({
          total: sql`COUNT(*)`,
          unread: sql`COUNT(CASE WHEN ${emails.isRead} = false THEN 1 END)`,
          urgent: sql`COUNT(CASE WHEN ${emails.priority} = 'high' THEN 1 END)`,
          creditCard: sql`COUNT(CASE WHEN ${emails.category} = 'credit_card' THEN 1 END)`,
        })
        .from(emails)
        .where(eq(emails.userId, userIdNum));

      return NextResponse.json({ 
        success: true, 
        emailsProcessed: savedCount,
        lastSyncTime: newSyncTime.toISOString(),
        stats: {
          total: Number(stats.total) || 0,
          unread: Number(stats.unread) || 0,
          urgent: Number(stats.urgent) || 0,
          creditCard: Number(stats.creditCard) || 0
        }
      });
    } catch (error) {
      console.error("Error in email sync:", error);
      return NextResponse.json(
        { error: "Failed to sync emails", details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Email sync error:", error)
    return NextResponse.json({ error: "Failed to sync emails" }, { status: 500 })
  }
}
