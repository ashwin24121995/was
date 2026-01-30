# WASender Admin Portal - TODO

## ✅ Completed Core Features
- [x] Database schema with 12 tables (users, webhook_accounts, agents, conversations, messages, etc.)
- [x] Custom JWT authentication (admin/agent roles)
- [x] Admin dashboard (webhook management, agent management, logs, settings)
- [x] Agent dashboard (conversation list, chat interface, real-time messaging)
- [x] Socket.IO real-time messaging with agent rooms
- [x] Webhook integration with WASender API
- [x] Message deduplication using external_id (WASender message ID)
- [x] Phone number normalization to prevent duplicate conversations
- [x] Start new chat feature for agents
- [x] Delete conversation feature for agents
- [x] Time tracking and break management
- [x] Quick reply templates
- [x] Conversation notes and tags
- [x] Railway deployment configuration

## 🚀 Phase 1: WASender API - All 14 Message Types (Send)
- [x] 1. Send Text Message - ✅ Already working
- [x] 2. Send Image Message - Add imageUrl parameter support
- [x] 3. Send Video Message - Add videoUrl parameter support
- [x] 4. Send Document Message - Add documentUrl parameter support
- [x] 5. Send Audio Message - Add audioUrl parameter support
- [x] 6. Send Sticker Message - Add stickerUrl parameter support (.webp only)
- [x] 7. Send Contact Card - Add contact object parameter support
- [x] 8. Send Location - Add location parameters (lat/long)
- [x] 9. Send Poll Message - Add poll parameters
- [x] 10. Send Quoted Message - Add quoted message reply support
- [x] 11. Send View Once Message - Add viewOnce parameter
- [x] 12. Edit Message - Implement PUT /api/messages/{msgId}
- [x] 13. Delete Message - Implement DELETE /api/messages/{msgId}
- [x] 14. Get Message Info - Implement GET /api/messages/{msgId}/info

## 📤 Phase 2: Media Upload & Handling
- [x] Implement Upload Media File (POST /api/upload) in WASender API client
- [x] Implement Decrypt Media File (POST /api/decrypt-media) in WASender API client
- [x] Add file upload UI in agent chat interface
- [x] Support file picker for uploads (drag-and-drop can be added later)
- [x] Show media preview before sending (images, videos, audio, documents)
- [x] Add automatic media type detection based on file type
- [ ] Connect file upload to storage service (requires external storage configuration)

## 📥 Phase 3: Webhook Handler - All Message Types (Receive)
- [x] Handle incoming image messages (extract imageUrl from webhook)
- [x] Handle incoming video messages (extract videoUrl from webhook)
- [x] Handle incoming audio messages (extract audioUrl from webhook)
- [x] Handle incoming document messages (extract documentUrl from webhook)
- [x] Handle incoming sticker messages
- [x] Handle incoming location messages (lat/long)
- [x] Handle incoming contact card messages
- [x] Handle incoming poll messages
- [x] Handle quoted/reply messages
- [x] Handle view-once messages
- [ ] Handle message edit events (webhook event pending)
- [ ] Handle message delete events (webhook event pending)

## 🎨 Phase 4: Agent Chat UI Enhancements
- [x] Display image messages with thumbnail preview
- [x] Display video messages with player
- [x] Display audio messages with player
- [x] Display document messages with download link
- [x] Display sticker messages
- [x] Display location messages with formatted card and Google Maps link
- [x] Display contact cards with formatted info and icon
- [x] Display poll messages with formatted card and icon
- [ ] Add reply/quote functionality to messages (backend ready, UI pending)
- [ ] Add message editing UI (backend ready, UI pending)
- [ ] Add message deletion UI (backend ready, UI pending)
- [ ] Show media loading states and progress bars

## 🗄️ Phase 5: Database Schema Updates
- [ ] Add media_url, media_type, media_caption fields to messages table (if not exists)
- [ ] Add quoted_message_id field for reply functionality
- [ ] Add is_view_once, is_edited, is_deleted flags
- [ ] Add location_lat, location_long fields
- [ ] Add contact_data JSON field for contact cards
- [ ] Add poll_data JSON field for polls
- [ ] Run database migrations

## 🧹 Phase 6: Production Database Cleanup
- [ ] Connect to Railway production database
- [ ] Delete all duplicate messages
- [ ] Delete all duplicate conversations
- [ ] Verify database is clean before testing
- [ ] Backup database before cleanup (optional)

## ✅ Phase 7: Final Testing Checklist
- [ ] Test sending text message - appears instantly for agent
- [ ] Test receiving text message - appears instantly without refresh
- [ ] Test sending image message
- [ ] Test receiving image message with preview
- [ ] Test sending video message
- [ ] Test receiving video message with player
- [ ] Test sending document message
- [ ] Test receiving document message with download
- [ ] Test sending audio message
- [ ] Test receiving audio message with player
- [ ] Test sending location message
- [ ] Test receiving location message with map
- [ ] Test sending contact card
- [ ] Test receiving contact card
- [ ] Test sending poll message
- [ ] Test receiving poll message
- [ ] Test reply/quote functionality
- [ ] Test message editing
- [ ] Test message deletion
- [ ] Test phone number normalization - no duplicate conversations
- [ ] Test message deduplication - each message appears only once
- [ ] Test Socket.IO works on custom domain (Railway)
- [ ] Test with 2+ agents simultaneously
- [ ] Verify zero-delay real-time updates in production
- [ ] Test delete conversation feature
- [ ] Test start new chat feature

## 📝 Known Issues (Non-blocking)
- TypeScript errors in unused OAuth files (server/_core/sdk.ts, server/_core/oauth.ts) - These files are not used since custom JWT auth is implemented
