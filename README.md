# Skill Pips Backend API

Complete Node.js backend for the Skill Pips trading education platform with Stripe subscriptions, crypto payments, and Telegram bot integration.

## 🚀 Features

- ✅ User authentication (JWT)
- ✅ Stripe payment processing & subscriptions
- ✅ Cryptocurrency payments (NOWPayments)
- ✅ Telegram bot for VIP group management
- ✅ Automated subscription expiry checks
- ✅ Email notifications (SendGrid/SMTP)
- ✅ PostgreSQL database
- ✅ RESTful API endpoints
- ✅ Webhook handling (Stripe & Crypto)
- ✅ Cron jobs for automation

## 📦 Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL
- **Authentication:** JWT
- **Payments:** Stripe, NOWPayments
- **Bot:** Telegram Bot API
- **Email:** SendGrid / SMTP

## 🛠️ Installation

### 1. Prerequisites

```bash
# Install Node.js 18+ and npm
node --version  # Should be v18+
npm --version

# Install PostgreSQL
# Mac: brew install postgresql
# Ubuntu: sudo apt-get install postgresql
# Windows: Download from postgresql.org
```

### 2. Clone & Install Dependencies

```bash
cd backend
npm install
```

### 3. Environment Setup

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
nano .env  # or use your preferred editor
```

**Required Environment Variables:**

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skillpips
DB_USER=postgres
DB_PASSWORD=your_secure_password

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your_generated_secret_here

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_VIP_GROUP_ID=-1001234567890

# Email (choose one)
SENDGRID_API_KEY=SG.xxx  # Recommended
# OR
SMTP_HOST=smtp.gmail.com
SMTP_USER=your@email.com
SMTP_PASSWORD=your_app_password
```

### 4. Database Setup

```bash
# Create database
createdb skillpips

# Run migrations
npm run migrate

# (Optional) Seed test data
npm run seed
```

### 5. Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will start on `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── server.js                 # Main entry point
├── package.json             # Dependencies
├── .env                     # Environment variables
├── database/
│   ├── db.js               # PostgreSQL connection
│   ├── migrate.js          # Database schema
│   └── seed.js             # Test data (optional)
├── routes/
│   ├── auth.js             # Login, register, password reset
│   ├── user.js             # User profile, dashboard
│   ├── stripe.js           # Stripe payments
│   ├── crypto.js           # Crypto payments
│   └── webhooks.js         # Payment webhooks
├── services/
│   ├── telegram.js         # Telegram bot logic
│   ├── email.js            # Email sending
│   └── subscriptions.js    # Subscription management
└── middleware/
    └── auth.js             # JWT authentication
```

## 🔧 Configuration

### Stripe Setup

1. **Get API Keys**
   - Go to https://dashboard.stripe.com/apikeys
   - Copy Secret Key to `STRIPE_SECRET_KEY`
   - Copy Publishable Key (for frontend)

2. **Create Products & Prices**
   ```
   Products to create in Stripe Dashboard:
   - Gold Foundations ($14.80)
   - Execution Blueprint ($45.00)
   - VIP Execution Room ($39/month recurring)
   - Everything Bundle ($69 first, then $39/month)
   ```

3. **Setup Webhooks**
   - Go to https://dashboard.stripe.com/webhooks
   - Add endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Select events:
     - `payment_intent.succeeded`
     - `invoice.paid`
     - `invoice.payment_failed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### NOWPayments Setup

1. Register at https://nowpayments.io/
2. Get API key from dashboard
3. Set IPN callback: `https://your-domain.com/api/webhooks/nowpayments`
4. Copy API key to `NOWPAYMENTS_API_KEY`
5. Copy IPN secret to `NOWPAYMENTS_IPN_SECRET`

### Telegram Bot Setup

1. **Create Bot**
   ```
   1. Message @BotFather on Telegram
   2. Send /newbot
   3. Follow instructions
   4. Copy token to TELEGRAM_BOT_TOKEN
   ```

2. **Create VIP Group**
   ```
   1. Create a Telegram group
   2. Add your bot as admin
   3. Give permissions: Invite users, Ban users
   4. Get group ID (use @getidsbot)
   5. Copy ID to TELEGRAM_VIP_GROUP_ID
   ```

### Email Setup (Choose One)

**Option A: SendGrid (Recommended)**
```bash
1. Sign up at https://sendgrid.com
2. Create API key
3. Set SENDGRID_API_KEY in .env
```

**Option B: Gmail SMTP**
```bash
1. Enable 2FA on your Gmail account
2. Generate App Password
3. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD in .env
```

## 🔐 Security Checklist

Before going to production:

- [ ] Change all default passwords
- [ ] Use production Stripe keys (not test keys)
- [ ] Enable HTTPS (SSL certificate)
- [ ] Set strong JWT_SECRET (64+ random characters)
- [ ] Configure firewall (allow only necessary ports)
- [ ] Set up database backups
- [ ] Enable rate limiting (already configured)
- [ ] Review CORS origins
- [ ] Set NODE_ENV=production
- [ ] Never commit .env file to git

