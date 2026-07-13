-- AI Architecture: multi-channel identity, conversation history, audit trail
-- extension, per-tenant AI channel feature flags.

-- BookingSource enum extended for future AI/channel integrations.
ALTER TYPE "BookingSource" ADD VALUE 'WHATSAPP';
ALTER TYPE "BookingSource" ADD VALUE 'INSTAGRAM';
ALTER TYPE "BookingSource" ADD VALUE 'VOICE';
ALTER TYPE "BookingSource" ADD VALUE 'AI_CHAT';
ALTER TYPE "BookingSource" ADD VALUE 'MESSENGER';

-- AuditLog gains channel + conversationId so AI-originated actions are traceable.
ALTER TABLE "AuditLog" ADD COLUMN "channel" TEXT,
                        ADD COLUMN "conversationId" TEXT;

-- Per-tenant AI channel toggles (all off by default; super-admin enables per shop).
ALTER TABLE "Shop" ADD COLUMN "aiChatEnabled"      BOOLEAN NOT NULL DEFAULT false,
                   ADD COLUMN "whatsappAiEnabled"   BOOLEAN NOT NULL DEFAULT false,
                   ADD COLUMN "instagramAiEnabled"  BOOLEAN NOT NULL DEFAULT false,
                   ADD COLUMN "voiceAiEnabled"      BOOLEAN NOT NULL DEFAULT false;

-- ExternalIdentity: maps channel-specific IDs to internal User/Client.
CREATE TABLE "ExternalIdentity" (
    "id"         TEXT NOT NULL,
    "channel"    TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "userId"     TEXT,
    "clientId"   TEXT,
    "metadata"   JSONB,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalIdentity_pkey" PRIMARY KEY ("id")
);

-- Conversation: one thread per channel session.
CREATE TABLE "Conversation" (
    "id"         TEXT NOT NULL,
    "channel"    TEXT NOT NULL,
    "shopId"     TEXT NOT NULL,
    "externalId" TEXT,
    "userId"     TEXT,
    "clientId"   TEXT,
    "status"     TEXT NOT NULL DEFAULT 'OPEN',
    "metadata"   JSONB,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- Message: individual messages within a conversation.
CREATE TABLE "Message" (
    "id"             TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "direction"      TEXT NOT NULL,
    "senderType"     TEXT NOT NULL,
    "contentType"    TEXT NOT NULL DEFAULT 'TEXT',
    "content"        TEXT NOT NULL,
    "metadata"       JSONB,
    "attachments"    TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status"         TEXT NOT NULL DEFAULT 'SENT',
    "externalId"     TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "ExternalIdentity_channel_externalId_key" ON "ExternalIdentity"("channel", "externalId");
CREATE INDEX "ExternalIdentity_userId_idx"    ON "ExternalIdentity"("userId");
CREATE INDEX "ExternalIdentity_clientId_idx"  ON "ExternalIdentity"("clientId");

CREATE INDEX "Conversation_shopId_channel_createdAt_idx" ON "Conversation"("shopId", "channel", "createdAt");
CREATE INDEX "Conversation_userId_idx"     ON "Conversation"("userId");
CREATE INDEX "Conversation_clientId_idx"   ON "Conversation"("clientId");
CREATE INDEX "Conversation_externalId_idx" ON "Conversation"("externalId");

CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");
CREATE INDEX "Message_externalId_idx" ON "Message"("externalId");

CREATE INDEX "AuditLog_channel_idx" ON "AuditLog"("channel");

-- Foreign keys
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ExternalIdentity" ADD CONSTRAINT "ExternalIdentity_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExternalIdentity" ADD CONSTRAINT "ExternalIdentity_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
