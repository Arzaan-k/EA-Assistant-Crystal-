ALTER TABLE "document_chunks" ADD COLUMN "token_count" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "sources" jsonb;