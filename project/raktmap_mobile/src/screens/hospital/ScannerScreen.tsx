import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
    Vibration,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../config/api';
import { format } from 'date-fns';

type TabType = 'scan' | 'manual' | 'recent';

interface DonationRecord {
    _id: string;
    donorName: string;
    donorBloodGroup: string;
    donorPhone: string;
    completedAt: string;
    location?: {
        lat: number;
        lng: number;
    };
    address?: string;
}

const ScannerScreen = () => {
    const navigation = useNavigation();
    const [permission, requestPermission] = useCameraPermissions();
    const [activeTab, setActiveTab] = useState<TabType>('scan');

    // Scanner States
    const [scanned, setScanned] = useState(false);
    const [scannerActive, setScannerActive] = useState(true);

    // Manual Entry States
    const [donorId, setDonorId] = useState('');
    const [donorName, setDonorName] = useState('');

    // Data/Loading States
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [recentDonations, setRecentDonations] = useState<DonationRecord[]>([]);
    const [verificationResult, setVerificationResult] = useState<{
        success: boolean;
        message: string;
        title: string;
    } | null>(null);

    useEffect(() => {
        if (activeTab === 'recent') {
            fetchRecentDonations();
        }
    }, [activeTab]);

    const fetchRecentDonations = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/recent-donations');
            if (response.data.success) {
                setRecentDonations(response.data.donations || []);
            }
        } catch (error) {
            console.error('Error fetching recent donations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
        if (scanned || !scannerActive) return;

        setScanned(true);
        setScannerActive(false);
        Vibration.vibrate();

        try {
            // Parse QR Data
            let parsedDonorId = '';
            let parsedRequestId = '';

            // Check for structured format (lines)
            if (data.includes('\n')) {
                const lines = data.split('\n').map(l => l.trim());
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];

                    // Check for DONOR_ID
                    if (line === 'DONOR_ID' && i + 1 < lines.length) {
                        parsedDonorId = lines[i + 1];
                    } else if (line.startsWith('DONOR_ID:')) {
                        parsedDonorId = line.split(':')[1].trim();
                    }

                    // Check for REQUEST_ID
                    if (line === 'REQUEST_ID' && i + 1 < lines.length) {
                        parsedRequestId = lines[i + 1];
                    } else if (line.startsWith('REQUEST_ID:')) {
                        parsedRequestId = line.split(':')[1].trim();
                    }
                }
            }

            // Fallback: If structured parsing failed to find donor ID, use regex
            if (!parsedDonorId) {
                const idMatch = data.match(/DON[A-Z0-9]+/);
                if (idMatch) {
                    parsedDonorId = idMatch[0];
                } else if (data.length > 5 && data.length < 20 && !data.includes(' ')) {
                    // Assume raw ID if it's short and has no spaces
                    parsedDonorId = data.trim();
                }
            }

            if (parsedDonorId) {
                verifyDonation(parsedDonorId, undefined, parsedRequestId);
            } else {
                Alert.alert(
                    'Invalid QR Code',
                    'Could not detect a valid Donor ID.',
                    [{
                        text: 'Scan Again', onPress: () => {
                            setScanned(false);
                            setScannerActive(true);
                        }
                    }]
                );
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to parse QR code');
            setScanned(false);
            setScannerActive(true);
        }
    };

    const verifyDonation = async (id: string, name?: string, requestId?: string) => {
        setVerifying(true);
        setVerificationResult(null);

        try {
            const response = await api.post('/api/mark-donation', {
                donorId: id,
                donorName: name,
                requestId: requestId
            });

            if (response.data.success) {
                setVerificationResult({
                    success: true,
                    title: 'Verified Successfully',
                    message: response.data.message || 'Donation marked successfully.'
                });
                // Refresh recent list silently
                fetchRecentDonations();
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Verification failed';
            setVerificationResult({
                success: false,
                title: 'Not Verified',
                message: errorMessage
            });
        } finally {
            setVerifying(false);
        }
    };

    const handleManualSubmit = () => {
        if (!donorId.trim()) {
            Alert.alert('Error', 'Please enter a Donor ID');
            return;
        }
        verifyDonation(donorId.trim(), donorName.trim());
    };

    const resetScanner = () => {
        setScanned(false);
        setScannerActive(true);
        setVerificationResult(null);
        setDonorId('');
        setDonorName('');
    };

    const renderResult = () => {
        if (!verificationResult) return null;

        const isSuccess = verificationResult.success;

        return (
            <View style={[styles.resultContainer, isSuccess ? styles.resultSuccess : styles.resultError]}>
                <Text style={styles.resultIcon}>{isSuccess ? '✅' : '❌'}</Text>
                <Text style={[styles.resultTitle, isSuccess ? styles.textSuccess : styles.textError]}>
                    {verificationResult.title}
                </Text>
                <Text style={styles.resultMessage}>{verificationResult.message}</Text>

                <TouchableOpacity
                    style={[styles.resetButton, isSuccess ? styles.buttonSuccess : styles.buttonError]}
                    onPress={resetScanner}
                >
                    <Text style={styles.resetButtonText}>
                        {activeTab === 'scan' ? 'Scan Next' : 'Verify Another'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (!permission) {
        // Camera permissions are still loading
        return <View style={styles.centerContainer}><ActivityIndicator /></View>;
    }

    if (!permission.granted) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.permissionText}>We need your permission to show the camera</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.permButton}>
                    <Text style={styles.permButtonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'scan' && styles.activeTab]}
                    onPress={() => setActiveTab('scan')}
                >
                    <Text style={[styles.tabText, activeTab === 'scan' && styles.activeTabText]}>Scan QR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'manual' && styles.activeTab]}
                    onPress={() => setActiveTab('manual')}
                >
                    <Text style={[styles.tabText, activeTab === 'manual' && styles.activeTabText]}>Manual</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'recent' && styles.activeTab]}
                    onPress={() => setActiveTab('recent')}
                >
                    <Text style={[styles.tabText, activeTab === 'recent' && styles.activeTabText]}>Recent</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {activeTab === 'scan' && (
                    <View style={styles.scannerContainer}>
                        {verificationResult ? (
                            renderResult()
                        ) : (
                            <View style={styles.cameraWrapper}>
                                <CameraView
                                    style={styles.camera}
                                    facing="back"
                                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                                >
                                    <View style={styles.overlay}>
                                        <View style={styles.scanFrame} />
                                        <Text style={styles.overlayText}>Align QR code within frame</Text>
                                    </View>
                                </CameraView>
                                {verifying && (
                                    <View style={styles.loadingOverlay}>
                                        <ActivityIndicator size="large" color="#DC2626" />
                                        <Text style={styles.loadingText}>Verifying...</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                )}

                {activeTab === 'manual' && (
                    <ScrollView style={styles.manualContainer}>
                        {verificationResult ? (
                            renderResult()
                        ) : (
                            <View style={styles.form}>
                                <Text style={styles.label}>Donor ID *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter Donor ID (e.g., DON...)"
                                    value={donorId}
                                    onChangeText={setDonorId}
                                    autoCapitalize="characters"
                                />

                                <Text style={styles.label}>Donor Name (Optional)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter Donor Name"
                                    value={donorName}
                                    onChangeText={setDonorName}
                                />

                                <TouchableOpacity
                                    style={[styles.submitButton, verifying && styles.disabledButton]}
                                    onPress={handleManualSubmit}
                                    disabled={verifying}
                                >
                                    {verifying ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.submitButtonText}>Verify & Mark Donation</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                )}

                {activeTab === 'recent' && (
                    <View style={styles.listContainer}>
                        <View style={styles.refreshContainer}>
                            <TouchableOpacity onPress={fetchRecentDonations} style={styles.refreshButton}>
                                <Text style={styles.refreshText}>Refresh List</Text>
                            </TouchableOpacity>
                        </View>

                        {loading ? (
                            <ActivityIndicator size="large" color="#DC2626" style={{ marginTop: 20 }} />
                        ) : (
                            <ScrollView>
                                {recentDonations.length === 0 ? (
                                    <Text style={styles.emptyText}>No recent donations found</Text>
                                ) : (
                                    recentDonations.map((donation, index) => (
                                        <View key={donation._id || index} style={styles.card}>
                                            <View style={styles.cardHeader}>
                                                <Text style={styles.cardTitle}>{donation.donorName}</Text>
                                                <Text style={styles.bloodGroup}>{donation.donorBloodGroup}</Text>
                                            </View>
                                            <View style={styles.cardRow}>
                                                <Text style={styles.cardLabel}>Phone:</Text>
                                                <Text style={styles.cardValue}>{donation.donorPhone || 'N/A'}</Text>
                                            </View>
                                            <View style={styles.cardRow}>
                                                <Text style={styles.cardLabel}>Date:</Text>
                                                <Text style={styles.cardValue}>
                                                    {donation.completedAt ? format(new Date(donation.completedAt), 'PP p') : 'N/A'}
                                                </Text>
                                            </View>
                                            <View style={styles.cardRow}>
                                                <Text style={styles.cardLabel}>Status:</Text>
                                                <Text style={styles.statusCompleted}>Completed</Text>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </ScrollView>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#DC2626',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#DC2626',
    },
    content: {
        flex: 1,
    },
    // Scanner Styles
    scannerContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    cameraWrapper: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    scanFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: '#fff',
        backgroundColor: 'transparent',
        borderRadius: 12,
    },
    overlayText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 20,
        fontWeight: '500',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#374151',
    },
    // Result Styles
    resultContainer: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    resultSuccess: {
        backgroundColor: '#F0FDF4',
    },
    resultError: {
        backgroundColor: '#FEF2F2',
    },
    resultIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    resultTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    textSuccess: {
        color: '#166534',
    },
    textError: {
        color: '#991B1B',
    },
    resultMessage: {
        fontSize: 16,
        color: '#374151',
        textAlign: 'center',
        marginBottom: 32,
    },
    resetButton: {
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 8,
        minWidth: 200,
        alignItems: 'center',
    },
    buttonSuccess: {
        backgroundColor: '#166534',
    },
    buttonError: {
        backgroundColor: '#991B1B',
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Manual Entry Styles
    manualContainer: {
        flex: 1,
        padding: 20,
    },
    form: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#111827',
    },
    submitButton: {
        backgroundColor: '#DC2626',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
    },
    disabledButton: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Recent List Styles
    listContainer: {
        flex: 1,
        padding: 16,
    },
    refreshContainer: {
        alignItems: 'flex-end',
        marginBottom: 16,
    },
    refreshButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#EEF2FF',
        borderRadius: 6,
    },
    refreshText: {
        color: '#4F46E5',
        fontSize: 14,
        fontWeight: '500',
    },
    emptyText: {
        textAlign: 'center',
        color: '#6B7280',
        marginTop: 40,
        fontSize: 16,
    },
    card: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderColor: '#E5E7EB',
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    bloodGroup: {
        backgroundColor: '#FEE2E2',
        color: '#991B1B',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 100,
        fontSize: 12,
        fontWeight: '600',
    },
    cardRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    cardLabel: {
        width: 60,
        fontSize: 14,
        color: '#6B7280',
    },
    cardValue: {
        flex: 1,
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    statusCompleted: {
        color: '#059669',
        fontWeight: '600',
        fontSize: 14,
    },
    permissionText: {
        fontSize: 16,
        color: '#374151',
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 40,
    },
    permButton: {
        backgroundColor: '#DC2626',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    permButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ScannerScreen;
