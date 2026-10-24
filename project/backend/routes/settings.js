const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const rateLimit = require('express-rate-limit');

// SMS Rate Limiter - 10 SMS requests per hour
const smsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { success: false, message: 'Too many SMS requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

// Get system settings
router.get('/settings', async (req, res) => {
  try {
    console.log('📋 Settings API: GET /admin/settings called');
    console.log('👤 User from token:', req.user?.email || 'No user');
    const settings = await Settings.getSettings();
    
    // Don't send sensitive API keys in full, just indicate if they exist
    const safeSettings = {
      ...settings.toObject(),
      smsApiKey: settings.smsApiKey ? '••••••••' + settings.smsApiKey.slice(-4) : '',
      emailApiKey: settings.emailApiKey ? '••••••••' + settings.emailApiKey.slice(-4) : '',
      smsAccountSid: settings.smsAccountSid ? settings.smsAccountSid.slice(0, 8) + '••••••••' : '',
      // Include full values for templates and preferences
      smsTemplateHighPriority: settings.smsTemplateHighPriority,
      smsTemplateNormalPriority: settings.smsTemplateNormalPriority,
      brightness: settings.brightness,
      notifications: settings.notifications,
      notificationStartTime: settings.notificationStartTime,
      notificationEndTime: settings.notificationEndTime,
      emergencyOverride: settings.emergencyOverride,
      lastUpdated: settings.lastUpdated
    };
    
    res.json({ success: true, data: safeSettings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
});

// Update system settings
router.put('/settings', async (req, res) => {
  try {
    const updateData = req.body;
    const adminId = req.user?.id || null; // Assuming auth middleware sets req.user
    
    // Validate required fields
    if (updateData.brightness && !['low', 'medium', 'high'].includes(updateData.brightness)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid brightness value. Must be low, medium, or high.' 
      });
    }
    
    // Update settings
    const settings = await Settings.updateSettings(updateData, adminId);
    
    // Return safe version without full API keys
    const safeSettings = {
      ...settings.toObject(),
      smsApiKey: settings.smsApiKey ? '••••••••' + settings.smsApiKey.slice(-4) : '',
      emailApiKey: settings.emailApiKey ? '••••••••' + settings.emailApiKey.slice(-4) : '',
      smsAccountSid: settings.smsAccountSid ? settings.smsAccountSid.slice(0, 8) + '••••••••' : ''
    };
    
    res.json({ 
      success: true, 
      message: 'Settings updated successfully',
      data: safeSettings 
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
});

// Get current SMS configuration (for SMS service)
router.get('/settings/sms-config', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    // Return full config for internal use (this endpoint should be protected)
    res.json({ 
      success: true, 
      data: {
        accountSid: settings.smsAccountSid,
        authToken: settings.smsApiKey,
        phoneNumber: settings.smsPhoneNumber,
        highPriorityTemplate: settings.smsTemplateHighPriority,
        normalPriorityTemplate: settings.smsTemplateNormalPriority
      }
    });
  } catch (error) {
    console.error('Error fetching SMS config:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch SMS configuration' });
  }
});

// Debug endpoint to check current settings (remove in production)
router.get('/settings/debug', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json({ 
      success: true, 
      data: {
        hasAccountSid: !!settings.smsAccountSid,
        hasAuthToken: !!settings.smsApiKey,
        hasPhoneNumber: !!settings.smsPhoneNumber,
        accountSidLength: settings.smsAccountSid?.length || 0,
        authTokenLength: settings.smsApiKey?.length || 0,
        phoneNumberValue: settings.smsPhoneNumber,
        envFallback: {
          accountSid: process.env.TWILIO_ACCOUNT_SID?.substring(0, 8) + '...',
          authToken: process.env.TWILIO_AUTH_TOKEN?.substring(0, 8) + '...',
          phoneNumber: process.env.TWILIO_PHONE_NUMBER
        }
      }
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ success: false, message: 'Debug failed' });
  }
});

// Test SMS configuration
router.post('/settings/test-sms', smsLimiter, async (req, res) => {
  try {
    const { phoneNumber, templateType = 'normal' } = req.body;
    
    console.log('📱 SMS Test Request:', { phoneNumber, templateType, user: req.user?.email });
    
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid phone number format. Please use international format (e.g., +1234567890)' 
      });
    }
    
    const settings = await Settings.getSettings();
    const providerApiKey = process.env.WHATSAPP_API_KEY || settings.smsApiKey || process.env.SMS_API_KEY || process.env.TWILIO_AUTH_TOKEN;
    const providerSenderRaw = process.env.WHATSAPP_SENDER || settings.smsPhoneNumber || process.env.SMS_SENDER || settings.smsAccountSid || process.env.TWILIO_PHONE_NUMBER;
    const providerSender = providerSenderRaw
      ? providerSenderRaw.toString().trim().replace(/[^\d+]/g, '').replace(/^\+/, '')
      : '';

    console.log('📋 Retrieved settings for SMS test:', {
      hasApiKey: !!providerApiKey,
      hasSender: !!providerSender,
      apiKeyLength: providerApiKey?.length || 0,
      sender: providerSender
    });

    if (!providerApiKey || !providerSender) {
      return res.status(400).json({ 
        success: false, 
        message: 'SMS configuration incomplete. Please configure API Key and Sender in settings, or check environment variables.' 
      });
    }
    
    // Import SMS service
    const { sendSMSWithConfig, getSMSTemplate, formatSMSMessage } = require('../services/smsService');
    
    // Get the appropriate template
    const template = templateType === 'high' ? settings.smsTemplateHighPriority : settings.smsTemplateNormalPriority;
    
    // Create test message using the current template
    const testVariables = {
      hospital: 'Test Hospital',
      bloodType: 'O+',
      quantity: '2 units',
      urgency: templateType === 'high' ? 'HIGH PRIORITY' : 'NORMAL',
      donorName: 'Test User',
      responseUrl: 'https://example.com/test-response'
    };
    
    const testMessage = formatSMSMessage(template, testVariables);
    console.log('📝 Test message content:', testMessage);
    
    const result = await sendSMSWithConfig(phoneNumber, testMessage, {
      apiKey: providerApiKey,
      sender: providerSender,
      apiUrl: process.env.WHATSAPP_API_URL || process.env.SMS_API_URL
    });
    
    console.log('📤 SMS Test Result:', result);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Test message sent successfully! Check your phone for the message.', 
        sid: result.sid,
        templateUsed: templateType,
        messagePreview: testMessage.substring(0, 100) + (testMessage.length > 100 ? '...' : '')
      });
    } else {
      // Handle provider/API errors
      let errorMessage = result.error;
      if (result.error.includes('valid phone number')) {
        errorMessage = 'Invalid phone number. Please use a valid phone number in international format.';
      } else if (result.error.includes('auth') || result.error.includes('key')) {
        errorMessage = 'Authentication failed. Please check your API key and sender configuration.';
      }
      
      res.status(400).json({ success: false, message: errorMessage });
    }
  } catch (error) {
    console.error('❌ Error testing SMS:', error);
    res.status(500).json({ success: false, message: 'Failed to test SMS configuration: ' + error.message });
  }
});

module.exports = router;