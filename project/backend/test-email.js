require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('📧 Testing Email Configuration...\n');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'NOT SET');
console.log('PASSWORD LENGTH:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);
console.log('\n');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify connection
transporter.verify(function (error, success) {
  if (error) {
    console.log('❌ Email connection failed:');
    console.log(error);
    console.log('\n🔧 TROUBLESHOOTING STEPS:');
    console.log('1. Go to https://myaccount.google.com/security');
    console.log('2. Enable 2-Step Verification if not enabled');
    console.log('3. Go to https://myaccount.google.com/apppasswords');
    console.log('4. Create a new App Password for "Mail"');
    console.log('5. Copy the 16-character password (REMOVE ALL SPACES)');
    console.log('6. Update EMAIL_PASS in .env file');
    console.log('7. Restart the server');
  } else {
    console.log('✅ Email server is ready to send messages!');
    console.log('✅ Gmail SMTP connection successful');
    
    // Send test email
    const mailOptions = {
      from: `"RaktMap Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to self
      subject: 'RaktMap Email Test',
      text: 'If you receive this email, your email configuration is working correctly!',
      html: '<h2>✅ Email Configuration Success!</h2><p>Your RaktMap email service is working correctly.</p>'
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('❌ Failed to send test email:', error);
      } else {
        console.log('✅ Test email sent successfully!');
        console.log('📬 Check your inbox:', process.env.EMAIL_USER);
      }
      process.exit(0);
    });
  }
});
