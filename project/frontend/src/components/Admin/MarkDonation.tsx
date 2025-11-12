import { useState, useEffect } from 'react';
import { QrCode, User, Search, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import QRScanner from '../Shared/QRScanner';
import axios from '../../utils/axios';

interface DonorInfo {
  donorId: string;
  name: string;
  rollNo: string;
  mobile: string;
  requestId?: string; // Optional field for future QR codes that include request ID
}

interface MarkDonationProps {
  // You can add props if needed
}

export function MarkDonation({}: MarkDonationProps) {
  const [activeTab, setActiveTab] = useState<'qr' | 'manual' | 'recent'>('qr');
  const [donorId, setDonorId] = useState('');
  const [donorName, setDonorName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<DonorInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'failed' | null>(null);
  const [recentDonations, setRecentDonations] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false); // Prevent multiple processing
  const [lastProcessedQR, setLastProcessedQR] = useState<string | null>(null); // Track last processed QR
  const [lastProcessedTime, setLastProcessedTime] = useState<number>(0); // Track when we last processed
  const [scanSession, setScanSession] = useState<string | null>(null); // Track current scan session
  const [donationCompleted, setDonationCompleted] = useState(false); // Block all scanning after successful donation
  const [activeApiCall, setActiveApiCall] = useState<string | null>(null); // Track active API calls
  const [scannerDestroyed, setScannerDestroyed] = useState(false); // Complete scanner destruction flag
  const [verifiedDonor, setVerifiedDonor] = useState<any | null>(null); // Store verified donor details
  const [isVerifying, setIsVerifying] = useState(false); // Track verification in progress

  const handleQRScan = (data: string) => {
    console.log('=== QR SCAN ATTEMPT ===', { 
      data, 
      donationCompleted, 
      isProcessing, 
      isScanning,
      scanSession,
      isLoading,
      scannerDestroyed
    });

    // ABSOLUTE FIRST CHECK - If scanner is destroyed, ignore everything
    if (scannerDestroyed) {
      console.log('=== SCAN BLOCKED: Scanner destroyed ===');
      return;
    }

    // COMPLETELY BLOCK scanning if donation is already completed
    if (donationCompleted) {
      console.log('=== SCAN BLOCKED: Donation already completed ===');
      setIsScanning(false); // Force stop scanning
      setScannerDestroyed(true); // Destroy scanner completely
      return;
    }

    // COMPLETELY BLOCK if already processing or loading
    if (isProcessing || isLoading) {
      console.log('=== SCAN BLOCKED: Already processing/loading ===');
      return;
    }

    const now = Date.now();
    const cooldownPeriod = 5000; // Increased to 5 seconds cooldown between scans
    const currentSessionId = `session_${now}`;
    
    // Prevent processing the same QR code multiple times or too quickly
    if (data && 
        data !== lastProcessedQR && 
        (now - lastProcessedTime) > cooldownPeriod &&
        !scanSession) { // Only allow if no active scan session
      
      console.log('=== QR SCAN ACCEPTED ===');
      console.log('Data:', data);
      console.log('Time since last scan:', (now - lastProcessedTime) / 1000, 'seconds');
      console.log('Starting scan session:', currentSessionId);
      
      // IMMEDIATELY stop all scanning to prevent duplicates
      setIsProcessing(true); // Set processing flag
      setIsScanning(false); // Stop the scanner immediately  
      setScanSession(currentSessionId); // Create scan session
      setLastProcessedQR(data); // Remember this QR code
      setLastProcessedTime(now); // Remember when we processed it
      
      try {
        console.log('=== QR SCAN DEBUG ===');
        console.log('Raw QR data:', data);
        console.log('Data type:', typeof data);
        console.log('Data length:', data.length);
        
        // Parse QR code data - assuming it contains donor info in a specific format
        const lines = data.split('\n').filter(line => line.trim());
        console.log('Parsed lines:', lines);
        
        let donorInfo: DonorInfo = {
          donorId: '',
          name: '',
          rollNo: '',
          mobile: '',
          requestId: '' // Initialize request ID
        };

        // Parse the QR data format from your image
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          console.log(`Line ${i}: "${line}"`);
          
          if (line === 'DONOR ID' || line === 'DONOR_ID') {
            if (i + 1 < lines.length) {
              donorInfo.donorId = lines[i + 1].trim();
              console.log('Found donor ID:', donorInfo.donorId);
            }
          } else if (line === 'REQUEST ID' || line === 'REQUEST_ID') {
            if (i + 1 < lines.length) {
              donorInfo.requestId = lines[i + 1].trim();
              console.log('Found request ID:', donorInfo.requestId);
            }
          } else if (line === 'Name:' && i + 1 < lines.length) {
            donorInfo.name = lines[i + 1].trim();
            console.log('Found name:', donorInfo.name);
          } else if (line === 'Roll Number:' && i + 1 < lines.length) {
            donorInfo.rollNo = lines[i + 1].trim();
            console.log('Found roll number:', donorInfo.rollNo);
          } else if (line === 'Mobile:' && i + 1 < lines.length) {
            donorInfo.mobile = lines[i + 1].trim();
            console.log('Found mobile:', donorInfo.mobile);
          }
        }
        
        console.log('Final parsed data:', donorInfo);
        
        // If we didn't find donor ID in structured format, try simple approaches
        if (!donorInfo.donorId) {
          console.log('Trying fallback parsing methods...');
          
          // Method 1: Check if the entire QR code is just a donor ID
          if (data.trim().length > 5 && data.trim().length < 20 && !data.includes('\n')) {
            donorInfo.donorId = data.trim();
            console.log('Found donor ID as entire QR content:', donorInfo.donorId);
          }
          
          // Method 2: Look for patterns like "DONAA9XK8S5" anywhere in the text
          const donorIdPattern = /DON[A-Z0-9]{8,}/;
          const match = data.match(donorIdPattern);
          if (match) {
            donorInfo.donorId = match[0];
            console.log('Found donor ID via pattern matching:', donorInfo.donorId);
          }
          
          // Method 3: Check if any line contains what looks like a donor ID
          for (const line of lines) {
            if (line.match(/^DON[A-Z0-9]+$/)) {
              donorInfo.donorId = line;
              console.log('Found donor ID in line:', donorInfo.donorId);
              break;
            }
          }
        }
        
        // If no requestId found in structured format, try pattern-based detection
        if (!donorInfo.requestId) {
          console.log('Trying requestId pattern-based detection...');
          
          // Look for MongoDB ObjectId pattern (24 character hex string)
          const requestIdPattern = /^[0-9a-fA-F]{24}$/;
          for (const line of lines) {
            if (requestIdPattern.test(line.trim())) {
              donorInfo.requestId = line.trim();
              console.log('Found requestId via pattern matching:', donorInfo.requestId);
              break;
            }
          }
        }
        
        console.log('Final parsed QR data:', donorInfo);
        
        if (donorInfo.donorId) {
          setScannedData(donorInfo);
          
          // IMMEDIATELY AND AGGRESSIVELY STOP ALL SCANNING
          setIsScanning(false); // Stop scanning immediately
          setIsProcessing(true); // Block any new processing
          setScanSession(currentSessionId); // Lock the session
          setScannerDestroyed(true); // Destroy scanner completely
          
          console.log('=== QR PARSED SUCCESSFULLY - SCANNER STOPPED & DESTROYED ===');
          
          // Start verification process
          verifyDonor(donorInfo.donorId, donorInfo.name, donorInfo.requestId);
        } else {
          console.log('No donor ID found in QR code after all attempts');
          setMessage({ 
            type: 'error', 
            text: `Could not extract donor ID from QR code. Scanned: "${data.substring(0, 100)}${data.length > 100 ? '...' : ''}"` 
          });
          setIsScanning(false); // Stop scanning on error too
          setIsProcessing(false); // Reset processing on error
          setScanSession(null); // Clear session on error
        }
      } catch (error) {
        console.error('QR parsing error:', error);
        setMessage({ type: 'error', text: 'Invalid QR code format' });
        setIsScanning(false); // Stop scanning on error
        setIsProcessing(false); // Reset processing state
        setScanSession(null); // Reset scan session
      }
    } else {
      // Log why the scan was rejected
      console.log('=== QR SCAN REJECTED ===');
      if (!data) {
        console.log('Reason: No data');
      } else if (isProcessing) {
        console.log('Reason: Already processing');
      } else if (data === lastProcessedQR) {
        console.log('Reason: Same QR as last scan');
      } else if ((now - lastProcessedTime) <= cooldownPeriod) {
        console.log('Reason: Too soon (cooldown active)');
        console.log('Time since last:', (now - lastProcessedTime) / 1000, 'seconds');
      } else if (scanSession) {
        console.log('Reason: Active scan session exists:', scanSession);
      } else if (donationCompleted) {
        console.log('Reason: Donation already completed - no more scanning allowed');
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (donorId.trim()) {
      verifyDonor(donorId.trim(), donorName.trim() || undefined);
    }
  };

  const handleVerifyDonorId = async () => {
    if (!donorId.trim()) {
      setMessage({ type: 'error', text: 'Please enter a donor ID' });
      return;
    }

    console.log('=== VERIFYING DONOR ID ===');
    console.log('Donor ID:', donorId.trim());
    console.log('URL:', `/api/verify-location/${donorId.trim()}`);

    setIsVerifying(true);
    setMessage(null);
    setVerifiedDonor(null);

    try {
      console.log('Making API call...');
      const response = await axios.get(`/api/verify-location/${donorId.trim()}`);
      console.log('API Response:', response.data);
      
      if (response.data.success) {
        const { location, donor } = response.data;
        
        // Create verified donor object from location data
        const verifiedData = {
          donorId: location.donorId,
          userName: location.userName,
          rollNumber: location.rollNumber,
          mobileNumber: location.mobileNumber,
          address: location.address,
          bloodGroup: donor?.bloodGroup || 'Unknown',
          email: donor?.email,
          name: donor?.name || location.userName
        };
        
        setVerifiedDonor(verifiedData);
        setMessage({ 
          type: 'success', 
          text: `✅ Donor found on live map: ${verifiedData.name || verifiedData.userName}` 
        });
      }
    } catch (error: any) {
      console.error('=== VERIFICATION ERROR ===');
      console.error('Error:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.message || 'Donor not found on live map';
      setMessage({ type: 'error', text: errorMessage });
      setVerifiedDonor(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyDonor = async (id: string, name?: string, requestId?: string) => {
    // ABSOLUTE BLOCK - if donation completed, do nothing
    if (donationCompleted) {
      console.log('=== BLOCKED: Donation already completed ===');
      return;
    }

    // ABSOLUTE BLOCK - if already loading, do nothing  
    if (isLoading) {
      console.log('=== BLOCKED: Already loading ===');
      return;
    }

    // ABSOLUTE BLOCK - if already processing
    if (isProcessing) {
      console.log('=== BLOCKED: Already processing ===');
      return;
    }

    // Prevent duplicate API calls
    const callId = `${id}-${name || 'unknown'}`;
    if (activeApiCall === callId) {
      console.log('=== BLOCKED: Duplicate API call ===', callId);
      return;
    }

    console.log('=== STARTING DONOR VERIFICATION ===', { id, name, requestId });
    
    setActiveApiCall(callId);
    setIsLoading(true);
    setIsProcessing(true); // Set processing immediately
    setVerificationStatus('pending');
    setMessage(null);

    try {
      // Check if donor exists in location database and mark donation
      const requestData: any = {
        donorId: id,
        donorName: name
      };
      
      // Include request ID if available from QR code
      if (requestId) {
        requestData.requestId = requestId;
      }
      
      const response = await axios.post('/api/mark-donation', requestData);

      const result = response.data;

      if (result.success) {
        setVerificationStatus('verified');
        const successMessage = result.donationHistory.wasOriginalRequest 
          ? `Donation marked successfully for ${result.donationHistory.donorName}! Original SMS request fulfilled.`
          : `Donation marked successfully for ${result.donationHistory.donorName}! Compatible request fulfilled.`;
        
        setMessage({ 
          type: 'success', 
          text: successMessage
        });
        
        // COMPLETELY BLOCK any further scanning after successful donation
        setIsScanning(false);  // Stop scanner immediately
        setDonationCompleted(true); // Mark donation as completed - NO MORE SCANNING
        setScanSession(null); // End scan session after success
        setIsProcessing(false); // Reset processing to allow manual reset
        setScannerDestroyed(true); // Destroy scanner completely
        
        console.log('=== DONATION COMPLETED - ALL SCANNING BLOCKED & SCANNER DESTROYED ===');
      } else {
        setVerificationStatus('failed');
        setMessage({ type: 'error', text: result.error || 'Verification failed' });
        
        // Reset processing state after failure so user can try again later
        setIsProcessing(false);
        setScanSession(null); // End scan session after failure
      }
    } catch (error: any) {
      setVerificationStatus('failed');
      const errorMessage = error.response?.data?.error || 'Network error. Please try again.';
      
      // Check if this is a duplicate detection error
      if (error.response?.status === 400 && errorMessage.includes('already recorded')) {
        console.log('=== DUPLICATE DETECTED - STOPPING ALL SCANNING ===');
        
        // Treat duplicate detection same as successful completion
        setMessage({ type: 'error', text: `✅ ${errorMessage}` });
        setIsScanning(false);  // Stop scanner immediately
        setDonationCompleted(true); // Block all future scanning - this donor is done
        setScanSession(null); // End scan session
        setIsProcessing(false); // Reset processing
        setScannerDestroyed(true); // Destroy scanner completely
      } else {
        // Regular error - allow retry
        setMessage({ type: 'error', text: errorMessage });
        setIsProcessing(false);
        setScanSession(null); // End scan session after error
      }
    } finally {
      setIsLoading(false);
      setActiveApiCall(null); // Clear API call tracking
    }
  };

  const resetForm = () => {
    setDonorId('');
    setDonorName('');
    setRollNumber('');
    setScannedData(null);
    setVerificationStatus(null);
    setMessage(null);
    setIsScanning(false);
    setIsProcessing(false); // Reset processing state
    setLastProcessedQR(null); // Reset last processed QR
    setLastProcessedTime(0); // Reset processing time
    setScanSession(null); // Reset scan session
    setDonationCompleted(false); // Reset donation completed state - allow new scanning
    setActiveApiCall(null); // Reset API call tracking
    setScannerDestroyed(false); // Reset scanner destruction flag - allow new scanning
    setVerifiedDonor(null); // Reset verified donor
  };

  const startQRScanning = () => {
    // Don't allow new scanning if donation is completed
    if (donationCompleted) {
      setMessage({ type: 'error', text: 'Donation already completed. Please reset the form to scan a new donor.' });
      return;
    }
    
    setIsScanning(true);
    setMessage(null);
    setIsProcessing(false); // Reset processing state
    setLastProcessedQR(null); // Reset last processed QR
    setLastProcessedTime(0); // Reset processing time
    setScanSession(null); // Reset scan session
    setLastProcessedQR(null); // Reset last processed QR
    setLastProcessedTime(0); // Reset processing time
  };

  const fetchRecentDonations = async () => {
    try {
      const response = await axios.get('/api/recent-donations');
      setRecentDonations(response.data.donations || []);
    } catch (error) {
      console.error('Error fetching recent donations:', error);
      setRecentDonations([]);
    }
  };

  useEffect(() => {
    if (activeTab === 'recent') {
      fetchRecentDonations();
    }
  }, [activeTab]);

  // Force scanner cleanup when donation is completed or scanner is destroyed
  useEffect(() => {
    if (donationCompleted || scannerDestroyed) {
      setIsScanning(false);
      console.log('=== FORCE SCANNER CLEANUP ===', { donationCompleted, scannerDestroyed });
    }
  }, [donationCompleted, scannerDestroyed]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Mark Donation
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Scan QR code or enter donor ID to mark donation as completed
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('qr')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'qr'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <QrCode className="h-4 w-4 inline mr-2" />
              QR Code Scan
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'manual'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="h-4 w-4 inline mr-2" />
              Manual Entry
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'recent'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="h-4 w-4 inline mr-2" />
              Recent Donations
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* QR Code Tab */}
          {activeTab === 'qr' && (
            <div className="space-y-6">
              <div className="text-center">
                {isScanning && !donationCompleted && !scannerDestroyed ? (
                  <QRScanner 
                    onScan={handleQRScan}
                    onClose={() => {
                      setIsScanning(false);
                      setScannerDestroyed(true);
                      console.log('=== QR SCANNER MANUALLY CLOSED & DESTROYED ===');
                    }}
                  />
                ) : (
                  <div className="space-y-4">
                    {!scannedData && !donationCompleted && (
                      <div className="text-center">
                        <button
                          onClick={startQRScanning}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          <QrCode className="h-5 w-5" />
                          Start QR Scanning
                        </button>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          Click to start scanning QR codes for donation marking
                        </p>
                      </div>
                    )}

                    {donationCompleted && (
                      <div className="text-center">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
                          <div className="text-green-600 text-4xl mb-2">✅</div>
                          <h3 className="text-lg font-semibold text-green-800 mb-2">Donation Completed Successfully!</h3>
                          <p className="text-green-700 mb-4">The donation has been marked and recorded. No further scanning is allowed for this session.</p>
                          <button
                            onClick={resetForm}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                          >
                            Mark Another Donation
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                )}
                
                {scannedData && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                      QR Code Scanned Successfully
                    </h4>
                    <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                      <p><span className="font-medium">Donor ID:</span> {scannedData.donorId}</p>
                      <p><span className="font-medium">Name:</span> {scannedData.name}</p>
                      <p><span className="font-medium">Roll No:</span> {scannedData.rollNo}</p>
                      <p><span className="font-medium">Mobile:</span> {scannedData.mobile}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Manual Entry Tab */}
          {activeTab === 'manual' && (
            <div className="space-y-6">
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label htmlFor="donorId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Donor ID *
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        id="donorId"
                        value={donorId}
                        onChange={(e) => {
                          setDonorId(e.target.value);
                          setVerifiedDonor(null); // Clear verified donor when ID changes
                        }}
                        placeholder="Enter unique donor ID (e.g., DONCOOBZH7T)"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        required
                      />
                      <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifyDonorId}
                      disabled={isVerifying || !donorId.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {isVerifying ? 'Verifying...' : 'Verify ID'}
                    </button>
                  </div>
                </div>

                {/* Display verified donor details */}
                {verifiedDonor && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Donor Found on Live Map
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm text-green-700 dark:text-green-300">
                      <div>
                        <span className="font-medium">Name:</span> {verifiedDonor.name || verifiedDonor.userName}
                      </div>
                      <div>
                        <span className="font-medium">Blood Group:</span> {verifiedDonor.bloodGroup}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span> {verifiedDonor.mobileNumber || verifiedDonor.phone || 'N/A'}
                      </div>
                      {verifiedDonor.email && (
                        <div>
                          <span className="font-medium">Email:</span> {verifiedDonor.email}
                        </div>
                      )}
                      {verifiedDonor.rollNumber && (
                        <div>
                          <span className="font-medium">Roll Number:</span> {verifiedDonor.rollNumber}
                        </div>
                      )}
                      {verifiedDonor.address && (
                        <div className="col-span-2">
                          <span className="font-medium">Location:</span> {verifiedDonor.address}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="donorName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Donor Name (Optional)
                  </label>
                  <input
                    type="text"
                    id="donorName"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="Enter donor name (optional)"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Roll Number (Optional)
                  </label>
                  <input
                    type="text"
                    id="rollNumber"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="Enter roll number (optional)"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Verifying...' : 'Verify & Mark Donation'}
                </button>
              </form>
            </div>
          )}

          {/* Recent Donations Tab */}
          {activeTab === 'recent' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Recent Donation Markings
                </h3>
                <button
                  onClick={fetchRecentDonations}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Refresh
                </button>
              </div>
              
              {recentDonations.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No recent donations found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Donor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Blood Group
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Completed At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Location
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {recentDonations.map((donation, index) => (
                        <tr key={donation._id || index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {donation.donorName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              {donation.donorBloodGroup}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {donation.donorPhone}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {new Date(donation.completedAt).toLocaleDateString()} {new Date(donation.completedAt).toLocaleTimeString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {donation.address || `${donation.location?.lat?.toFixed(4)}, ${donation.location?.lng?.toFixed(4)}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Verification Status */}
          {verificationStatus && (
            <div className="mt-6">
              {verificationStatus === 'pending' && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                    <span className="text-yellow-800 dark:text-yellow-200">Verifying donor information...</span>
                  </div>
                </div>
              )}

              {verificationStatus === 'verified' && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-green-800 dark:text-green-200 font-medium">Donation marked successfully!</span>
                  </div>
                </div>
              )}

              {verificationStatus === 'failed' && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-red-800 dark:text-red-200 font-medium">Verification failed</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Message Display */}
          {message && (
            <div className="mt-4">
              <div className={`rounded-lg p-4 ${
                message.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              }`}>
                {message.text}
              </div>
            </div>
          )}

          {/* Reset Button */}
          {(scannedData || verificationStatus) && (
            <div className="mt-6 text-center">
              <button
                onClick={resetForm}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Mark Another Donation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


