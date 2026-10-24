const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email for registration
const sendRegistrationOTP = async (email, otp, name) => {
  const mailOptions = {
    from: `"RaktMap Blood Donation" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email - RaktMap Registration',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #DC2626; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #DC2626; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🩸 Welcome to RaktMap!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Thank you for registering with RaktMap Blood Donation System.</p>
            <p>To complete your registration and verify your email address, please use the following One-Time Password (OTP):</p>
            
            <div class="otp-box">
              <p style="margin: 0; font-size: 14px; color: #666;">Your OTP Code</p>
              <p class="otp-code">${otp}</p>
              <p style="margin: 0; font-size: 12px; color: #999;">Valid for 10 minutes</p>
            </div>
            
            <p><strong>Important:</strong></p>
            <ul>
              <li>This OTP is valid for 10 minutes only</li>
              <li>Do not share this code with anyone</li>
              <li>If you didn't request this, please ignore this email</li>
            </ul>
            
            <p>After verification, you'll be able to:</p>
            <ul>
              <li>Create blood requests</li>
              <li>View available donors on live map</li>
              <li>Track donation history</li>
              <li>Manage your hospital profile</li>
            </ul>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; 2025 RaktMap Blood Donation System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Registration OTP sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Error sending registration OTP:', error);
    throw error;
  }
};

// Send password reset OTP
const sendPasswordResetOTP = async (email, otp, name) => {
  const mailOptions = {
    from: `"RaktMap Blood Donation" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset Request - RaktMap',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #DC2626; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #DC2626; letter-spacing: 5px; }
          .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>We received a request to reset your password for your RaktMap account.</p>
            <p>To proceed with resetting your password, please use the following OTP:</p>
            
            <div class="otp-box">
              <p style="margin: 0; font-size: 14px; color: #666;">Your OTP Code</p>
              <p class="otp-code">${otp}</p>
              <p style="margin: 0; font-size: 12px; color: #999;">Valid for 10 minutes</p>
            </div>
            
            <div class="warning">
              <p style="margin: 0;"><strong>⚠️ Security Alert:</strong></p>
              <p style="margin: 5px 0 0 0;">If you didn't request a password reset, please ignore this email and ensure your account is secure.</p>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ol>
              <li>Enter this OTP on the password reset page</li>
              <li>Create a new strong password</li>
              <li>Log in with your new credentials</li>
            </ol>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; 2025 RaktMap Blood Donation System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Password reset OTP sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset OTP:', error);
    throw error;
  }
};

// Send donation certificate
const { generateCertificate } = require('../utils/certificateGenerator');

const sendDonationCertificate = async (email, donorName, donationDate, bloodGroup, donorId, units = 1) => {
  const formattedDate = new Date(donationDate).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const dayName = new Date(donationDate).toLocaleDateString('en-US', {
    weekday: 'long'
  });

  try {
    // Generate PDF certificate
    const pdfBuffer = await generateCertificate({
      donorName,
      donorId,
      bloodGroup,
      units,
      donationDate
    });

    const mailOptions = {
      from: `"RaktMap Blood Donation" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🏆 Certificate of Appreciation - Blood Donation',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              background: #f5f5f5;
              margin: 0;
              padding: 20px;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white;
              border-radius: 10px;
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 18px;
              margin-bottom: 20px;
            }
            .donor-name {
              color: #DC2626;
              font-weight: bold;
              font-size: 20px;
            }
            .message {
              background: #FEF3C7;
              border-left: 4px solid #F59E0B;
              padding: 20px;
              margin: 25px 0;
            }
            .details {
              background: #f9fafb;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: 600;
              color: #666;
            }
            .detail-value {
              color: #333;
            }
            .attachment-note {
              background: #EFF6FF;
              border: 2px dashed #3B82F6;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
              margin: 25px 0;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #666;
              font-size: 12px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🩸 Certificate of Appreciation</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">RaktMap Blood Donation System</p>
            </div>
            
            <div class="content">
              <div class="greeting">
                Dear <span class="donor-name">${donorName}</span>,
              </div>
              
              <p>
                Thank you for your noble contribution towards saving lives through blood donation. 
                Your selfless act on <strong>${dayName}, ${formattedDate}</strong> has made a real difference in our community.
              </p>
              
              <div class="message">
                <p style="margin: 0; font-size: 15px; font-style: italic;">
                  "A single donation can save up to three lives. Your generosity has given someone the precious gift of life. You are a true hero!"
                </p>
              </div>

              <div class="details">
                <div class="detail-row">
                  <span class="detail-label">Donor Name:</span>
                  <span class="detail-value">${donorName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Donor ID:</span>
                  <span class="detail-value">${donorId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Blood Group:</span>
                  <span class="detail-value">${bloodGroup}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Units Donated:</span>
                  <span class="detail-value">${units} Unit${units > 1 ? 's' : ''}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Donation Date:</span>
                  <span class="detail-value">${formattedDate}</span>
                </div>
              </div>

              <div class="attachment-note">
                <p style="margin: 0; font-weight: 600; color: #1E40AF;">
                  📎 Your official certificate is attached to this email
                </p>
                <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">
                  Please download and save the attached PDF certificate for your records
                </p>
              </div>

              <p>
                We are grateful for your continued support. Your contribution plays a vital role in our mission to ensure blood availability for those in need.
              </p>

              <p style="margin-top: 25px;">
                <strong>Keep saving lives!</strong><br>
                Team RaktMap
              </p>
            </div>

            <div class="footer">
              <p>This is an automated email from RaktMap Blood Donation System.</p>
              <p>&copy; 2026 RaktMap. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `Blood_Donation_Certificate_${donorName.replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Donation certificate sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Error sending donation certificate:', error);
    throw error;
  }
};

module.exports = {
  generateOTP,
  sendRegistrationOTP,
  sendPasswordResetOTP,
  sendDonationCertificate
};
