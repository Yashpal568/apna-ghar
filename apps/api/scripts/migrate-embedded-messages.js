#!/usr/bin/env node
/* Idempotent, non-destructive backfill from conversations.messages to messages. */
try {
  require('dotenv').config({ path: '.env.local' });
  require('dotenv').config();
} catch (_) {}
const mongoose = require('mongoose');

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required. Set it in the environment; do not commit credentials.');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const conversations = db.collection('conversations');
  const messages = db.collection('messages');
  if (!isDryRun) {
    await messages.createIndex({ conversationId: 1, sentAt: -1, _id: -1 });
    await messages.createIndex({ senderId: 1, sentAt: -1 });
  }

  let scanned = 0;
  let copied = 0;
  const cursor = conversations.find(
    { messages: { $exists: true, $ne: [] } },
    { projection: { _id: 1, messages: 1 } },
  ).batchSize(100);

  for await (const conversation of cursor) {
    scanned += 1;
    const rows = Array.isArray(conversation.messages) ? conversation.messages : [];
    if (!rows.length) continue;
    const operations = rows.filter((message) => message && message._id && message.senderId && message.text && message.sentAt)
      .map((message) => ({
        updateOne: {
          filter: { _id: message._id },
          update: { $setOnInsert: {
            conversationId: conversation._id,
            senderId: message.senderId,
            text: message.text,
            sentAt: message.sentAt,
            createdAt: message.sentAt,
            updatedAt: message.sentAt,
          } },
          upsert: true,
        },
      }));
    if (operations.length) {
      if (isDryRun) {
        copied += operations.length;
      } else {
        const result = await messages.bulkWrite(operations, { ordered: false });
        copied += result.upsertedCount || 0;
      }
    }
  }

  const remaining = await conversations.countDocuments({ messages: { $exists: true, $ne: [] } });
  const total = await messages.countDocuments({});
  process.stdout.write(JSON.stringify({ isDryRun, scannedConversations: scanned, potentialOrCopiedMessages: copied, totalMessagesInCollection: total, legacyConversationsRetained: remaining, safeToRemoveEmbeddedMessages: false }, null, 2) + '\n');
}

main().catch((error) => {
  process.stderr.write((error && error.stack) || String(error));
  process.exitCode = 1;
}).finally(async () => {
  await mongoose.disconnect().catch(() => undefined);
});
