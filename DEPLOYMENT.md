# WASender Admin Portal - Railway Deployment Guide

## Prerequisites

- GitHub account with repository access
- Railway account (https://railway.app)
- MySQL database (Railway provides this)

## Repository Information

**GitHub Repository**: https://github.com/Hackstar1337/wasender-admin-portal-standalone

This is a complete standalone project with **no Manus dependencies**.

## Step 1: Create Railway Project

1. Go to https://railway.app and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose `Hackstar1337/wasender-admin-portal-standalone`
5. Railway will automatically detect the Node.js project

## Step 2: Add MySQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add MySQL"**
3. Railway will provision a MySQL database
4. The `DATABASE_URL` environment variable will be automatically injected

## Step 3: Configure Environment Variables

Add these environment variables in Railway Settings → Variables:

```bash
# Database (automatically provided by Railway MySQL)
DATABASE_URL=mysql://user:password@host:port/database

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secure-random-string-here

# Node Environment
NODE_ENV=production

# Port (Railway provides this automatically)
PORT=3000
```

### Generating JWT_SECRET

Run this command to generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 4: Deploy

1. Railway will automatically build and deploy your application
2. The build command is: `pnpm build`
3. The start command is: `pnpm start` (includes automatic database migrations)
4. Wait for deployment to complete (usually 2-5 minutes)

## Step 5: Access Your Application

1. Go to Railway project **Settings** → **Networking**
2. Click **"Generate Domain"** to get a public URL
3. Your app will be available at: `https://your-app-name.up.railway.app`

## Step 6: Create First Admin Account

1. Visit your deployed URL
2. Click **"Register"** tab on the login page
3. Create your admin account:
   - Name: Your name
   - Email: admin@yourdomain.com
   - Password: Secure password (min 6 characters)
4. First registered user automatically becomes admin

## Step 7: Create Agent Accounts

### Option 1: Direct Database Insert (Recommended for first agent)

Connect to your Railway MySQL database and run:

```sql
INSERT INTO users (name, email, password, role, login_method, created_at, updated_at, last_signed_in)
VALUES (
  'Agent Name',
  'agent@example.com',
  '$2a$10$hashed_password_here',  -- Use bcrypt to hash password
  'agent',
  'password',
  NOW(),
  NOW(),
  NOW()
);
```

### Option 2: Admin Registration Interface (Future Enhancement)

Currently, agents need to be created manually. You can add an admin interface to invite agents in a future update.

## Application Structure

### Routes

- `/` - Admin login page
- `/login` - Admin login (same as /)
- `/agent/login` - Agent login page
- `/admin` - Admin dashboard (requires admin role)
- `/agent` - Agent dashboard (requires agent role)

### API Endpoints

#### Authentication
- `POST /api/trpc/auth.adminLogin` - Admin login
- `POST /api/trpc/auth.agentLogin` - Agent login
- `POST /api/trpc/auth.register` - Register new admin
- `POST /api/trpc/auth.logout` - Logout
- `GET /api/trpc/auth.me` - Get current user

#### Webhook Accounts
- `POST /api/trpc/webhookAccounts.create` - Create webhook account
- `GET /api/trpc/webhookAccounts.list` - List all accounts
- `DELETE /api/trpc/webhookAccounts.delete` - Delete account

#### Webhook Endpoint
- `POST /api/webhook/:apiKey` - Receive WhatsApp messages

**Webhook Payload Format:**
```json
{
  "from": "+1234567890",
  "to": "+0987654321",
  "message": "Hello, this is a test message",
  "metadata": {
    "messageId": "optional-id",
    "timestamp": "2024-01-29T12:00:00Z"
  }
}
```

#### Webhook Logs
- `GET /api/trpc/webhookLogs.list` - List message logs

#### Agents
- `GET /api/trpc/agents.list` - List all agents

## Socket.IO Configuration

The application uses **Socket.IO for real-time messaging** with smart transport detection:

- **Development**: Uses polling + websocket with upgrade capability
- **Production**: Uses polling only (Cloudflare-compatible)

### Custom Domain Setup

Socket.IO is configured to work with custom domains. When you add a custom domain in Railway:

1. The CORS settings allow all origins (`origin: "*"`)
2. Transports are configured for maximum compatibility
3. No additional configuration needed

## Database Migrations

Migrations run automatically on deployment via the start script:

```bash
pnpm db:push && NODE_ENV=production node dist/index.js
```

This ensures your database schema is always up-to-date.

## Monitoring and Logs

### View Logs in Railway

1. Go to your Railway project
2. Click on your service
3. Navigate to **"Logs"** tab
4. Monitor real-time application logs

### Important Log Patterns

```
[Socket.IO] Server initialized - Socket.IO is running
[Socket.IO] Agent connected: email (ID: id) - Agent logged in
[Webhook] Error: - Webhook processing error
[Auth] JWT verification failed: - Authentication issue
```

## Troubleshooting

### Issue: Login button doesn't respond

**Solution**: Check browser console for errors. Ensure DATABASE_URL and JWT_SECRET are set correctly.

### Issue: Socket.IO not connecting

**Solution**: 
1. Check that the server is running (look for `[Socket.IO] Server initialized` in logs)
2. Verify agent is logged in (JWT token in localStorage)
3. Check browser console for connection errors

### Issue: Webhook returns 401 Unauthorized

**Solution**: 
1. Verify the API key is correct
2. Check that the webhook account status is "active"
3. Ensure the API key is passed in the URL: `/api/webhook/YOUR_API_KEY`

### Issue: Database connection failed

**Solution**:
1. Verify DATABASE_URL is set in Railway environment variables
2. Check MySQL database is running in Railway
3. Ensure database credentials are correct

### Issue: Build fails on Railway

**Solution**:
1. Check Railway build logs for specific errors
2. Ensure all dependencies are in package.json
3. Verify Node.js version compatibility (18+)

## Security Considerations

### Production Checklist

- [ ] Change JWT_SECRET to a strong random value
- [ ] Use HTTPS (Railway provides this automatically)
- [ ] Regularly rotate API keys for webhook accounts
- [ ] Monitor webhook logs for suspicious activity
- [ ] Set up database backups in Railway
- [ ] Implement rate limiting for webhook endpoints (future enhancement)
- [ ] Add IP whitelisting for webhook endpoints (future enhancement)

### Password Security

- Passwords are hashed using bcryptjs with 10 salt rounds
- JWT tokens expire based on session configuration
- Cookies are httpOnly and secure in production

## Scaling Considerations

### Horizontal Scaling

Railway supports horizontal scaling. To scale:

1. Go to Railway project **Settings**
2. Adjust **"Replicas"** count
3. Socket.IO will work across multiple instances (uses in-memory store)

**Note**: For production with multiple replicas, consider using Redis adapter for Socket.IO.

### Database Optimization

- Add indexes to frequently queried columns
- Monitor slow queries in Railway metrics
- Consider connection pooling for high traffic

## Backup and Recovery

### Database Backups

Railway provides automatic daily backups. To restore:

1. Go to Railway MySQL service
2. Navigate to **"Backups"** tab
3. Select backup and restore

### Manual Backup

```bash
# Export database
mysqldump -h host -u user -p database > backup.sql

# Import database
mysql -h host -u user -p database < backup.sql
```

## Support and Maintenance

### Updating the Application

1. Make changes to your local repository
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update description"
   git push origin main
   ```
3. Railway will automatically redeploy

### Monitoring

- Set up Railway notifications for deployment failures
- Monitor database size and connection count
- Track webhook endpoint response times

## Next Steps

1. **Add webhook testing interface**: Build UI to test webhooks before going live
2. **Implement agent registration**: Create admin interface to invite agents
3. **Add message templates**: Pre-defined responses for common queries
4. **Implement file uploads**: Support for images and documents in messages
5. **Add analytics dashboard**: Track message volume, response times, agent performance
6. **Set up Redis for Socket.IO**: Enable multi-instance scaling
7. **Implement rate limiting**: Protect webhook endpoints from abuse
8. **Add email notifications**: Alert admins of system events

## Additional Resources

- Railway Documentation: https://docs.railway.app
- Socket.IO Documentation: https://socket.io/docs/v4/
- tRPC Documentation: https://trpc.io/docs
- Drizzle ORM Documentation: https://orm.drizzle.team

---

**Project Repository**: https://github.com/Hackstar1337/wasender-admin-portal-standalone

For issues or questions, refer to the repository README or create an issue on GitHub.
