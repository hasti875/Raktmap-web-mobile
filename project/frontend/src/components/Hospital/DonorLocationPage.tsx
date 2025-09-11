import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

export function DonorLocationPage() {
  const { requestId, donorId } = useParams<{ requestId: string; donorId: string }>();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState('Requesting location...');

  useEffect(() => {
    if (!requestId || !donorId) {
      setStatus('Missing request or donor information in the URL. Please use the link from the SMS.');
      return;
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(newLocation);
          setStatus('Location fetched! Sending to server...');
          
          // The backend URL should be absolute. In a real app, use environment variables.
          axios.post('http://localhost:5000/api/donor-location', {
            requestId,
            donorId,
            lat: newLocation.lat,
            lng: newLocation.lng,
          }).then(() => setStatus('Location sent! Thank you for helping save a life.'))
            .catch((err) => {
              console.error('API Error:', err);
              setStatus('Failed to send location. Please try again or contact the hospital.');
            });
        },
        (error) => {
          console.error('Geolocation Error:', error);
          setStatus('Location access denied. Please enable location services in your browser settings and refresh the page.');
        }
      );
    } else {
      setStatus('Geolocation is not supported by your browser.');
    }
  }, [requestId, donorId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center">
      <h1 className="text-3xl font-bold text-red-600 mb-4">RaktMap</h1>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Share Your Location</h2>
      <p className="mb-6 text-gray-600 max-w-md">{status}</p>
      {location && (
        <div className="bg-white p-4 rounded-lg shadow-md border-gray-200">
          <p className="font-mono text-sm">Latitude: {location.lat.toFixed(6)}</p>
          <p className="font-mono text-sm">Longitude: {location.lng.toFixed(6)}</p>
        </div>
      )}
      <p className="mt-8 text-xs text-gray-500">Your location is only used to coordinate the blood donation and is not stored long-term.</p>
    </div>
  );
}