import { useState, useEffect } from 'react';
import { Key, MessageSquare } from 'lucide-react';
import axios from '../../utils/axios';

interface Settings {
  smsApiKey: string;
  smsAccountSid: string;
  smsPhoneNumber: string;
  emailApiKey: string;
  smsTemplateHighPriority: string;
  smsTemplateNormalPriority: string;
  brightness: 'low' | 'medium' | 'high';
  notifications: boolean;
  notificationStartTime: string;
  notificationEndTime: string;
  emergencyOverride: boolean;
  lastUpdated?: string;
}

const AdminSettings = () => {
  const [settings, setSettings] = useState<Settings>({
    smsApiKey: '',
    smsAccountSid: '',
    smsPhoneNumber: '',
    emailApiKey: '',
    smsTemplateHighPriority: '🚨 URGENT: Blood donation needed at {hospital}. Your {bloodType} blood can save a life. Reply YES to confirm.',
    smsTemplateNormalPriority: 'Blood donation request from {hospital}. Your {bloodType} blood is needed. Can you help? Reply YES to confirm.',
    brightness: 'medium',
    notifications: true,
    notificationStartTime: '07:00',
    notificationEndTime: '22:00',
    emergencyOverride: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      console.log('🔧 AdminSettings: Loading settings...');
      const response = await axios.get('/admin/settings');
      console.log('🔧 AdminSettings: Response received:', response.data);
      if (response.data.success) {
        const loadedSettings = response.data.data;
        setSettings(loadedSettings);
        

        
        console.log('✅ AdminSettings: Settings loaded successfully');
      }
    } catch (error: any) {
      console.error('❌ AdminSettings: Error loading settings:', error);
      console.error('❌ Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await axios.put('/admin/settings', settings);
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setSettings(response.data.data);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof Settings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    
    // Clear messages when user starts editing
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h2>
        <p className="text-gray-600">Configure system preferences and API settings</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* API Configuration */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-red-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <Key className="h-5 w-5 text-red-600" />
            <span>API Configuration</span>
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                SMS Account SID
              </label>
              <input
                type="text"
                value={settings.smsAccountSid}
                onChange={(e) => handleInputChange('smsAccountSid', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter Twilio Account SID..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                SMS API Key (Auth Token)
              </label>
              <input
                type="password"
                value={settings.smsApiKey}
                onChange={(e) => handleInputChange('smsApiKey', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter Twilio Auth Token..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                SMS Phone Number
              </label>
              <input
                type="tel"
                value={settings.smsPhoneNumber}
                onChange={(e) => handleInputChange('smsPhoneNumber', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter Twilio phone number (e.g., +1234567890)..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Email API Key
              </label>
              <input
                type="password"
                value={settings.emailApiKey}
                onChange={(e) => handleInputChange('emailApiKey', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter Email API key..."
              />
            </div>
          </div>
        </div>

        {/* Advanced Notification Settings */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-red-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-red-600" />
            <span>Advanced Notification Settings</span>
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                SMS Template for High Priority
              </label>
              <textarea
                rows={3}
                value={settings.smsTemplateHighPriority}
                onChange={(e) => handleInputChange('smsTemplateHighPriority', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="🚨 URGENT: Blood donation needed at {hospital}. Your {bloodType} blood can save a life. Reply YES to confirm."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                SMS Template for Normal Priority
              </label>
              <textarea
                rows={3}
                value={settings.smsTemplateNormalPriority}
                onChange={(e) => handleInputChange('smsTemplateNormalPriority', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Blood donation request from {hospital}. Your {bloodType} blood is needed. Can you help? Reply YES to confirm."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Emergency Override
              </label>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <span className="text-red-700 text-sm">Allow critical alerts 24/7</span>
                <button 
                  onClick={() => handleInputChange('emergencyOverride', !settings.emergencyOverride)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    settings.emergencyOverride ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    settings.emergencyOverride ? 'translate-x-5' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Message Display */}
      {message.text && (
        <div className={`p-4 rounded-xl ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end space-x-4">
        <button 
          onClick={loadSettings}
          className="bg-gray-600 text-white px-8 py-3 rounded-xl hover:bg-gray-700 transition-all duration-200"
        >
          Reset
        </button>
        <button 
          onClick={saveSettings}
          disabled={saving}
          className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  );
};

export { AdminSettings };