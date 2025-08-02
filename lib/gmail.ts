import { google, gmail_v1, Auth } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { db } from './db';
import { users } from './schema';
import { eq } from 'drizzle-orm';

type MessagePartHeader = gmail_v1.Schema$MessagePartHeader;
type MessagePart = gmail_v1.Schema$MessagePart;

interface EmailData {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: Date;
  category: 'urgent' | 'financial' | 'internal' | 'external' | 'meetings' | 'credit_card' | 'general';
  priority: 'high' | 'medium' | 'low';
  summary: string;
  isRead: boolean;
  labels: string[];
  userId: string;
}

interface TokenManager {
  getToken(): Promise<{ accessToken: string; refreshToken?: string; expiryDate?: Date } | null>;
  saveToken(token: { accessToken: string; refreshToken?: string; expiryDate?: Date }): Promise<void>;
}

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
];

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Type guards
function isGaxiosError(error: any): error is { response: { status: number; data: any; headers: any } } {
  return error.response && typeof error.response.status === 'number';
}

function isAuthError(error: any): boolean {
  return error.code === 401 || 
         error.response?.status === 401 ||
         error.message?.includes('Invalid Credentials') ||
         error.message?.includes('invalid_grant') ||
         error.message?.includes('Token has been expired or revoked');
}

export class GmailService {
  private gmail: gmail_v1.Gmail;
  private auth: OAuth2Client;
  private userEmail: string = '';
  private tokenManager: TokenManager | null = null;
  private accessToken: string;
  private refreshToken: string | null;
  private userId: number;

