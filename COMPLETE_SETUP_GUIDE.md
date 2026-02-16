# 🔥 Skill Pips - Complete Platform Setup Guide

This guide will help you deploy the complete Skill Pips platform (frontend + backend).

## 📦 What You Have

### Frontend (10 files)
- HTML pages (index, pricing, checkout, login, dashboard, legal pages)
- CSS stylesheet (styles.css)
- JavaScript (script.js)
- README with frontend instructions

### Backend (Complete Node.js API)
- Express server with all routes
- PostgreSQL database setup
- Stripe & crypto payment integration
- Telegram bot service
- Email notifications
- Cron jobs for automation

## 🚀 Quick Start (Fastest Way)

### Step 1: Backend Deployment (20 minutes)

**Option A: Railway (Easiest)**
```bash
1. Go to https://railway.app
2. Sign up / Login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your backend folder
5. Add PostgreSQL database (click "+ New")
6. Add environment variables (copy from .env.example)
7. Click Deploy
8. Copy your backend URL (e.g., https://your-app.up.railway.app)
```

**Option B: DigitalOcean ($12/month)**
```bash
# See backend/README.md for detailed instructions
1. Create Ubuntu droplet
2. SSH and install Node.js + PostgreSQL
3. Clone repo and setup
4. Use PM2 to run server
5. Setup nginx + SSL
```

### Step 2: Frontend Deployment (10 minutes)

**Vercel (Free + Fast)**
```bash
1. Go to https://vercel.com
2. Import frontend folder from GitHub
3. Build settings: None needed (static HTML)
4. Add environment variable:
   NEXT_PUBLIC_API_URL = your_backend_url
5. Deploy
6. Done! You get: https://your-site.vercel.app
```

### Step 3: Connect Everything (15 minutes)

1. **Update Frontend API URLs**
   ```javascript
   // In checkout.html, login.html, dashboard.html
   // Replace: /api/endpoint
   // With: https://your-backend-url/api/endpoint
   ```

2. **Configure Webhooks**
   ```bash
   Stripe: https://your-backend-url/api/webhooks/stripe
   NOWPayments: https://your-backend-url/api/webhooks/nowpayments
   ```

3. **Setup Telegram Bot**
   ```bash
   1. Message @BotFather on Telegram
   2. Create new bot
   3. Add token to backend .env
   4. Create VIP group and add bot as admin
   ```

4. **Test Payment Flow**
   ```bash
   1. Go to your frontend
   2. Click pricing → select plan
   3. Use Stripe test card: 4242 4242 4242 4242
   4. Verify user receives email + Telegram invite
   ```

## 📋 Complete Setup Checklist

### Backend Setup ✅
- [ ] PostgreSQL database created
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Stripe API keys added
- [ ] Stripe webhook endpoint configured
- [ ] NOWPayments API key added (if using crypto)
- [ ] Telegram bot token added
- [ ] VIP Telegram group created
- [ ] Bot made admin in VIP group
- [ ] Email service configured (SendGrid or SMTP)
- [ ] Server running and health check passes

### Frontend Setup ✅
- [ ] Files uploaded to hosting
- [ ] API URLs updated to point to backend
- [ ] Stripe publishable key added
- [ ] Legal pages reviewed by lawyer
- [ ] Logo and branding updated
- [ ] Contact emails updated
- [ ] SSL certificate active (HTTPS)

### Payment Setup ✅
- [ ] Stripe products created
- [ ] Stripe prices created
- [ ] Webhook signing secret added
- [ ] Test payment successful
- [ ] Crypto payment tested (if enabled)

### Post-Launch ✅
- [ ] Test complete user flow
- [ ] Verify email delivery
- [ ] Test Telegram invite links
- [ ] Check subscription expiry automation
- [ ] Monitor server logs for errors
- [ ] Setup error monitoring (Sentry)
- [ ] Configure backups

## 🔧 Detailed Configuration

### 1. Stripe Setup (15 minutes)

```bash
1. Go to dashboard.stripe.com
2. Switch to Test mode
3. Create Products:
   - Gold Foundations: $14.80 (one-time)
   - Execution Blueprint: $45 (one-time)
   - VIP Execution Room: $39/month (recurring)
   - Everything Bundle: $69 (recurring)
4. Copy Price IDs to backend .env
5. Get API keys (Developers → API Keys)
6. Add webhook endpoint
7. Test with card: 4242 4242 4242 4242
```

### 2. Telegram Bot Setup (10 minutes)

```bash
1. Open Telegram, search @BotFather
2. Send: /newbot
3. Choose name: "Skill Pips Bot"
4. Choose username: "skillpips_bot"
5. Copy token to .env
6. Create new group for VIP members
7. Add your bot to group
8. Make bot admin with permissions:
   - Invite users via link
   - Ban users
9. Get group ID:
   - Add @getidsbot to group
   - Copy group ID (starts with -100)
   - Remove @getidsbot
10. Update TELEGRAM_VIP_GROUP_ID in .env
```

### 3. Email Setup (5 minutes)

