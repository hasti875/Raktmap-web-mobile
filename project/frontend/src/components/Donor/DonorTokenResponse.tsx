import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Heart, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface TokenData {
  token: string;
  request: {
    _id: string;
    bloodGroup: string;
    units: number;
    hospital: string;
    urgency: string;
  };
  donor: {
    _id: string;
    name: string;
    phone: string;
    bloodGroup: string;
  };
}

export function DonorTokenResponse() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    if (token) {
      fetchTokenData();
    }
  }, [token]);

  const fetchTokenData = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/r/${token}`);
      if (response.data.success) {
        setTokenData(response.data.data);
      } else {
        setError(response.data.message || 'Invalid token');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          // Reverse geocoding to get address
          reverseGeocode(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Unable to get your location. Please enter your address manually.');
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Using a simple reverse geocoding service
      const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=YOUR_API_KEY`);
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results[0]) {
          setAddress(data.results[0].formatted);
        }
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      // Fallback to coordinates
      setAddress(`Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location) {
      setError('Please provide your location');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await axios.post(`http://localhost:5000/r/${token}/respond`, {
        latitude: location.latitude,
        longitude: location.longitude,
        isAvailable,
        address
      });

      if (response.data.success) {
        setSuccess(true);
      } else {
        setError(response.data.message || 'Failed to submit response');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (error && !tokenData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Link</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">This link may have expired or been used already.</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-4">Your response has been recorded successfully.</p>
            <p className="text-sm text-gray-500 mb-6">
              The hospital has been notified of your availability and location.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Blood Group:</strong> {tokenData?.request.bloodGroup}<br/>
                <strong>Units Needed:</strong> {tokenData?.request.units}<br/>
                <strong>Hospital:</strong> {tokenData?.request.hospital}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 text-white p-6 text-center">
          <Heart className="h-12 w-12 mx-auto mb-3" />
          <h1 className="text-xl font-semibold">Blood Donation Request</h1>
          <p className="text-red-100 mt-1">Help Save a Life</p>
        </div>

        {/* Request Details */}
        <div className="p-6 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Request Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Blood Group:</span>
              <span className="font-semibold text-red-600">{tokenData?.request.bloodGroup}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Units Needed:</span>
              <span className="font-semibold">{tokenData?.request.units}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Hospital:</span>
              <span className="font-semibold">{tokenData?.request.hospital}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Urgency:</span>
              <span className={`font-semibold ${
                tokenData?.request.urgency === 'high' ? 'text-red-600' : 
                tokenData?.request.urgency === 'medium' ? 'text-orange-600' : 'text-green-600'
              }`}>
                {tokenData?.request.urgency?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Donor Info */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Donor Information</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-semibold">{tokenData?.donor.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Your Blood Group:</span>
              <span className="font-semibold text-red-600">{tokenData?.donor.bloodGroup}</span>
            </div>
          </div>
        </div>

        {/* Response Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Are you available to donate?
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="availability"
                    checked={isAvailable}
                    onChange={() => setIsAvailable(true)}
                    className="mr-2 text-red-600 focus:ring-red-500"
                  />
                  Yes, I can donate
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="availability"
                    checked={!isAvailable}
                    onChange={() => setIsAvailable(false)}
                    className="mr-2 text-red-600 focus:ring-red-500"
                  />
                  Not available
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Location
              </label>
              {!location ? (
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Share My Location
                </button>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm text-green-800">Location captured</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address (Optional)
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter your current address or landmark"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !location}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-md font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Response'}
            </button>
          </form>
        </div>

        <div className="bg-gray-50 px-6 py-4">
          <p className="text-xs text-gray-500 text-center">
            Your response helps hospitals locate nearby donors quickly. Thank you for potentially saving a life! ❤️
          </p>
        </div>
      </div>
    </div>
  );
}
