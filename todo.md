# WASender Admin Portal - Project TODO

## Phase 1: Database Schema & Authentication
- [x] Update database schema with users, webhook_accounts, webhook_logs, settings tables
- [x] Add password field and role enum to users table
- [x] Implement custom email/password authentication with JWT
- [x] Create admin registration and login procedures
- [x] Create agent login procedure
- [x] Add bcryptjs for password hashing

## Phase 2: Admin Dashboard
- [x] Create admin login/register page
- [x] Build admin dashboard layout with navigation
- [x] Implement webhook account management (create, view, edit, delete)
- [x] Add API key generation for webhook accounts
- [x] Create webhook logs viewer
- [x] Add system statistics and monitoring

## Phase 3: Agent Dashboard
- [x] Create agent login page
- [x] Build agent dashboard with conversation list
- [x] Implement message interface with chat UI
- [x] Add real-time message display
- [x] Show connection status indicator

## Phase 4: Real-Time Messaging
- [x] Install and configure Socket.IO server
- [x] Implement Socket.IO authentication middleware
- [x] Add smart transport detection (polling for production, websocket for dev)
- [x] Create useSocket hook for client
- [x] Implement message broadcasting to agents
- [x] Add connection status tracking

## Phase 5: Webhook Integration
- [x] Create webhook endpoint with API key authentication
- [x] Implement message logging to database
- [x] Add webhook message validation
- [ ] Create webhook testing interface
- [x] Implement message routing to agents

## Phase 6: Railway Deployment
- [x] Create railway.json configuration
- [x] Update package.json with db:push script
- [x] Add Node.js 18 compatibility fixes
- [ ] Configure environment variables documentation
- [ ] Write deployment guide

## Phase 7: Testing & Documentation
- [x] Write vitest tests for authentication
- [ ] Write tests for webhook endpoints
- [ ] Write tests for Socket.IO connection
- [ ] Create comprehensive README
- [ ] Document API endpoints

## Bug Fixes
- [ ] Fix database connection error in authentication queries
- [ ] Ensure database schema is properly initialized
- [ ] Add better error handling for database connection failures

## Railway Deployment Issues
- [x] Fix MySQL migration syntax error - multiple CREATE TABLE statements in single query
- [x] Split migration into separate SQL statements

## Production Deployment Crash
- [x] Fix TypeError at dist/index.js:758 - path.join receiving undefined
- [x] Replace import.meta.dirname with Node.js 18 compatible __dirname

## Additional Node.js 18 Compatibility Fixes
- [x] Fix import.meta.dirname in vite.config.ts (9 occurrences)
- [x] Fix import.meta.dirname in vitest.config.ts (1 occurrence)

## Authentication Errors
- [x] Fix "crypto is not defined" error in registration
- [x] Add proper crypto module import

## Console Cleanup
- [x] Remove Manus analytics code from client/index.html
- [x] Eliminate VITE_ANALYTICS_ENDPOINT error

## Critical Fix - Crypto Error Still Persisting
- [x] Replace bcryptjs with native bcrypt module
- [x] Remove crypto import workaround
- [x] Test password hashing works correctly

## Railway Build Cache Issue
- [x] Force Railway to rebuild with clean cache (added rm -rf dist)
- [x] Ensure bcrypt native module compiles on Railway (added postinstall script)
- [x] Add postinstall rebuild script to package.json

## Railway CDN Asset Caching Issue
- [x] Add timestamp-based cache busting to Vite build output
- [ ] Force Railway CDN to serve new JavaScript assets
- [ ] Verify crypto error is resolved after new build deploys

## Alternative Password Hashing Solution
- [x] Replace bcrypt with argon2 (no crypto module issues)
- [x] Update authentication routers to use argon2
- [ ] Push to GitHub and test on Railway deployment

## Root Cause Found - Nanoid Uses Crypto
- [x] Replace nanoid with crypto-free alternative
- [x] Use custom random string generator for API keys
- [ ] Push to GitHub and test on Railway

## Exhaustive Crypto Dependency Search
- [x] Check package.json for all crypto-dependent packages - found jose and nanoid
- [x] Search jose (JWT library) for crypto usage - confirmed it uses Web Crypto API
- [x] Check if any other dependencies use crypto internally
- [x] Replace jose with jsonwebtoken (Node.js 18 compatible)
- [x] Remove nanoid from package.json
