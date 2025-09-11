const twilio = require('twilio');

// Initialize Twilio client with your credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const sendSMS = async (to, message) => {
  try {
    const response = await client.messages.create({
      body: message,
      to, // Text this number
      from: process.env.TWILIO_PHONE_NUMBER // From a valid Twilio number
    });
    console.log('SMS sent successfully:', response.sid);
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
};

module.exports = { sendSMS };
