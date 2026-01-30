# WASender Admin Portal - Complete Rebuild TODO

## Phase 1: Database Schema
- [x] Add conversations table (id, account_id, customer_phone, customer_name, last_message_at, unread_count, is_new, active_responder_id, claimed_at, tags)
- [x] Add messages table (id, conversation_id, direction, content, from_number, to_number, agent_id, media_url, media_type, status, timestamp)
- [x] Add agent_accounts table (agent_id, account_id) - many-to-many relationship
- [x] Add time_logs table (id, agent_id, login_at, logout_at, total_duration)
- [x] Add breaks table (id, time_log_id, break_type, start_at, end_at, duration)
- [x] Add quick_reply_templates table (id, agent_id, name, message)
- [x] Add conversation_notes table (id, conversation_id, agent_id, content, created_at, updated_at)
- [x] Add conversation_tags table (id, conversation_id, tag_name)
- [x] Add settings table (already exists) (key, value)
- [x] Run database migrations

## Phase 2: Database Helper Functions
- [x] Conversation CRUD functions
- [x] Message CRUD functions
- [x] Agent-Account linking functions
- [x] Time log and break tracking functions
- [x] Quick reply template functions
- [x] Conversation notes functions
- [x] Conversation tags functions
- [x] Settings functions

## Phase 3: tRPC Routers
- [x] Complete webhook router (list, create, update, delete, regenerate API key, logs)
- [x] Complete agents router (list, create, update, delete, link accounts, time logs, quick replies)
- [x] Complete chat router (conversations, messages, claim/release, notes, tags, send message)
- [x] Settings router (get, set, getAll)
- [x] Webhook receiver router (public endpoint for incoming messages)

## Phase 4: Admin Dashboard
- [x] Webhook account management page
- [x] Agent management page with account linking
- [x] Webhook logs viewer
- [x] Agent time tracking and analytics
- [x] System settings page
- [x] Tab-based navigation
- [x] Copy API key functionality
- [x] Regenerate API key functionality
- [x] Account status management

## Phase 5: Agent Dashboard
- [x] Conversation list with search and filters
- [x] Chat interface with message history
- [x] Claim/release conversation functionality
- [x] Quick reply templates manager
- [x] Conversation notes panel
- [x] Conversation tags panel
- [x] Customer name editing
- [x] Time tracking and break management UI
- [x] Real-time message updates
- [x] Auto-scroll to latest message
- [x] Unread count badges
- [x] NEW conversation badges

## Phase 6: Socket.IO Real-Time Features
- [x] Update Socket.IO server with JWT authentication
- [x] Implement new_message event
- [x] Implement agent-specific rooms
- [x] Connection/disconnection handling
- [x] Client-side Socket.IO integration
- [x] Real-time conversation list updates
- [x] Real-time message updates

## Phase 7: Testing
- [ ] Test admin authentication
- [ ] Test webhook account CRUD
- [ ] Test agent CRUD and account linking
- [ ] Test agent authentication
- [ ] Test conversation list and chat interface
- [ ] Test real-time messaging
- [ ] Test claim/release functionality
- [ ] Test all Socket.IO events
- [ ] Test webhook receiver endpoint
- [ ] Test time tracking features
- [ ] Test notes and tags functionality

## Phase 8: Deployment
- [x] Save checkpoint
- [x] Push to GitHub
- [ ] Deploy to Railway
- [ ] Verify production deployment

## Known Issues (Non-blocking)
- TypeScript errors in unused OAuth files (server/_core/sdk.ts, server/_core/oauth.ts) - These files are not used since custom JWT auth is implemented

## Additional Features Completed
- [x] Custom JWT authentication (no OAuth)
- [x] Argon2 password hashing
- [x] Role-based access control (admin/agent)
- [x] Session cookie management
- [x] Comprehensive error handling
- [x] Toast notifications
- [x] Loading states
- [x] Form validation
- [x] Confirmation dialogs
- [x] Responsive UI design

## Railway Deployment Issues
- [x] Fix database migration crash - tables already exist error
- [x] Remove `pnpm db:push` from start script (migrations should run separately)
- [ ] Verify Railway deployment after fix

## WASender API Integration
- [x] Create WASender API client (server/wasender-api.ts)
- [x] Implement send text message function
- [x] Implement send media message functions
- [x] Implement get session status function
- [x] Implement webhook receiver endpoint
- [x] Update chat.sendMessage router to use WASender API
- [ ] Test sending messages from agent dashboard
- [ ] Test receiving messages via webhook
- [x] Push to GitHub and deploy to Railway

## Agent Login Page Fix
- [x] Create agent login page (client/src/pages/AgentLogin.tsx)
- [x] Add /agent-login route to App.tsx
- [ ] Test agent login flow
- [x] Push to GitHub and deploy

