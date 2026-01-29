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
- [ ] Push changes to GitHub and deploy to Railway
- [ ] Test the connection verification feature
