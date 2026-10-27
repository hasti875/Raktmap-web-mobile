const axios = require('axios');
const mongoose = require('mongoose');
const Settings = require('../models/Settings');

const DEFAULT_NIRMAAN_GATEWAY_URL = 'https://chat.cryptonixtechnology.in';

const getSettingsSafe = async () => {
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      return await Settings.getSettings();
    }
  } catch (err) {
    console.warn('⚠️ Could not load settings from DB, using environment fallback:', err.message);
  }
  return {};
};

/**
 * Normalizes a phone number to WhatsApp JID format: {countryCode}{number}@s.whatsapp.net
 * e.g. "9909055454" -> "919909055454@s.whatsapp.net"
 *      "+91 99090 55454" -> "919909055454@s.whatsapp.net"
 */
const toWhatsAppJid = (phoneNumber) => {
  if (!phoneNumber) return '';
  let str = phoneNumber.toString().trim();

  // If already in JID format
  if (str.includes('@s.whatsapp.net')) {
    return str;
  }

  // Strip all non-digit characters
  let digits = str.replace(/[^\d]/g, '');

  // Remove leading 0 if present (common local dialing in India: 09876543210)
  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }

  // If 10 digits (standard Indian mobile format), default to country code 91
  if (digits.length === 10) {
    digits = `91${digits}`;
  }

  return `${digits}@s.whatsapp.net`;
};

/**
 * Resolves gateway configuration from DB settings, environment, or explicit overrides.
 */
const resolveProviderConfig = (settings = {}, overrideConfig = {}) => {
  const gatewayUrl =
    overrideConfig.gatewayUrl ||
    overrideConfig.apiUrl ||
    process.env.NIRMAAN_GATEWAY_URL ||
    process.env.WHATSAPP_API_URL ||
    settings.smsGatewayUrl ||
    DEFAULT_NIRMAAN_GATEWAY_URL;

  const apiKey =
    overrideConfig.apiKey ||
    overrideConfig.authToken ||
    process.env.NIRMAAN_API_KEY ||
    process.env.WHATSAPP_API_KEY ||
    settings.smsApiKey ||
    process.env.SMS_API_KEY ||
    '';

  const sessionId =
    overrideConfig.sessionId ||
    overrideConfig.sender ||
    overrideConfig.phoneNumber ||
    overrideConfig.accountSid ||
    process.env.NIRMAAN_SESSION_ID ||
    process.env.WHATSAPP_SESSION_ID ||
    process.env.WHATSAPP_SENDER ||
    settings.smsAccountSid ||
    settings.smsPhoneNumber ||
    '';

  return {
    gatewayUrl: gatewayUrl.replace(/\/+$/, ''),
    apiKey: apiKey.trim(),
    sessionId: sessionId.toString().trim(),
  };
};

/**
 * Send a single WhatsApp text message via Nirmaan Gateway
 * Endpoint: POST {gatewayUrl}/api/messages/{sessionId}/{jid}/send
 * Headers: x-api-key: {apiKey}
 * Body: { message: "..." }
 */
const sendNirmaanMessage = async (to, message, overrideConfig = {}) => {
  const settings = await getSettingsSafe();
  const { gatewayUrl, apiKey, sessionId } = resolveProviderConfig(settings, overrideConfig);

  if (!apiKey) {
    throw new Error('Nirmaan Gateway API Key (x-api-key) is not configured. Please check settings or .env');
  }
  if (!sessionId) {
    throw new Error('Nirmaan Gateway Session ID is not configured. Please configure your Session ID in settings or .env');
  }

  const jid = toWhatsAppJid(to);
  if (!jid || jid === '@s.whatsapp.net') {
    throw new Error('Recipient phone number is missing or invalid.');
  }

  const endpointUrl = `${gatewayUrl}/api/messages/${encodeURIComponent(sessionId)}/${encodeURIComponent(jid)}/send`;

  console.log('📱 Sending WhatsApp message via Nirmaan Gateway:', {
    endpointUrl,
    sessionId,
    recipientJid: jid,
    messageLength: message?.length || 0,
  });

  const formattedPayload = {
    message: typeof message === 'string' ? { text: message } : message,
  };

  const response = await axios.post(
    endpointUrl,
    formattedPayload,
    {
      timeout: 20000,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }
  );

  const data = response.data || {};
  if (data.status === false || data.success === false) {
    throw new Error(data.message || data.error || 'Nirmaan Gateway returned an unsuccessful status');
  }

  return {
    success: true,
    sid: data?.key?.id || data?.messageId || data?.id || 'sent',
    providerResponse: data,
  };
};

