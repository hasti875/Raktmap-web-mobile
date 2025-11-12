import React, { useState, useRef } from 'react';
import { QrReader } from 'react-qr-reader';
import { Camera, Upload, X } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const [scanMode, setScanMode] = useState<'camera' | 'file'>('camera');
  const [error, setError] = useState<string | null>(null);
  const [scanComplete, setScanComplete] = useState(false);
  const hasScannedRef = useRef(false);

  const handleScan = (result: any) => {
    if (result && result.text && !hasScannedRef.current) {
      console.log('QR SCAN:', result.text);
      hasScannedRef.current = true;
      setScanComplete(true);
      onScan(result.text);
      onClose();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError('File upload not implemented. Use camera mode.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Scan QR Code
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setScanMode('camera')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                scanMode === 'camera' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              <Camera className="h-4 w-4" />
              Camera
            </button>
            <button
              onClick={() => setScanMode('file')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                scanMode === 'file' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              <Upload className="h-4 w-4" />
              Upload File
            </button>
          </div>
        </div>

        {scanMode === 'camera' ? (
          <div className="aspect-square bg-black rounded-lg overflow-hidden">
            {!scanComplete ? (
              <QrReader
                onResult={handleScan}
                constraints={{ facingMode: 'environment' }}
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="text-green-400 text-4xl mb-2">✓</div>
                  <div>QR Code Scanned!</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">Upload an image containing a QR code</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500"
            />
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          <p>Position the QR code within the frame to scan once.</p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
