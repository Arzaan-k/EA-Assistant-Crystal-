import { relations } from 'drizzle-orm';
import { pgTable, serial, text, integer, timestamp, jsonb, boolean, vector } from 'drizzle-orm/pg-core';

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  googleId: text("google_id").unique(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  lastEmailSync: timestamp("last_email_sync"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  conversations: many(conversations),
  emails: many(emails),
  calendarEvents: many(calendarEvents),
  reminders: many(reminders),
  kpiData: many(kpiData),
}));

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  content: text("content"),
  summary: text("summary"),
  metadata: jsonb("metadata"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  isProcessed: boolean("is_processed").default(false),
});

export const documentsRelations = relations(documents, ({ one, many }) => ({
  user: one(users, { fields: [documents.userId], references: [users.id] }),
  chunks: many(documentChunks),
}));

export const documentChunks = pgTable("document_chunks", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }),
  chunkIndex: integer("chunk_index").notNull(),
  tokenCount: integer("token_count"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
  document: one(documents, { fields: [documentChunks.documentId], references: [documents.id] }),
}));

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, { fields: [conversations.userId], references: [users.id] }),
  messages: many(messages),
}));

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id),
  userId: integer("user_id").references(() => users.id),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  documentContext: jsonb("document_context"),
  sources: jsonb("sources"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  user: one(users, { fields: [messages.userId], references: [users.id] }),
}));

export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  gmailId: text("gmail_id").notNull().unique(),
  threadId: text("thread_id"),
  fromEmail: text("from_email").notNull(),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body"),
  category: text("category").notNull(), // 'urgent' | 'financial' | 'internal' | 'external' | 'meetings' | 'credit_card' | 'general'
  priority: text("priority").notNull(), // 'high' | 'medium' | 'low'
  summary: text("summary"),
  isRead: boolean("is_read").default(false),
  labels: jsonb("labels"),
  receivedAt: timestamp("received_at").notNull(),
  processedAt: timestamp("processed_at").defaultNow(),
})

export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  googleEventId: text("google_event_id").notNull().unique(),
  summary: text("summary").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  attendees: jsonb("attendees"),
  location: text("location"),
  meetingLink: text("meeting_link"),
  status: text("status").default("confirmed"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  assignedTo: text("assigned_to").notNull(),
  assignedBy: text("assigned_by").notNull(),
  deadline: timestamp("deadline"),
  priority: text("priority").notNull(), // 'high' | 'medium' | 'low'
  status: text("status").default("pending"), // 'pending' | 'in_progress' | 'completed' | 'cancelled'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
})

export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  reminderTime: timestamp("reminder_time").notNull(),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
})

export const kpiData = pgTable("kpi_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  metric: text("metric").notNull(),
  value: text("value").notNull(),
  period: text("period").notNull(), // 'daily' | 'weekly' | 'monthly' | 'quarterly'
  date: timestamp("date").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
})