## Webhook Account API Key Field
- [x] Add API key input field to webhook account creation form
- [x] Update webhook account creation router to accept API key
- [x] Push changes to GitHub
- [ ] Test creating webhook account with WASender API key

## Add Webhook Key Field
- [ ] Add webhook key field to database schema
- [ ] Add webhook key field to creation form
- [ ] Update routers to accept webhook key
- [ ] Create SQL script to insert default webhook account
- [ ] Push changes and test

## Missing Features Implementation
- [x] Add webhook_secret field to webhook_accounts table schema
- [x] Add settings table to store webhook base URL and WaSender API URL
- [x] Update webhook account creation form to include webhook secret field
- [x] Implement Settings page with URL configuration and endpoint generation
- [ ] Implement Dashboard page with statistics (total accounts, active accounts, messages sent/received)
- [x] Update webhook receiver to validate webhook secret
- [x] Add webhook secret to existing webhook account (165a269286b3e49c924bb3573704a672)
- [ ] Test complete webhook flow with WaSender
- [x] Push all changes to GitHub/Railway

## Agent Login Redirect Issue
- [ ] Fix agent login - login successful but not redirecting to dashboard
- [ ] Check AgentLogin.tsx redirect logic
- [ ] Verify agent dashboard route (/agent)
- [ ] Test agent login flow after fix

## Incoming Messages Not Showing
- [ ] Check webhook logs in admin dashboard
- [ ] Test webhook endpoint manually
- [ ] Verify message storage in database
- [ ] Check agent dashboard conversation list query
- [ ] Test complete message flow

## Webhook Connection Test Feature
- [x] Add WaSender API test connection function (check session status)
- [x] Create tRPC router for testing webhook connection
- [x] Add Test Connection button to Webhook Accounts table
- [x] Add connection status indicator (toast messages with success/warning/error)
- [x] Display detailed error messages if connection fails
- [x] Push changes to GitHub and deploy to Railway
- [ ] Test the connection verification feature

## WaSender API Connection Fix
- [x] Check WaSender API client base URL and endpoint
- [x] Verify authentication header format
- [ ] Test API connection with correct endpoint
- [ ] Fix any CORS or network issues
- [x] Push fix to GitHub and deploy to Railway

## Incoming Messages Not Showing in Agent Dashboard
- [ ] Verify webhook URL is configured in WaSender dashboard
- [ ] Check webhook logs to see if WaSender is sending requests
- [ ] Verify agent is linked to webhook account
- [ ] Test webhook endpoint manually with sample payload
- [ ] Check if messages are being saved to database
- [ ] Verify Socket.IO is broadcasting messages to agent dashboard
- [ ] Fix any issues found in the message flow

## Webhook Signature Validation Fix
- [x] Update webhook receiver to validate X-Webhook-Signature header
- [x] Remove webhook_secret query parameter validation
- [ ] Test webhook with WaSender
- [x] Push fix to GitHub and deploy

## Test Message Not Appearing Debug
- [ ] Check webhook logs in admin dashboard
- [ ] Check Railway deployment logs for errors
- [ ] Verify WaSender webhook configuration is correct
- [ ] Test webhook endpoint manually with curl
- [ ] Check Socket.IO connection in agent dashboard
- [ ] Verify agent-account linking is correct

## New Feature: Agent-Initiated Conversations

## New Feature: Agent-Initiated Conversations

- [x] Add tRPC mutation for agents to start new conversations with phone numbers
- [x] Add "Start New Chat" button in agent dashboard sidebar
- [x] Create dialog/modal for phone number input with validation
- [x] Integrate with WASender API to send first message
- [x] Update conversation list in real-time when new chat is created
- [ ] Test complete flow: enter phone number → send message → receive reply

## Bug Fix: WASender API Endpoint

- [ ] Fix WASender API client to use correct endpoint /api/send-message instead of /api/send-text
- [ ] Test Start New Chat feature after deployment

## Bug Fix: Webhook Payload Parsing

- [ ] Fix webhook handler to use correct WASender payload structure
  - Change from data.message (singular) to data.messages (plural, object not array)
  - Use data.messages.messageBody instead of data.message.body
  - Use data.messages.key.cleanedSenderPn instead of data.message.from
  - Handle remoteJid correctly (can be LID, not always phone number)
- [ ] Test incoming messages after fix

## Bug Fix: Timestamp Conversion

- [ ] Fix timestamp conversion - remove * 1000 (WASender already sends milliseconds)
- [ ] Test incoming messages after fix

## Bug: Webhook Not Receiving Messages

