# WASender API Integration Notes

## Credentials Provided
- **API Base URL**: https://wasenderapi.com/whatsapp
- **API Key**: 3b763283ad8f801266639c679400f0e80ee2a452150ff58c441479b0591ad2e1
- **Webhook Key**: 165a269286b3e49c924bb3573704a672

## Key API Endpoints

### Authentication
- Uses Bearer Token authentication
- Header: `Authorization: Bearer {api_key}`

### Sessions Management
- `GET /api/whatsapp-sessions` - Get all sessions
- `POST /api/whatsapp-sessions` - Create new session
- `GET /api/whatsapp-sessions/{id}` - Get session details
- `PUT /api/whatsapp-sessions/{id}` - Update session
- `DELETE /api/whatsapp-sessions/{id}` - Delete session
- `POST /api/whatsapp-sessions/{id}/connect` - Connect session
- `POST /api/whatsapp-sessions/{id}/disconnect` - Disconnect session
- `GET /api/whatsapp-sessions/{id}/qrcode` - Get QR code for connection
- `GET /api/status` - Get session status

### Messaging
- `POST /api/send-text` - Send text message
- `POST /api/send-image` - Send image message
- `POST /api/send-video` - Send video message
- `POST /api/send-document` - Send document message
- `POST /api/send-audio` - Send audio message
- `POST /api/send-location` - Send location
- `POST /api/send-contact` - Send contact card
- `POST /api/send-poll` - Send poll message
- `POST /api/send-quoted` - Send quoted message
- `POST /api/edit-message` - Edit a message
- `DELETE /api/delete-message` - Delete a message

### Webhooks
The API sends webhook events for:
- Message Received (personal & group)
- Message Sent
- Message Status Update
- Message Deleted
- Message Reaction
- Contact Update
- Group Update
- Session Status
- QR Code Updated
- Call Received
- Poll Results

### Webhook Payload Structure
Messages come with a flattened JSON structure with a unified `messageBody` field.

## Integration Points for Our Admin Portal

1. **Webhook Account Management**
   - Store API key and webhook key in `webhook_accounts` table
   - Each account represents a WhatsApp session from WASender

2. **Incoming Messages (Webhook Receiver)**
   - Endpoint: `POST /api/webhook` (our server)
   - Receives messages from WASender
   - Stores in `messages` and `conversations` tables
   - Notifies agents via Socket.IO

3. **Outgoing Messages (Agent Sends)**
   - Agent sends message from dashboard
   - Our server calls WASender API `/api/send-text`
   - Stores sent message in database
   - Updates conversation

4. **Session Management**
   - Admin can view session status
   - Admin can connect/disconnect sessions
   - QR code display for new sessions

## Next Steps for Full Integration

1. ✅ Database schema complete
2. ✅ Admin dashboard complete
3. ✅ Agent dashboard complete
4. ⏳ Implement webhook receiver endpoint
5. ⏳ Implement WASender API client functions
6. ⏳ Test end-to-end message flow
