import React, { useState } from 'react';
import { Key, Palette, Bell, BellOff, MessageSquare } from 'lucide-react';

const AdminSettings = () => {
  const [brightness, setBrightness] = useState('medium');
  const [notifications, setNotifications] = useState(true);

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
                SMS API Key
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter SMS API key..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Email API Key
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter Email API key..."
              />
            </div>
          </div>
        </div>
        {/* App Preferences */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-red-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <Palette className="h-5 w-5 text-red-600" />
            <span>App Preferences</span>
          </h3>
          <div className="space-y-6">
            {/* Brightness Control */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Display Brightness
              </label>
              <div className="flex items-center space-x-4">
                {/* Removed Sun icon */}
                <div className="flex-1">
                  <select
                    value={brightness}
                    onChange={(e) => setBrightness(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                {/* Removed Moon icon */}
              </div>
            </div>
            {/* Notifications Toggle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                System Notifications
              </label>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  {notifications ? (
                    <Bell className="h-5 w-5 text-green-600" />
                  ) : (
                    <BellOff className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="text-gray-700">Enable notifications</span>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            {/* Theme Selection */}
            {/* Theme Preference selection removed as requested */}
          </div>
        </div>
        {/* Advanced Notification Settings */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-red-100 lg:col-span-2">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-red-600" />
            <span>Advanced Notification Settings</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                SMS Template for High Priority
              </label>
              <textarea
                rows={3}
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Blood donation request from {hospital}. Your {bloodType} blood is needed. Can you help? Reply YES to confirm."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Notification Time Window
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="time"
                  defaultValue="07:00"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="time"
                  defaultValue="22:00"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Avoid sending notifications outside these hours</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Emergency Override
              </label>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <span className="text-red-700 text-sm">Allow critical alerts 24/7</span>
                <button className="relative inline-flex h-5 w-9 items-center rounded-full bg-red-600">
                  <span className="inline-block h-3 w-3 transform rounded-full bg-white translate-x-5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Save Button */}
      <div className="flex justify-end">
        <button className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
          Save All Settings
        </button>
      </div>
    </div>
  );
};

export { AdminSettings };