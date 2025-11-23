// Quick Email Configuration Test
// Run this with: node test-email-config.js
// This will check if your email credentials are configured

const nodemailer = require('nodemailer');

async function testEmailConfig() {
  console.log('🔍 Testing Email Configuration...\n');

  // Check environment variables
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;

  console.log('Environment Variables:');
  console.log('✓ GMAIL_USER:', gmailUser ? '✅ SET' : '❌ MISSING');
  console.log('✓ GMAIL_APP_PASSWORD:', gmailPassword ? '✅ SET' : '❌ MISSING');
  console.log('');

  if (!gmailUser || !gmailPassword) {
    console.log('❌ Email credentials not configured!');
    console.log('\nTo fix this:');
    console.log('1. Create a .env.local file in the project root');
    console.log('2. Add these lines:');
    console.log('   GMAIL_USER=your-email@gmail.com');
    console.log('   GMAIL_APP_PASSWORD=your-16-char-app-password');
    console.log('\nFor production (Vercel):');
    console.log('1. Go to Vercel Dashboard → Settings → Environment Variables');
    console.log('2. Add GMAIL_USER and GMAIL_APP_PASSWORD');
    console.log('3. Redeploy your application');
    return;
  }

  // Try to create transporter
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
    });

    console.log('✅ Email transporter created successfully!');
    console.log('\n🧪 Testing connection to Gmail...');

    // Verify connection
    await transporter.verify();
    console.log('✅ Successfully connected to Gmail!');
    console.log('\n🎉 Email configuration is working correctly!');
    console.log('\nYou can now:');
    console.log('1. Deploy to Vercel (if not already done)');
    console.log('2. Make a test booking');
    console.log('3. Check if email arrives');

  } catch (error) {
    console.log('❌ Email configuration error:');
    console.log('Error:', error.message);
    console.log('\nCommon issues:');
    console.log('- Using regular password instead of App Password');
    console.log('- App Password has spaces (remove them)');
    console.log('- 2FA not enabled on Gmail account');
    console.log('\nHow to fix:');
    console.log('1. Go to Google Account → Security');
    console.log('2. Enable 2-Step Verification');
    console.log('3. Go to App Passwords');
    console.log('4. Generate new password for "Mail"');
    console.log('5. Use that 16-character password');
  }
}

testEmailConfig().catch(console.error);