  constructor(userId: number, accessToken: string, refreshToken?: string) {
    this.userId = userId;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken || null;

    // Initialize OAuth2 client
    this.auth = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google` : undefined
    );

    // Set the credentials
    this.auth.setCredentials({
      access_token: this.accessToken,
      refresh_token: this.refreshToken,
    });

    // Initialize Gmail API client
    this.gmail = google.gmail({ version: 'v1', auth: this.auth });
  }

  async getProfile(): Promise<{ email: string; name: string; picture: string }> {
    return this.makeRequest(async () => {
      try {
        const response = await this.gmail.users.getProfile({ userId: 'me' });
        const profile = response.data;
        
        // Store the user's email for later use
        if (profile.emailAddress) {
          this.userEmail = profile.emailAddress;
        }
        
        return {
          email: profile.emailAddress || '',
          name: (profile as any).name || '',
          picture: (profile as any).pictureUrl || '',
        };
      } catch (error) {
        console.error('Error in getProfile:', error);
        throw new Error('Failed to fetch user profile');
      }
    });
  }

  async getLabels() {
    const response = await this.gmail.users.labels.list({
      userId: 'me'
    });
    return response.data.labels || [];
  }



  private getHeader(name: string, headers: MessagePartHeader[] = []): string {
    const header = headers.find(h => h.name?.toLowerCase() === name.toLowerCase());
    return header?.value || '';
  }

  // Function to find the best body part
  private findBodyPart(parts: MessagePart[], mimeType: string): string | null {
    for (const part of parts) {
      if (part.mimeType === mimeType && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
      if (part.parts) {
        const nested = this.findBodyPart(part.parts, mimeType);
        if (nested) return nested;
      }
    }
    return null;
  }

  private setAuthCredentials(): void {
    const credentials: Auth.Credentials = {
      access_token: this.accessToken,
      refresh_token: this.refreshToken || undefined,
      expiry_date: Date.now() + 3600 * 1000, // 1 hour from now
      token_type: 'Bearer',
    };

    this.auth.setCredentials(credentials);

    // Set up token refresh listener
    this.auth.on('tokens', async (tokens) => {
      if (tokens.refresh_token) {
        this.refreshToken = tokens.refresh_token;
      }
      if (tokens.access_token) {
        this.accessToken = tokens.access_token;
      }
      await this.updateUserTokens(tokens);
    });
  }

  private async updateUserTokens(tokens: Auth.Credentials): Promise<void> {
    try {
      const updateData: {
        accessToken: string;
        refreshToken?: string | null;
        updatedAt: Date;
      } = {
        accessToken: tokens.access_token || this.accessToken,
        updatedAt: new Date(),
      };

      if (tokens.refresh_token) {
        updateData.refreshToken = tokens.refresh_token;
      } else if (this.refreshToken) {
        updateData.refreshToken = this.refreshToken;
      }

      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, this.userId));
    } catch (error) {
      console.error('Error updating user tokens:', error);
      throw error;
    }
  }

  private async refreshAccessToken(): Promise<void> {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      // Use the refresh token to get a new access token
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to refresh token:', errorData);
        
        // If refresh token is invalid, clear it
        if (errorData.error === 'invalid_grant') {
          console.log('Invalid grant, removing refresh token');
          this.refreshToken = null;
        }
        
        throw new Error('Failed to refresh access token');
      }

      const tokens = await response.json() as {
        access_token: string;
        refresh_token?: string;
        expires_in: number;
        token_type: string;
      };
      
      if (!tokens.access_token) {
        throw new Error('No access token in response');
      }
      
      // Update the stored tokens
      this.accessToken = tokens.access_token;
      if (tokens.refresh_token) {
        this.refreshToken = tokens.refresh_token;
      }
      
      // Update the auth client with the new token
      this.auth.setCredentials({
        access_token: this.accessToken,
        refresh_token: this.refreshToken,
        expiry_date: Date.now() + (tokens.expires_in * 1000),
      });
      
      // Update the token manager if available
      if (this.tokenManager) {
        await this.tokenManager.saveToken({
          accessToken: this.accessToken,
          refreshToken: this.refreshToken || '',
          expiryDate: new Date(Date.now() + (tokens.expires_in * 1000)),
        });
      }
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw new Error('Failed to refresh access token. Please sign in again.');
    }
  }

  private async makeRequest<T>(requestFn: () => Promise<T> | T, retryCount = 0): Promise<T> {
    try {
      // Check if token is expired and refresh if needed
      const credentials = this.auth.credentials;
      if (credentials.expiry_date && credentials.expiry_date <= Date.now() + 300000) {
        // Token expires in less than 5 minutes, refresh it
        await this.refreshAccessToken();
      }
      
      return await requestFn();
    } catch (error: any) {
      if (isAuthError(error) && retryCount < MAX_RETRIES) {
        console.log(`Retry attempt ${retryCount + 1} after auth error`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (retryCount + 1)));
        await this.refreshAccessToken();
        return this.makeRequest(requestFn, retryCount + 1);
      }
      
      if (isGaxiosError(error)) {
        console.error('API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
        });
      } else {
        console.error('Request error:', error);
      }
      
      throw error;
    }
  }



  async getEmails(maxResults = 500, lastSyncTime?: Date): Promise<{emails: EmailData[], lastSyncTime: Date}> {
    return this.makeRequest<{emails: EmailData[], lastSyncTime: Date}>(async () => {
      console.log('Starting to fetch emails');
      
      // Get the last sync time from the database if not provided
      if (!lastSyncTime) {
        const user = await db.query.users.findFirst({
          where: eq(users.id, this.userId)
        });
        lastSyncTime = user?.lastEmailSync || undefined;
      }
      
      // Build the query to get only new emails since last sync
      let query = 'in:inbox';
      if (lastSyncTime) {
        // Convert to RFC 3339 timestamp for more precise filtering
        const rfc3339Timestamp = lastSyncTime.toISOString();
        // Search for emails newer than the last sync time
        query += ` after:${Math.floor(lastSyncTime.getTime() / 1000)}`;
        console.log('Searching for emails after:', lastSyncTime.toISOString());
        
        // Also include emails that might have been modified since last sync
        query += ` OR (in:anywhere newer_than:1d)`;
      } else {
        console.log('No lastSyncTime provided, fetching all emails');
      }
      
      // Get the current time to update lastEmailSync after successful sync
      const currentSyncTime = new Date();

      console.log('Gmail query:', query);
      let allMessages: gmail_v1.Schema$Message[] = [];
      let pageToken: string | undefined;
      const maxPages = 10; // Safety limit to prevent infinite loops
      let pageCount = 0;

      try {
        // Fetch all pages of messages
        do {
          pageCount++;
          console.log(`Fetching page ${pageCount} of messages...`);
          
          const listResponse = await this.gmail.users.messages.list({
            userId: 'me',
            maxResults: 100, // Maximum allowed by Gmail API
            pageToken,
            q: query,
          });

          const messages = listResponse.data.messages || [];
          console.log(`Found ${messages.length} messages in this page`);
          
          allMessages = [...allMessages, ...messages];
          pageToken = listResponse.data.nextPageToken || undefined;
          
          // If we've reached the maxResults or maxPages, stop paginating
          if (allMessages.length >= maxResults || pageCount >= maxPages) {
            console.log(`Reached max results (${maxResults}) or max pages (${maxPages}), stopping pagination`);
            break;
          }
          
        } while (pageToken);
        
        console.log(`Found total of ${allMessages.length} messages to process`);
        
        if (allMessages.length === 0) {
          console.log('No messages found matching the query');
          return {
            emails: [],
            lastSyncTime: currentSyncTime
          };
        }

        // Process each message to get full details
        const emailPromises = allMessages.map(async (msg) => {
          if (!msg.id) {
            console.warn('Message has no ID, skipping');
            return null;
          }
          
          try {
            console.log(`Fetching details for message ID: ${msg.id}`);
            
            const messageResponse = await this.gmail.users.messages.get({
              userId: 'me',
              id: msg.id,
              format: 'full',
            });

            const message = messageResponse.data;
            if (!message) {
              console.error('No message data received for ID:', msg.id);
              return null;
            }
            
            console.log(`Processing message ${msg.id} with subject: ${message.snippet?.substring(0, 50)}...`);

            const headers = message.payload?.headers || [];
            console.log(`Found ${headers.length} headers for message ${msg.id}`);

            const from = this.getHeader("from", headers);
            const to = this.getHeader("to", headers);
            
            if (!from) {
              console.warn(`No 'from' header found for message ${msg.id}`);
              return null;
            }
            
            const subject = this.getHeader("subject", headers) || '(No subject)';
            const date = new Date(this.getHeader("date", headers) || Date.now());

            let body = "";
            if (message.payload?.parts) {
              body = this.findBodyPart(message.payload.parts, "text/html") || 
                     this.findBodyPart(message.payload.parts, "text/plain") || "";
            } else if (message.payload?.body?.data) {
              body = Buffer.from(message.payload.body.data, "base64").toString('utf-8');
            }

            // Categorize and prioritize email
            const [category, priority] = await Promise.all([
              this.categorizeEmail(subject, body, from),
              this.prioritizeEmail(subject, body, from)
            ]);
            
            const summary = await this.summarizeEmail(subject, body);

            return {
              id: msg.id,
              userId: this.userId.toString(),
              threadId: message.threadId || "",
              from,
              to,
              subject,
              body,
              date,
              category,
              priority,
              summary,
              isRead: !message.labelIds?.includes("UNREAD"),
              labels: message.labelIds || [],
            };
          } catch (error) {
            console.error("Error processing email:", error);
            return null;
          }
        });

        const results = await Promise.all(emailPromises);
        const validResults = results.filter((email): email is EmailData => email !== null);
        
        console.log(`Successfully processed ${validResults.length} out of ${results.length} messages`);
        
        // Sort by date to ensure we process them in chronological order
        const sortedResults = validResults.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        // Update the lastEmailSync timestamp in the database
        await db.update(users)
          .set({ 
            lastEmailSync: currentSyncTime,
            updatedAt: new Date()
          })
          .where(eq(users.id, this.userId));
          
        console.log(`Successfully updated lastEmailSync to ${currentSyncTime.toISOString()}`);
        
        return {
          emails: sortedResults,
          lastSyncTime: currentSyncTime
        };
      } catch (error) {
        console.error('Error in getEmails:', error);
        throw error;
      }
    });
  }

  private async summarizeEmail(subject: string, body: string): Promise<string> {
    try {
      // Simple implementation - can be enhanced with AI summarization
      const snippet = body.length > 150 ? body.substring(0, 150) + '...' : body;
      return `Email about ${subject}: ${snippet}`;
    } catch (error) {
      console.error('Error summarizing email:', error);
      return `Email about ${subject}`;
    }
  }

  public async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    return this.makeRequest(async () => {
      try {
        const email = [
          `To: ${to}`,
          'Content-Type: text/html; charset=utf-8',
          'MIME-Version: 1.0',
          `Subject: ${subject}`,
          '',
          body,
        ].join('\n');

        const encodedEmail = Buffer.from(email)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        const response = await this.gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: encodedEmail,
          },
        });

        return !!response.data.id;
      } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
      }
    });
  }

  private async categorizeEmail(subject: string, body: string, from: string): Promise<EmailData['category']> {
    try {
      const content = `${subject} ${body} ${from}`.toLowerCase();
      
      // Define keyword categories
      const creditCardKeywords = ['credit card', 'visa', 'mastercard', 'amex', 'payment', 'billing'];
      const financialKeywords = ['invoice', 'receipt', 'payment', 'billing', 'refund', 'transaction'];
      const meetingKeywords = ['meeting', 'appointment', 'schedule', 'calendar', 'call', 'zoom', 'teams'];
      
      // Check email domain for internal/external classification
      const emailDomain = from.split('@')[1] || '';
      const userDomain = this.userEmail.split('@')[1] || '';
      
      if (creditCardKeywords.some(keyword => content.includes(keyword))) return 'credit_card';
      if (financialKeywords.some(keyword => content.includes(keyword))) return 'financial';
      if (meetingKeywords.some(keyword => content.includes(keyword))) return 'meetings';
      if (emailDomain === userDomain) return 'internal';
      
      return 'general';
    } catch (error) {
      console.error('Error categorizing email:', error);
      return 'general';
    }
  }

  private async prioritizeEmail(subject: string, body: string, from: string): Promise<EmailData['priority']> {
    try {
      const content = `${subject} ${body}`.toLowerCase();
      
      // Define priority keywords
      const highPriorityKeywords = ['urgent', 'asap', 'important', 'immediate', 'action required'];
      const mediumPriorityKeywords = ['follow up', 'review', 'update', 'reminder'];
      
      if (highPriorityKeywords.some(keyword => content.includes(keyword))) return 'high';
      if (mediumPriorityKeywords.some(keyword => content.includes(keyword))) return 'medium';
      
      return 'low';
    } catch (error) {
      console.error('Error prioritizing email:', error);
      return 'medium';
    }
  }
}
