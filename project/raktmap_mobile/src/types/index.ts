export type UserRole = 'admin' | 'hospital' | 'donor' | 'user';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  isProfileComplete?: boolean;
  willingToDonate?: boolean;  // For donor/user roles in single collection
  bloodGroup?: string;  // Optional, required when role='donor'
}

export interface Donor extends User {
  bloodGroup: string;
  dateOfBirth: Date;
  gender: 'Male' | 'Female' | 'Other';
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  address: string;
  lastDonationDate?: Date;
  totalDonations: number;
  willingToDonate: boolean;  // True = donor receiving SMS, False = user not receiving SMS
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  birthdate?: Date;
  city?: string;
  state?: string;
  hasTattoo?: boolean;
  isHIVPositive?: boolean;
}

export interface Hospital extends User {
  hospitalName: string;
  address: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  registrationNumber: string;
  contactPerson: string;
  isVerified: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
}

export interface BloodRequest {
  _id: string;
  hospital: Hospital | string;
  bloodGroup: string;
  unitsRequired: number;
  urgency: 'critical' | 'urgent' | 'normal';
  patientName: string;
  patientAge: number;
  requiredBy: Date;
  contactNumber: string;
  additionalNotes?: string;
  status: 'active' | 'fulfilled' | 'cancelled' | 'expired';
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  notifiedDonors: string[];
  interestedDonors: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DonationHistory {
  _id: string;
  donor: Donor | string;
  hospital: Hospital | string;
  bloodRequest?: BloodRequest | string;
  donationDate: Date;
  bloodGroup: string;
  volume: number;
  notes?: string;
  verificationToken?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  createdAt: Date;
}

export interface Notification {
  _id: string;
  recipient: string;
  recipientModel: 'Donor' | 'Hospital' | 'Admin';
  type: 'blood_request' | 'donation_reminder' | 'urgent_request' | 'system' | 'donation_confirmed';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<User>;
}
