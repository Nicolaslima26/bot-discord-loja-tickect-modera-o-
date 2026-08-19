-- AlterTable
ALTER TABLE "TicketConfig" ADD COLUMN     "logChannelId" TEXT;

-- CreateTable
CREATE TABLE "TicketTranscript" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketTranscript_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TicketTranscript_ticketId_key" ON "TicketTranscript"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketTranscript_storageKey_key" ON "TicketTranscript"("storageKey");

-- CreateIndex
CREATE INDEX "TicketTranscript_guildId_createdAt_idx" ON "TicketTranscript"("guildId", "createdAt");

-- AddForeignKey
ALTER TABLE "TicketTranscript" ADD CONSTRAINT "TicketTranscript_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketTranscript" ADD CONSTRAINT "TicketTranscript_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
