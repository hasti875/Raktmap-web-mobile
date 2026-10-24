const axios = require('axios');
const Settings = require('../models/Settings');

const DEFAULT_WHATSAPP_API_URL = 'https://wh.cryptonixtechnology.in/send-message';

const normalizeRecipientNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  const cleaned = phoneNumber.toString().trim().replace(/[^\d+]/g, '');
  return cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
};

const normalizeSenderNumber = (sender) => {
  if (!sender) return '';
  const cleaned = sender.toString().trim().replace(/[^\d+]/g, '');
  return cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
};

const resolveProviderConfig = (settings = {}, overrideConfig = {}) => {
  const apiUrl =
    overrideConfig.apiUrl ||
    process.env.WHATSAPP_API_URL ||
    process.env.SMS_API_URL ||
    DEFAULT_WHATSAPP_API_URL;

  const apiKey =
    overrideConfig.apiKey ||
    overrideConfig.authToken ||
    process.env.WHATSAPP_API_KEY ||
    settings.smsApiKey ||
    process.env.SMS_API_KEY ||
    process.env.TWILIO_AUTH_TOKEN ||
    '';

  const senderRaw =
    overrideConfig.sender ||
    overrideConfig.phoneNumber ||
    process.env.WHATSAPP_SENDER ||
    settings.smsPhoneNumber ||
    process.env.SMS_SENDER ||
    settings.smsAccountSid ||
    process.env.TWILIO_PHONE_NUMBER ||
    '';
  const sender = normalizeSenderNumber(senderRaw);

  const footer = overrideConfig.footer || process.env.WHATSAPP_DEFAULT_FOOTER || '';

  return { apiUrl, apiKey, sender, footer };
};

const sendUsingProvider = async (to, message, overrideConfig = {}) => {
  const settings = await Settings.getSettings();
  const { apiUrl, apiKey, sender, footer } = resolveProviderConfig(settings, overrideConfig);

  if (!apiKey) {
    throw new Error('SMS API key is not configured. Please update settings or environment variables.');
  }
  if (!sender) {
    throw new Error('SMS sender is not configured. Please update settings or environment variables.');
  }

  const number = normalizeRecipientNumber(to);
  if (!number) {
    throw new Error('Recipient phone number is missing or invalid.');
  }

  const payload = {
    api_key: apiKey,
    sender,
    number,
    message,
  };

  if (footer) {
    payload.footer = footer;
  }

  if (overrideConfig.msgid) {
    payload.msgid = overrideConfig.msgid;
  }

  if (overrideConfig.full) {
    payload.full = Number(overrideConfig.full);
  }

  console.log('📱 Sending message via Cryptonix API:', {
    apiUrl,
    sender,
    number,
    messageLength: message.length,
  });

  const response = await axios.post(apiUrl, payload, {
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = response.data || {};
  if (!data.status) {
    throw new Error(data.message || 'Provider returned an unsuccessful response');
  }

  return {
    success: true,
    sid: data?.data?.key?.id || undefined,
    providerResponse: data,
  };
};

const sendSMS = async (to, message) => {
  try {
    console.log(`📱 Attempting to send SMS to ${to}`);
    const result = await sendUsingProvider(to, message);
    console.log('✅ SMS sent successfully via Cryptonix API');
    return result;
  } catch (error) {
    const providerMessage = error.response?.data?.msg || error.message;
    console.error('❌ Error sending SMS:', providerMessage);
    return { success: false, error: providerMessage };
  }
};

// Send SMS with custom configuration (for testing)
const sendSMSWithConfig = async (to, message, config) => {
  try {
    const mappedConfig = {
      apiKey: config.apiKey || config.authToken,
      sender: config.sender || config.phoneNumber || config.accountSid,
      apiUrl: config.apiUrl,
      full: config.full,
      msgid: config.msgid,
      footer: config.footer,
    };

    console.log('🔧 SMS Test Config:', {
      apiUrl: mappedConfig.apiUrl || process.env.WHATSAPP_API_URL || DEFAULT_WHATSAPP_API_URL,
      apiKey: mappedConfig.apiKey ? 'configured' : 'MISSING',
      sender: mappedConfig.sender || 'MISSING',
      to: to,
      messageLength: message.length,
    });

    const result = await sendUsingProvider(to, message, mappedConfig);
    console.log('✅ Test SMS sent successfully');
    return result;
  } catch (error) {
    console.error('❌ Error sending test SMS:', error);
    const providerError = error.response?.data;
    if (providerError) {
      console.error('❌ Provider error response:', providerError);
    }
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

// Kept for backward compatibility with existing callers.
const refreshTwilioClient = async () => {
  return true;
};

module.exports = {
  sendSMS,
  sendSMSWithConfig,
  getSMSTemplate,
  formatSMSMessage,
  refreshTwilioClient
};
