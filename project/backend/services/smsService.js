const twilio = require('twilio');
const Settings = require('../models/Settings');

// Initialize Twilio client with your credentials (fallback to env variables)
let client = null;

const initializeTwilioClient = async () => {
  try {
    console.log('🔧 Initializing Twilio client...');
    const settings = await Settings.getSettings();

    // Get credentials with proper fallback
    const accountSid = (settings.smsAccountSid && settings.smsAccountSid.trim() !== '')
      ? settings.smsAccountSid
      : process.env.TWILIO_ACCOUNT_SID;
    const authToken = (settings.smsApiKey && settings.smsApiKey.trim() !== '')
      ? settings.smsApiKey
      : process.env.TWILIO_AUTH_TOKEN;

    console.log('🔧 Credentials check:', {
      dbAccountSid: settings.smsAccountSid ? 'found' : 'empty',
      dbAuthToken: settings.smsApiKey ? 'found' : 'empty',
      envAccountSid: process.env.TWILIO_ACCOUNT_SID ? 'found' : 'missing',
      envAuthToken: process.env.TWILIO_AUTH_TOKEN ? 'found' : 'missing',
      usingAccountSid: accountSid ? accountSid.substring(0, 8) + '...' : 'none',
      usingAuthToken: authToken ? 'found' : 'none'
    });

    if (accountSid && authToken) {
      client = twilio(accountSid, authToken);
      const source = (settings.smsAccountSid && settings.smsApiKey) ? 'database' : 'environment';
      console.log(`✅ Twilio client initialized with ${source} credentials`);
    } else {
      console.error('❌ Twilio credentials not found in database or environment variables');
      throw new Error('Missing Twilio credentials');
    }
  } catch (error) {
    console.error('❌ Error initializing Twilio client:', error.message);
    // Force fallback to environment variables
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (accountSid && authToken) {
      client = twilio(accountSid, authToken);
      console.log('✅ Twilio client initialized with environment variables (fallback)');
    } else {
      console.error('❌ Environment variable fallback also failed');
    }
  }
};

// Initialize client on startup - Force environment variables for now
const forceEnvInitialization = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  console.log('🔧 Force initializing with environment variables...');
  console.log('🔧 Env check:', {
    accountSid: accountSid ? accountSid.substring(0, 8) + '...' : 'missing',
    authToken: authToken ? 'found' : 'missing',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'missing'
  });

  if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
    console.log('✅ Twilio client force-initialized with environment variables');
  } else {
    console.error('❌ Environment variables missing for Twilio');
  }
};

// Use environment variables directly for now
forceEnvInitialization();

const sendSMS = async (to, message) => {
  try {
    console.log(`📱 Attempting to send SMS to ${to}`);

    // Format phone number to E.164 format (required by Twilio)
    let formattedPhone = to;
    if (to) {
      // Remove all non-digit characters
      let cleaned = to.toString().replace(/\D/g, '');

      // If it starts with 91 and is 12 digits, add +
      if (cleaned.startsWith('91') && cleaned.length === 12) {
        formattedPhone = '+' + cleaned;
      }
      // If it's 10 digits, add India country code (+91)
      else if (cleaned.length === 10) {
        formattedPhone = '+91' + cleaned;
      }
      // If it already starts with +, use as is
      else if (to.toString().startsWith('+')) {
        formattedPhone = to.toString();
      }
      // Default: assume it needs +91
      else {
        formattedPhone = '+91' + cleaned;
      }
    }

    console.log(`📞 Formatted phone: ${to} -> ${formattedPhone}`);

    // Reinitialize client to get latest settings
    if (!client) {
      console.log('🔧 Client not initialized, initializing now...');
      await initializeTwilioClient();
    }

    if (!client) {
      throw new Error('Twilio client not initialized. Please check SMS configuration.');
    }

    // For now, use environment variables directly
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!fromNumber) {
      throw new Error('SMS phone number not configured in database or environment variables');
    }

    console.log(`📞 Sending SMS from ${fromNumber} to ${formattedPhone}`);
    console.log(`📝 Message length: ${message.length} characters`);

    const response = await client.messages.create({
      body: message,
      to: formattedPhone,
      from: fromNumber
    });

    console.log('✅ SMS sent successfully:', response.sid);
    return { success: true, sid: response.sid };
  } catch (error) {
    console.error('❌ Error sending SMS:', error);
    return { success: false, error: error.message };
  }
};

// Send SMS with custom configuration (for testing)
const sendSMSWithConfig = async (to, message, config) => {
  try {
    console.log('🔧 SMS Test Config:', {
      accountSid: config.accountSid ? `${config.accountSid.substring(0, 8)}...` : 'MISSING',
      authToken: config.authToken ? `${config.authToken.substring(0, 8)}...` : 'MISSING',
      phoneNumber: config.phoneNumber || 'MISSING',
      to: to,
      messageLength: message.length
    });

    if (!config.accountSid || !config.authToken || !config.phoneNumber) {
      throw new Error('Missing required Twilio configuration: accountSid, authToken, or phoneNumber');
    }

    const testClient = twilio(config.accountSid, config.authToken);

    const response = await testClient.messages.create({
      body: message,
      to,
      from: config.phoneNumber
    });
    console.log('✅ Test SMS sent successfully:', response.sid);
    return { success: true, sid: response.sid };
  } catch (error) {
    console.error('❌ Error sending test SMS:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.status
    });
    return { success: false, error: error.message };
  }
};

// Get SMS template based on priority
const getSMSTemplate = async (priority = 'normal') => {
  try {
    const settings = await Settings.getSettings();
    return priority === 'high'
      ? settings.smsTemplateHighPriority
      : settings.smsTemplateNormalPriority;
  } catch (error) {
    console.error('Error getting SMS template:', error);
    // Fallback templates
    return priority === 'high'
      ? '🚨 URGENT: {quantity} units {bloodType} blood needed at {hospital}. Your donation can save a life! Please respond: {responseUrl}'
      : 'Blood donation request from {hospital}. {quantity} units {bloodType} blood needed. Can you help save a life? Respond: {responseUrl}';
  }
};

// Format SMS message with template variables
const formatSMSMessage = (template, variables) => {
  let message = template;
  Object.keys(variables).forEach(key => {
    const placeholder = `{${key}}`;
    message = message.replace(new RegExp(placeholder, 'g'), variables[key]);
  });
  return message;
};

// Refresh Twilio client with new settings
const refreshTwilioClient = async () => {
  await initializeTwilioClient();
};

module.exports = {
  sendSMS,
  sendSMSWithConfig,
  getSMSTemplate,
  formatSMSMessage,
  refreshTwilioClient
};
