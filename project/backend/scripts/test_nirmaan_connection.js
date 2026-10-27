const axios = require('axios');
require('dotenv').config();

async function testConnection() {
  const apiUrl = process.env.NIRMAAN_GATEWAY_URL || process.env.WHATSAPP_API_URL || 'https://chat.cryptonixtechnology.in';
  const apiKey = process.env.NIRMAAN_API_KEY || process.env.WHATSAPP_API_KEY;
  const sessionId = process.env.NIRMAAN_SESSION_ID || process.env.WHATSAPP_SESSION_ID || 'b2vbon';
  const targetPhone = process.env.WHATSAPP_PHONE_NUMBER || '919909055454';
  const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
  const jid = `${cleanPhone}@s.whatsapp.net`;

  const url = `${apiUrl.replace(/\/+$/, '')}/api/messages/${sessionId}/${encodeURIComponent(jid)}/send`;
  console.log('--- Testing Nirmaan Gateway Connection ---');
  console.log('Gateway URL:', apiUrl);
  console.log('Session ID:', sessionId);
  console.log('API Key:', apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING');
  console.log('Target JID:', jid);
  console.log('Request URL:', url);

  const payload = {
    message: {
      text: '🩸 [RaktMap Emergency Alert]: Live test message from Nirmaan Gateway. Integration successful!'
    }
  };

  try {
    const res = await axios.post(
      url,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        timeout: 20000,
      }
    );
    console.log('✅ Response Status:', res.status);
    console.log('✅ Response Data:', JSON.stringify(res.data, null, 2));
    return res.data;
  } catch (error) {
    console.log('❌ Request Failed:');
    if (error.response) {
      console.log('HTTP Status:', error.response.status);
      console.log('Response Body:', error.response.data);
    } else {
      console.log('Error message:', error.message);
    }
  }
}

testConnection();
