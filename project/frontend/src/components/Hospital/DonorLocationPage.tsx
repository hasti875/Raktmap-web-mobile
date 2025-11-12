import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import QRCode from 'qrcode';

export function DonorLocationPage() {
  const { requestId, donorId } = useParams<{ requestId: string; donorId: string }>();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState('Requesting location...');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [donorInfo, setDonorInfo] = useState<any>(null);

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
          }).then(async () => {
            setStatus('Location sent! Generating your QR code...');
            
            // Fetch donor information for QR code
            try {
              const donorResponse = await axios.get(`http://localhost:5000/donors/${donorId}`);
              const donor = donorResponse.data;
              setDonorInfo(donor);
              
              // Generate QR code data with requestId
              const qrData = `REQUEST ID\n${requestId}\nDONOR ID\n${donor.donorId || donorId}\nName:\n${donor.name || 'Unknown'}\nRoll Number:\n${donor.rollNumber || ''}\nMobile:\n${donor.phone || ''}`;
              
              const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
                width: 256,
                margin: 2,
                color: {
                  dark: '#000000',
                  light: '#FFFFFF'
                }
              });
              
              setQrCodeUrl(qrCodeDataUrl);
              setStatus('Location sent! Your QR code is ready for hospital scanning.');
              
            } catch (error) {
              console.error('Error generating QR code:', error);
              setStatus('Location sent! Thank you for helping save a life.');
            }
          })
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
        <div className="bg-white p-4 rounded-lg shadow-md border-gray-200 mb-4">
          <p className="font-mono text-sm">Latitude: {location.lat.toFixed(6)}</p>
          <p className="font-mono text-sm">Longitude: {location.lng.toFixed(6)}</p>
        </div>
      )}
      
      {qrCodeUrl && (
        <div className="bg-white p-6 rounded-lg shadow-md border-gray-200 mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Donation QR Code</h3>
          <img 
            src={qrCodeUrl} 
            alt="Donation QR Code" 
            className="mx-auto mb-4"
          />
          <p className="text-sm text-gray-600">
            Show this QR code to the hospital staff when you arrive for donation.
          </p>
          {donorInfo && (
            <div className="mt-4 text-xs text-gray-500 space-y-1">
              <p><strong>Request ID:</strong> {requestId}</p>
              <p><strong>Donor:</strong> {donorInfo.name}</p>
              <p><strong>Blood Group:</strong> {donorInfo.bloodGroup}</p>
            </div>
          )}
        </div>
      )}
      <p className="mt-8 text-xs text-gray-500">Your location is only used to coordinate the blood donation and is not stored long-term.</p>
    </div>
  );
}