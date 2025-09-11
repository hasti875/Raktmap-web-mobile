import React, { useState, useEffect } from 'react';
import { Settings, MapPin, Phone, Key, Bell, Save, User, RefreshCw } from 'lucide-react';
import axios from 'axios';

interface HospitalData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  emergencyContact: string;
  radius: number;
  status: string;
}

export function HospitalSettings() {
  const [hospitalData, setHospitalData] = useState<HospitalData | null>(null);
  const [settings, setSettings] = useState({
    hospitalName: '',
    email: '',
    phone: '',
    address: '',
    emergencyContact: '',
    defaultRadius: 10,
    smsNotifications: true,
    emailNotifications: true,
    emergencyAlerts: true,
    nightTimeRestrictions: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchHospitalProfile();
  }, []);

  const fetchHospitalProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/hospital/profile');
      if (response.data.success) {
        const hospital = response.data.hospital;
        setHospitalData(hospital);
        setSettings({
          hospitalName: hospital.name,
          email: hospital.email,
          phone: hospital.phone,
          address: hospital.address,
          emergencyContact: hospital.emergencyContact,
          defaultRadius: hospital.radius,
          smsNotifications: true,
          emailNotifications: true,
          emergencyAlerts: true,
          nightTimeRestrictions: false
        });
      }
    } catch (err: any) {
      console.error('Error fetching hospital profile:', err);
      setError(err.response?.data?.message || 'Failed to fetch hospital profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = (field: string, value: any) => {
    setSettings({ ...settings, [field]: value });
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData({ ...passwordData, [field]: value });
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const updateData = {
        name: settings.hospitalName,
        email: settings.email,
        phone: settings.phone,
        address: settings.address,
        emergencyContact: settings.emergencyContact,
        radius: settings.defaultRadius
      };

      const response = await axios.put('/hospital/profile', updateData);
      if (response.data.success) {
        setSuccessMessage('Settings updated successfully!');
        // Update local hospital data
        setHospitalData(response.data.hospital);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    console.log('Updating password');
    // Handle password update
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-6 w-6 text-red-600" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Hospital Settings</h2>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading settings...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <span className="text-red-700 dark:text-red-300">{error}</span>
          <button
            onClick={fetchHospitalProfile}
            className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <span className="text-green-700 dark:text-green-300">{successMessage}</span>
        </div>
      )}

      {/* Settings Content */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hospital Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hospital Information</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hospital Name
              </label>
              <input
                type="text"
                value={settings.hospitalName}
                onChange={(e) => handleSettingsChange('hospitalName', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => handleSettingsChange('email', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => handleSettingsChange('phone', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address
              </label>
              <textarea
                value={settings.address}
                onChange={(e) => handleSettingsChange('address', e.target.value)}
                rows={3}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Emergency & Search Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Phone className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Emergency & Search Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Emergency Contact
              </label>
              <input
                type="tel"
                value={settings.emergencyContact}
                onChange={(e) => handleSettingsChange('emergencyContact', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Search Radius (km)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={settings.defaultRadius}
                  onChange={(e) => handleSettingsChange('defaultRadius', parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white w-12">
                  {settings.defaultRadius}km
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Notification Preferences</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={(e) => handleSettingsChange('smsNotifications', e.target.checked)}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">SMS Notifications</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingsChange('emailNotifications', e.target.checked)}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Email Notifications</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.emergencyAlerts}
                    onChange={(e) => handleSettingsChange('emergencyAlerts', e.target.checked)}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Emergency Alerts</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.nightTimeRestrictions}
                    onChange={(e) => handleSettingsChange('nightTimeRestrictions', e.target.checked)}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Night Time Restrictions (10 PM - 6 AM)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Password Change */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Key className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handlePasswordUpdate}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Key className="h-4 w-4" />
              <span>Update Password</span>
            </button>
          </div>
        </div>

        {/* Save Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Save className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Save Changes</h3>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Make sure to save your changes before leaving this page.
          </p>
          
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
          </button>
        </div>
      </div>
      )}
    </div>
  );
}