**Option A: SendGrid (Recommended)**
```bash
1. Sign up at sendgrid.com
2. Verify your sender email
3. Create API key
4. Add to .env: SENDGRID_API_KEY
```

**Option B: Gmail SMTP**
```bash
1. Enable 2FA on Gmail
2. Generate App Password
3. Add to .env:
   SMTP_HOST=smtp.gmail.com
   SMTP_USER=your@gmail.com
   SMTP_PASSWORD=app_password
```

### 4. Database Setup (5 minutes)

```bash
# Local development
createdb skillpips

# Railway (automatic)
Just click "+ New" → PostgreSQL

# DigitalOcean
sudo -u postgres psql
CREATE DATABASE skillpips;
CREATE USER skillpips_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE skillpips TO skillpips_user;
\q
```

## 🧪 Testing Guide

### Test User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "username": "TestUser"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

### Test Health Check
```bash
curl http://localhost:5000/health
```

### Test Stripe Payment
```bash
# Use Stripe test cards
4242 4242 4242 4242 - Success
4000 0000 0000 9995 - Decline
```

## 🔒 Security Checklist

Before going live:
- [ ] All test API keys replaced with production keys
- [ ] .env file not committed to Git
- [ ] Strong passwords for database
- [ ] JWT_SECRET is 64+ random characters
- [ ] HTTPS enabled (SSL certificate)
- [ ] CORS configured to only allow your domain
- [ ] Rate limiting enabled
- [ ] Database backups configured
- [ ] Error monitoring setup (Sentry/LogRocket)
- [ ] Legal pages reviewed by lawyer
- [ ] Privacy policy GDPR compliant

## 📊 Monitoring

### Check Server Health
```bash
# Backend health
curl https://your-api.com/health

# Database connections
psql -U postgres -d skillpips -c "SELECT COUNT(*) FROM users;"

# Active subscriptions
psql -U postgres -d skillpips -c "SELECT COUNT(*) FROM subscriptions WHERE status='active';"
```

### View Logs
```bash
# Railway: View in dashboard
# PM2: pm2 logs
# Docker: docker logs container_name
```

### Key Metrics to Monitor
- Active subscriptions count
- Failed payment rate
- Churn rate
- New signups per day
- Email delivery rate
- Telegram bot uptime

## 🐛 Common Issues & Solutions

### "Database connection failed"
```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Test connection
psql -U postgres

# Check .env database credentials
```

### "Stripe webhook signature verification failed"
```bash
# Make sure STRIPE_WEBHOOK_SECRET matches Stripe dashboard
# Webhooks → Select endpoint → Signing secret
```

### "Telegram bot not responding"
```bash
# Test bot token
curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe

# Make sure bot is admin in VIP group
# Bot needs "Invite users via link" permission
```

### "Email not sending"
```bash
# Test email config
node -e "require('./services/email').testEmailConfig()"

# Check SendGrid API key is valid
# Check SMTP credentials if using SMTP
```

### "Webhook not receiving events"
```bash
# For local testing, use ngrok:
ngrok http 5000

# Use ngrok URL in webhook settings
# Example: https://abc123.ngrok.io/api/webhooks/stripe
```

## 💰 Cost Breakdown

### Monthly Operating Costs
- **Backend Hosting:** $12-25 (DigitalOcean) or $5-20 (Railway)
- **Frontend Hosting:** $0 (Vercel free tier)
- **Database:** Included in hosting or $15/month
- **Email:** $0-20 (SendGrid 100/day free, then $15/month)
- **Stripe Fees:** 2.9% + $0.30 per transaction
- **Crypto Fees:** ~0.5-1% per transaction
- **Total:** ~$20-50/month + transaction fees

### At Scale (100 users)
- Hosting: Same ($20-50)
- Stripe fees: ~$140/month (100 × $39 × 3.6%)
- Profit: ~$3,760/month ($3,900 revenue - $140 fees)

## 🚀 Launch Checklist

Day Before Launch:
- [ ] Test complete user journey
- [ ] Verify all emails are working
- [ ] Test payment with real credit card (refund after)
- [ ] Check Telegram invites work
- [ ] Review all legal pages
- [ ] Backup database
- [ ] Monitor logs for any errors

Launch Day:
- [ ] Switch Stripe to production mode
- [ ] Update all API keys to production
- [ ] Enable monitoring/alerts
- [ ] Post announcement
- [ ] Monitor first few signups closely

## 📞 Support

If you need help:
1. Check backend/README.md for detailed docs
2. Check frontend/README.md for frontend docs
3. Review error logs
4. Test individual components
5. Search GitHub issues

## 🎉 Next Steps After Launch

1. **Marketing:** Drive traffic to your site
2. **Content:** Keep VIP group active with daily analysis
3. **Support:** Respond quickly to member questions
4. **Iterate:** Gather feedback and improve
5. **Scale:** Add more features (courses, tools, etc.)

---

**You're all set!** 🔥 

Start with backend deployment, then frontend, then connect everything. Test thoroughly before launch.

Good luck with Skill Pips! 🚀
