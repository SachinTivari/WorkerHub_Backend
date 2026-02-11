# Email Notification Setup Guide

WorkerHub uses Nodemailer for sending email notifications. Follow this guide to enable email features.

## Quick Setup (Gmail)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com
2. Navigate to **Security** → **2-Step Verification**
3. Enable 2-Step Verification

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select **Mail** as the app
3. Select **Windows Computer** as the device
4. Click **Generate**
5. Copy the 16-character password (shown with spaces)

### Step 3: Configure Environment Variables

**Option A: Command Line (Temporary)**
```powershell
# Windows PowerShell
$env:EMAIL_USER="your-email@gmail.com"
$env:EMAIL_PASS="your-app-password"
node server.js
```

**Option B: Create .env file (Recommended)**
Create a `.env` file in the Backend folder:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your16charpassword
```

Then install dotenv and update server.js:
```bash
npm install dotenv
```

Add this at the top of server.js:
```javascript
require('dotenv').config()
```

## Test Email Configuration

Once configured, test your email setup:

```bash
# Using curl
curl -X POST http://localhost:5000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'
```

Or visit: `GET http://localhost:5000/api/email/status`

## Email Notifications

When configured, WorkerHub sends emails for:

| Event | Recipient | Description |
|-------|-----------|-------------|
| User Signup | User | Welcome email with account details |
| Worker Registration | Worker | Confirmation with profile details |
| New Booking | User | Booking confirmation with details |
| New Booking | Worker | Notification about new job request |
| Booking Status Update | User | Updates when status changes |
| Password Reset | User/Worker | Confirmation of password change |

## Troubleshooting

### "Email skipped (not configured)"
- Check that EMAIL_USER and EMAIL_PASS are set correctly
- Make sure EMAIL_USER is not "your-email@gmail.com"

### "Error: Invalid login"
- Verify you're using an App Password, not your regular password
- Check if 2-Factor Authentication is enabled

### "Error: Less secure app access"
- Google blocks "less secure apps" by default
- Use App Passwords instead (requires 2FA)

## Alternative Email Providers

For other SMTP providers, modify the transporter configuration in `server.js`:

```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.yourprovider.com',
  port: 587,
  secure: false, // true for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})
```

Common SMTP settings:
- **Outlook**: smtp.office365.com, port 587
- **Yahoo**: smtp.mail.yahoo.com, port 465
- **SendGrid**: smtp.sendgrid.net, port 587

