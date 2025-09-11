import React, { useState } from 'react';
import { Heart, Clock, AlertTriangle, Calendar } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../contexts/AuthContext';

export function BloodRequestForm() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    bloodGroup: '',
    quantity: 1,
    urgency: 'medium',
    requiredBy: '',
    description: '',
    patientAge: '',
    patientCondition: ''
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const urgencyLevels = [
    { value: 'low', label: 'Low Priority', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' },
    { value: 'medium', label: 'Medium Priority', color: 'text-yellow-600', bgColor: 'bg-yellow-50 border-yellow-200' },
    { value: 'high', label: 'High Priority - Emergency', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate date
      const requiredDate = new Date(formData.requiredBy);
      if (requiredDate < new Date()) {
        toast.error('Required date must be in the future');
        return;
      }

      // THIS IS THE ONLY PART THAT CHANGED
      // We no longer send hospitalId, hospitalName, etc.
      // The backend gets this information securely from the token.
      const requestData = { ...formData };

      const response = await axios.post('http://localhost:5000/blood-requests', requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        toast.success('Blood request submitted successfully. SMS notifications will be sent to matching donors.');
        
        // Reset form
        setFormData({
          bloodGroup: '',
          quantity: 1,
          urgency: 'medium',
          requiredBy: '',
          description: '',
          patientAge: '',
          patientCondition: ''
        });
      } else {
        toast.error(response.data.message || 'Failed to submit blood request');
      }
    } catch (error: any) {
      console.error('Error submitting blood request:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit blood request. Please try again.';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Heart className="h-6 w-6 text-red-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Request Blood Donation</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Blood Group Required *
              </label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              >
                <option value="">Select blood group</option>
                {bloodGroups.map((group) => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantity (Units) *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Required By *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="datetime-local"
                  value={formData.requiredBy}
                  onChange={(e) => setFormData({ ...formData, requiredBy: e.target.value })}
                  className="w-full pl-10 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Patient Age
              </label>
              <input
                type="number"
                value={formData.patientAge}
                onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter patient age"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Urgency Level *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {urgencyLevels.map((level) => (
                <label key={level.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="urgency"
                    value={level.value}
                    checked={formData.urgency === level.value}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg transition-all ${
                    formData.urgency === level.value 
                      ? `${level.bgColor} border-current ${level.color}` 
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {level.value === 'high' && <AlertTriangle className="h-4 w-4" />}
                      {level.value === 'medium' && <Clock className="h-4 w-4" />}
                      {level.value === 'low' && <Heart className="h-4 w-4" />}
                      <span className="font-medium">{level.label}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Patient Condition
            </label>
            <input
              type="text"
              value={formData.patientCondition}
              onChange={(e) => setFormData({ ...formData, patientCondition: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="e.g., Surgery, Accident, Cancer treatment"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Any specific requirements or additional information..."
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
              <li>• SMS notifications will be sent to eligible donors in your area</li>
              <li>• You'll receive real-time updates as donors respond</li>
              <li>• Donor contact information will be shared once they confirm</li>
              <li>• You can track the progress in the Live Map section</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <Heart className="h-4 w-4" />
              <span>Send Blood Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}