## 🚀 Deployment

### Option 1: DigitalOcean (Recommended)

1. **Create Droplet**
   ```bash
   # Ubuntu 22.04, minimum $12/month
   ```

2. **Setup Server**
   ```bash
   ssh root@your-server-ip
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PostgreSQL
   sudo apt-get install postgresql postgresql-contrib
   
   # Install PM2
   npm install -g pm2
   ```

3. **Deploy Code**
   ```bash
   git clone your-repo
   cd backend
   npm install --production
   cp .env.example .env
   nano .env  # Fill in production values
   ```

4. **Start with PM2**
   ```bash
   npm run migrate  # Setup database
   pm2 start server.js --name skillpips-api
   pm2 startup  # Auto-start on reboot
   pm2 save
   ```

5. **Setup Nginx Reverse Proxy**
   ```nginx
   server {
       listen 80;
       server_name api.skillpips.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **SSL Certificate**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.skillpips.com
   ```

### Option 2: Railway (Easiest)

1. Go to https://railway.app
2. Connect GitHub repo
3. Add PostgreSQL database
4. Set environment variables
5. Deploy automatically

## 📊 API Endpoints

### Authentication
```
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # Login
POST   /api/auth/forgot-password   # Request password reset
POST   /api/auth/reset-password    # Reset password
```

### User
```
GET    /api/user/dashboard         # Get dashboard data
GET    /api/user/subscription      # Get subscription details
POST   /api/user/update-telegram   # Update Telegram username
GET    /api/user/activity          # Get activity log
```

### Payments
```
POST   /api/stripe/create-payment-intent     # Create payment
POST   /api/stripe/create-subscription       # Create subscription
POST   /api/stripe/cancel-subscription       # Cancel subscription
GET    /api/stripe/customer-portal           # Get portal link

POST   /api/crypto/create-payment            # Create crypto payment
GET    /api/crypto/payment-status/:id        # Check payment status
```

### Webhooks
```
POST   /api/webhooks/stripe                  # Stripe webhooks
POST   /api/webhooks/nowpayments             # Crypto webhooks
```

## 🤖 Telegram Bot Commands

Users can use these commands in Telegram:

- `/start` - Welcome message
- `/status` - Check subscription status
- `/renew` - Get renewal link
- `/support` - Contact support
- `/verify <payment_id>` - Verify crypto payment

## 📈 Monitoring

### View Logs
```bash
# PM2 logs
pm2 logs skillpips-api

# Database connections
psql -U postgres -d skillpips -c "SELECT COUNT(*) FROM users;"
```

### Check Health
```bash
curl http://localhost:5000/health
```

### Subscription Stats
```javascript
// Add this endpoint to server.js for admin dashboard
const { getSubscriptionStats } = require('./services/subscriptions');

app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  const stats = await getSubscriptionStats();
  res.json(stats);
});
```

## 🔄 Cron Jobs

The server automatically runs these jobs:

- **Daily at 12:00 AM UTC** - Check expired subscriptions
- **Daily at 6:00 AM UTC** - Send renewal reminders

Jobs are configured in `server.js` using `node-cron`.

## 🧪 Testing

```bash
# Test database connection
node -e "require('./database/db').pool.query('SELECT NOW()').then(r => console.log('✅ DB OK:', r.rows[0]))"

# Test email
node -e "require('./services/email').testEmailConfig()"

# Test Stripe connection
node -e "const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); stripe.customers.list({limit: 1}).then(() => console.log('✅ Stripe OK'))"
```

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Test connection
psql -U postgres -d skillpips -c "SELECT 1;"
```

### Telegram Bot Not Responding
```bash
# Check bot token
curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe

# Check if bot is admin in group
# Add bot to group and make it admin
```

### Webhook Not Working
```bash
# Test webhook locally with ngrok
ngrok http 5000

# Use ngrok URL in Stripe/NOWPayments webhook settings
# Example: https://abc123.ngrok.io/api/webhooks/stripe
```

## 📝 Development

### Add New Endpoint
```javascript
// routes/example.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

router.get('/test', authenticateToken, async (req, res) => {
  res.json({ message: 'Hello!', user: req.user });
});

module.exports = router;

// Add to server.js
app.use('/api/example', require('./routes/example'));
```

### Database Query Example
```javascript
const { query } = require('./database/db');

const result = await query(
  'SELECT * FROM users WHERE email = $1',
  ['user@example.com']
);
console.log(result.rows);
```

## 🆘 Support

- **Email:** dev@skillpips.com
- **Issues:** GitHub Issues
- **Docs:** See comments in code files

## 📄 License

MIT

---

**Built for Skill Pips** | Professional Trading Education Platform  
**Version:** 1.0.0 | **Node.js:** 18+ | **PostgreSQL:** 14+