- [ ] Verify webhook secret in database matches WASender
- [ ] Test webhook endpoint accessibility from external sources
- [ ] Use WASender Webhook Simulator to test delivery
- [ ] Check if webhook account exists in database with correct API key

## Bug: Duplicate Conversations for Incoming Messages

- [ ] Fix getOrCreateConversation to match existing conversations correctly
- [ ] Ensure phone number format is consistent (with/without country code, with/without + sign)
- [ ] Test incoming and outgoing messages use same conversation

## Bug: Real-Time Updates Not Working

- [ ] Fix Socket.IO connection on agent dashboard
- [ ] Ensure Socket.IO works on Railway deployment (CORS, custom domain)
- [ ] Test real-time message delivery without page refresh

## Bug: Duplicate Messages (3x)

- [ ] Find why same message is being inserted multiple times
- [ ] Check webhook handler for duplicate message creation
- [ ] Verify message deduplication logic

## Bug: Message Deduplication Still Failing

- [ ] Add external_id field to messages table for WASender message ID
- [ ] Update webhook handler to check external_id for duplicates
- [ ] Test that each message appears only once


## Critical: Real-Time Messaging Zero-Delay Implementation

- [ ] Configure Socket.IO with proper CORS for custom domains
- [ ] Test Socket.IO connection works immediately on page load
- [ ] Verify incoming messages appear instantly without refresh
- [ ] Test with multiple agents simultaneously
- [ ] Ensure Socket.IO reconnects automatically on network interruption

## WASender API - All 14 Message Types Implementation

- [x] 1. Send Text Message - Already working
- [ ] 2. Send Image Message - Add imageUrl parameter support
- [ ] 3. Send Video Message - Add videoUrl parameter support  
- [ ] 4. Send Document Message - Add documentUrl parameter support
- [ ] 5. Send Audio Message - Add audioUrl parameter support
- [ ] 6. Send Sticker Message - Add stickerUrl parameter support (.webp only)
- [ ] 7. Send Contact Card - Add contact object parameter support
- [ ] 8. Send Location - Add location parameters (lat/long)
- [ ] 9. Send Poll Message - Add poll parameters
- [ ] 10. Send Quoted Message - Add quoted message reply support
- [ ] 11. Send View Once Message - Add viewOnce parameter
- [ ] 12. Edit Message - Implement PUT /api/messages/{msgId}
- [ ] 13. Delete Message - Implement DELETE /api/messages/{msgId}
- [ ] 14. Get Message Info - Implement GET /api/messages/{msgId}/info

## Media Upload & Handling

- [ ] Implement Upload Media File (POST /api/upload) in WASender API client
- [ ] Implement Decrypt Media File (POST /api/decrypt-media) in WASender API client
- [ ] Add file upload UI in agent chat interface
- [ ] Support drag-and-drop for file uploads
- [ ] Show media preview before sending

## Webhook Handler - All Message Types

- [ ] Handle incoming image messages (extract imageUrl from webhook)
- [ ] Handle incoming video messages (extract videoUrl from webhook)
- [ ] Handle incoming audio messages (extract audioUrl from webhook)
- [ ] Handle incoming document messages (extract documentUrl from webhook)
- [ ] Handle incoming location messages
- [ ] Handle incoming contact card messages
- [ ] Handle quoted/reply messages
- [ ] Handle message edit events
- [ ] Handle message delete events

## Production Database Cleanup

- [ ] Delete all duplicate messages from Railway production database
- [ ] Delete all duplicate conversations from Railway production database
- [ ] Verify database is clean before testing

## Final Testing Checklist

- [ ] Test sending text message - appears instantly for agent
- [ ] Test receiving text message - appears instantly without refresh
- [ ] Test phone number normalization - no duplicate conversations
- [ ] Test message deduplication - each message appears only once
- [ ] Test Socket.IO works on custom domain
- [ ] Test all 14 message types (when implemented)
- [ ] Test with 2+ agents simultaneously
- [ ] Verify zero-delay real-time updates in production


## New Feature: Delete Conversation for Agents

- [ ] Add deleteConversation tRPC mutation in conversations router
- [ ] Add delete button in agent dashboard conversation list (trash icon)
- [ ] Add confirmation dialog before deleting conversation
- [ ] Delete all messages associated with the conversation
- [ ] Test delete functionality in agent dashboard
[x] Add external_id field to messages table for WASender message ID
[x] Add getMessageByExternalId function to db.ts  
[x] Update webhook handler to extract key.id from payload
[x] Update webhook handler to check external_id before creating message
[x] Store WASender message ID in external_id field when creating message

[x] Add deleteConversation tRPC mutation in conversations router
[x] Add delete button in agent dashboard conversation list (trash icon)
[x] Add confirmation dialog before deleting conversation
[x] Delete all messages associated with the conversation
