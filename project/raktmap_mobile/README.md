# Raktmap Mobile App

A React Native mobile application for the Raktmap blood donation system, built with Expo.

## 📱 Features

- **Role-based Authentication** (Donor, Hospital, Admin)
- **Real-time Location Tracking**
- **Blood Request Management**
- **QR Code Scanning for Donation Verification**
- **Push Notifications**
- **Interactive Maps**

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- For building APK: EAS CLI (`npm install -g eas-cli`)

### Installation

All dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### Configuration

#### 1. Update API URL

Edit `src/config/api.ts` and replace `YOUR_LOCAL_IP` with your computer's IP address:

```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.100:5000/api'  // Replace with your IP
  : 'https://your-production-api.com/api';
```

**To find your local IP:**
- Windows: Run `ipconfig` in terminal, look for "IPv4 Address"
- Mac/Linux: Run `ifconfig` or `ip addr`

#### 2. Add Google Maps API Key (for Android)

1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Edit `app.json` and replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual key

#### 3. Start Your Backend Server

Make sure your backend server is running:

```bash
cd ../backend
npm start
```

## 🏃 Running the App

### Development with Expo Go

1. Start the development server:

```bash
npx expo start
```

2. Scan the QR code with:
   - **Android**: Expo Go app
   - **iOS**: Camera app (requires Mac for full iOS development)

### Run on Android Emulator

```bash
npx expo run:android
```

### Run on iOS Simulator (Mac only)

```bash
npx expo run:ios
```

## 📦 Building APK for Android

### Method 1: Using EAS Build (Recommended)

1. **Install EAS CLI** (if not already installed):

```bash
npm install -g eas-cli
```

2. **Login to Expo Account**:

```bash
eas login
```

If you don't have an account, create one at [expo.dev](https://expo.dev)

3. **Configure EAS Project**:

```bash
eas build:configure
```

This will update your `app.json` with a project ID.

4. **Build APK**:

```bash
# For development build
eas build --platform android --profile development

# For preview/testing build  
eas build --platform android --profile preview

# For production build
eas build --platform android --profile production
```

5. **Download the APK**:

After the build completes (5-15 minutes), you'll get a download link. You can also find it at:
- [https://expo.dev/accounts/YOUR_USERNAME/projects/raktmap-mobile/builds](https://expo.dev)

### Method 2: Local Build (Requires Android Studio)

1. **Install Android Studio** and configure Android SDK

2. **Build locally**:

```bash
npx expo run:android --variant release
```

3. **Find APK at**:
```
android/app/build/outputs/apk/release/app-release.apk
```

## 📲 Installing APK on Device

### Transfer APK to Phone

1. **Via USB**:
   - Connect phone to computer
   - Copy APK to phone's Downloads folder

2. **Via Cloud**:
   - Upload APK to Google Drive/Dropbox
   - Download on phone

3. **Via QR Code** (from EAS Build):
   - EAS provides a QR code for direct installation

### Install on Android Device

1. Open the APK file on your phone
2. If prompted, allow installation from unknown sources:
   - Settings → Security → Unknown Sources → Enable
   - Or Settings → Apps → Special Access → Install Unknown Apps
3. Tap "Install"

## 🔧 Project Structure

```
raktmap_mobile/
├── App.tsx                 # Main app entry point with navigation
├── app.json               # Expo configuration
├── eas.json              # EAS Build configuration
├── src/
│   ├── config/
│   │   └── api.ts        # API configuration and axios setup
│   ├── contexts/
│   │   └── AuthContext.tsx  # Authentication context
│   ├── screens/
│   │   ├── WelcomeScreen.tsx
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── donor/
│   │   │   └── DonorDashboard.tsx
│   │   ├── hospital/
│   │   │   └── HospitalDashboard.tsx
│   │   └── admin/
│   │       └── AdminDashboard.tsx
│   └── types/
│       └── index.ts      # TypeScript type definitions
└── assets/               # Images and icons
```

## 🛠️ Next Steps for Development

### 1. Implement Donor Features
- [ ] Nearby blood requests map
- [ ] Accept/decline donation requests
- [ ] Donation history
- [ ] Profile management
- [ ] Real-time location sharing

### 2. Implement Hospital Features
- [ ] Create blood requests
- [ ] View available donors on map
- [ ] Search donors by blood group
- [ ] QR code scanning for donation verification
- [ ] Request management

### 3. Implement Admin Features
- [ ] User management
- [ ] Analytics dashboard
- [ ] Verification of hospitals
- [ ] System notifications

### 4. Add Common Features
- [ ] Push notifications
- [ ] In-app messaging
- [ ] Profile photo upload
- [ ] Settings page
- [ ] About/Help screens

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
API_URL=http://YOUR_IP:5000/api
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

Install env package:
```bash
npm install react-native-dotenv
```

## 🐛 Troubleshooting

### "Unable to connect to server"
- Ensure backend server is running
- Check that your phone and computer are on the same WiFi network
- Verify the IP address in `src/config/api.ts` is correct
- Disable VPN on both devices

### "Maps not showing"
- Add Google Maps API key in `app.json`
- Enable Maps SDK for Android in Google Cloud Console

### "Build failed on EAS"
- Check that package.json has no syntax errors
- Ensure all dependencies are properly installed
- Review build logs on expo.dev

### "App crashes on startup"
- Check expo-splash-screen configuration
- Verify all required assets exist in assets folder
- Review error logs with `npx expo start`

## 📚 Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [EAS Build](https://docs.expo.dev/build/introduction/)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test on both Android and iOS
4. Submit a pull request

## 📄 License

MIT License - feel free to use this project for learning and development.

## 🆘 Support

For issues or questions:
- Check the troubleshooting section above
- Review Expo documentation
- Contact the development team

---

**Built with ❤️ for saving lives through blood donation**
