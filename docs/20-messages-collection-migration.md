# Conversation messages collection migration

## What changed

- New MongoDB collection: `messages`.
- Each document stores `conversationId`, `senderId`, `text` (max 4,000 characters), and `sentAt`.
- The API dual-writes new messages to the existing embedded array and the new collection during the transition.
- Conversation history reads merge both stores and deduplicate by message ID, so old messages remain visible while the backfill runs.
- Existing embedded arrays are intentionally retained. This release does not delete or rewrite historical conversation data.

## Backfill

Run from the repository root in an environment that has network access to the production MongoDB cluster and a securely injected `MONGODB_URI`:

```bash
npm run migrate:messages
```

The script is idempotent: it uses each embedded message's existing `_id` as the destination document ID and uses `$setOnInsert`. It creates the conversation/time indexes and prints counts. It never removes embedded messages.

Do not paste MongoDB credentials into chat, commit them, or put them in a command saved in shell history. Use a secured deployment shell or secret manager.

## Cutover checklist

- [ ] Run the backfill against the intended MongoDB database.
- [ ] Confirm `newlyCopiedMessages` and `totalMessages` are consistent with source conversation history.
- [ ] Run a two-account buyer/owner chat and verify both new and pre-migration messages paginate correctly.
- [ ] Verify unread counts and read receipts still update.
- [ ] Observe the collection and API through a normal usage window.
- [ ] Only in a separate reviewed release, remove embedded message writes/reads after confirming every conversation has been migrated and backed up.

The embedded `conversations.messages` field is not removed by this migration. The API intentionally retains compatibility until the cutover checklist is accepted.