/**
 * Send broadcast message to multiple recipients via Nirmaan Gateway
 * Endpoint: POST {gatewayUrl}/api/messages/{sessionId}/broadcast
 * Body: { recipients: ["..."], message: "...", delay: 2000 }
 */
const sendNirmaanBroadcast = async (recipients = [], message, options = {}, overrideConfig = {}) => {
  const settings = await getSettingsSafe();
  const { gatewayUrl, apiKey, sessionId } = resolveProviderConfig(settings, overrideConfig);

  if (!apiKey || !sessionId) {
    throw new Error('Nirmaan Gateway credentials incomplete.');
  }

  const jidList = recipients.map(toWhatsAppJid).filter((j) => j && j !== '@s.whatsapp.net');
  if (jidList.length === 0) {
    throw new Error('No valid recipient JIDs provided for broadcast.');
  }

  const endpointUrl = `${gatewayUrl}/api/messages/${encodeURIComponent(sessionId)}/broadcast`;
  const delay = options.delay || 2000;

  console.log('📢 Sending WhatsApp Broadcast via Nirmaan Gateway:', {
    endpointUrl,
    recipientCount: jidList.length,
    delay,
  });

  const response = await axios.post(
    endpointUrl,
    {
      recipients: jidList,
      message,
      delay,
    },
    {
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }
  );

  return {
    success: true,
    providerResponse: response.data,
  };
};

/**
 * Standard sendSMS adapter used across RaktMap controllers
 */
const sendSMS = async (to, message) => {
  try {
    console.log(`📱 Attempting to send message to ${to}`);
    const result = await sendNirmaanMessage(to, message);
    console.log('✅ WhatsApp message sent successfully via Nirmaan Gateway');
    return result;
  } catch (error) {
    const providerMessage = error.response?.data?.message || error.response?.data?.error || error.message;
    console.error('❌ Error sending WhatsApp message via Nirmaan Gateway:', providerMessage);
    return { success: false, error: providerMessage };
  }
};

/**
 * Send message with explicit custom configuration (for testing endpoints)
 */
const sendSMSWithConfig = async (to, message, config = {}) => {
  try {
    console.log('🔧 Testing Nirmaan Gateway with config:', {
      gatewayUrl: config.gatewayUrl || config.apiUrl || process.env.NIRMAAN_GATEWAY_URL || DEFAULT_NIRMAAN_GATEWAY_URL,
      hasApiKey: !!(config.apiKey || config.authToken),
      sessionId: config.sessionId || config.sender || config.phoneNumber || config.accountSid,
      to,
    });

    const result = await sendNirmaanMessage(to, message, {
      gatewayUrl: config.gatewayUrl || config.apiUrl,
      apiKey: config.apiKey || config.authToken,
      sessionId: config.sessionId || config.sender || config.phoneNumber || config.accountSid,
    });
    console.log('✅ Test message sent successfully');
    return result;
  } catch (error) {
    const providerError = error.response?.data;
    const errorMsg = providerError?.message || providerError?.error || error.message;
    console.error('❌ Error sending test message:', errorMsg);
    return { success: false, error: errorMsg };
  }
};

// Get template based on priority
const getSMSTemplate = async (priority = 'normal') => {
  try {
    const settings = await getSettingsSafe();
    return priority === 'high'
      ? settings.smsTemplateHighPriority
      : settings.smsTemplateNormalPriority;
  } catch (error) {
    console.error('Error getting message template:', error);
    return priority === 'high'
      ? '🚨 URGENT: {quantity} units {bloodType} blood needed at {hospital}. Your donation can save a life! Please respond: {responseUrl}'
      : 'Blood donation request from {hospital}. {quantity} units {bloodType} blood needed. Can you help save a life? Respond: {responseUrl}';
  }
};

// Format template with placeholders
const formatSMSMessage = (template, variables) => {
  let message = template;
  Object.keys(variables).forEach((key) => {
    const placeholder = `{${key}}`;
    message = message.replace(new RegExp(placeholder, 'g'), variables[key]);
  });
  return message;
};

module.exports = {
  sendSMS,
  sendSMSWithConfig,
  sendNirmaanMessage,
  sendNirmaanBroadcast,
  toWhatsAppJid,
  getSMSTemplate,
  formatSMSMessage,
};
