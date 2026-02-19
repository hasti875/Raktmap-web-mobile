# 🚀 Quick Start Guide - Raktmap Mobile

## Step 1: Update API Configuration

1. Find your computer's IP address:
   ```bash
   ipconfig  # Windows
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.100)

2. Edit `src/config/api.ts`:
   ```typescript
   const API_BASE_URL = __DEV__ 
     ? 'http://192.168.1.100:5000/api'  // ← Replace with YOUR IP
     : 'https://your-production-api.com/api';
   ```

## Step 2: Start Backend Server

```bash
cd ../backend
npm start
```

Keep this terminal running!

## Step 3: Run the Mobile App

Open a new terminal:

```bash
cd E:\Innovate_BatchSMS\project\raktmap_mobile
npx expo start
```

## Step 4: Test on Your Phone

1. Install **Expo Go** app from Play Store/App Store
2. Scan the QR code from the terminal
3. App will load on your phone!

**Important**: Your phone and computer must be on the same WiFi network.

---

## Building APK (For Sharing)

### Quick Method - EAS Build

```bash
# 1. Install EAS CLI (one-time)
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Configure EAS
eas build:configure

# 4. Build APK
eas build --platform android --profile preview
```

Wait 5-15 minutes, then download APK from the provided link!

### Alternative - Android Studio Method

Requires Android Studio installed:

```bash
npx expo run:android --variant release
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

---

## Testing the App

### Test Features:
1. ✅ Welcome screen appears
2. ✅ Navigate to Register
3. ✅ Create donor account
4. ✅ Login with credentials
5. ✅ See personalized dashboard

### Current Status:
- ✅ Authentication (Login/Register)
- ✅ Role-based navigation
- 🚧 Donor features (TODO)
- 🚧 Hospital features (TODO)
- 🚧 Maps integration (TODO)
- 🚧 Notifications (TODO)

---

## Common Issues

### "Cannot connect to backend"
- ✅ Check backend is running on `localhost:5000`
- ✅ Verify IP address in `api.ts` is correct
- ✅ Ensure phone and PC on same WiFi
- ✅ Turn off VPN

### "Metro bundler error"
```bash
# Clear cache and restart
npx expo start -c
```

### "Module not found"
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

---

## Project Structure Overview

```
src/
├── config/api.ts          ← Configure your backend URL here
├── contexts/              ← State management (Auth)
├── screens/               ← All app screens
│   ├── auth/             ← Login/Register
│   ├── donor/            ← Donor dashboard & features
│   ├── hospital/         ← Hospital dashboard & features
│   └── admin/            ← Admin dashboard
└── types/                ← TypeScript definitions
```

---

## Next Development Steps

### 1. Implement Donor Dashboard
- [ ] Show nearby blood requests on map
- [ ] List of active requests
- [ ] Accept/Decline requests
- [ ] View donation history

### 2. Implement Hospital Dashboard  
- [ ] Create new blood request
- [ ] View available donors on map
- [ ] QR code scanner for donations
- [ ] Manage active requests

### 3. Add Map Features
- [ ] Integrate Google Maps
- [ ] Show user location
- [ ] Display markers for requests/donors
- [ ] Calculate distances

### 4. Add Notifications
- [ ] Push notification setup
- [ ] Real-time request alerts
- [ ] Donation reminders

---

## Useful Commands

```bash
# Start development server
npx expo start

# Start with cache cleared
npx expo start -c

# Run on Android emulator
npx expo run:android

# Build APK with EAS
eas build -p android --profile preview

# Check for updates
npx expo-doctor

# Install new package
npx expo install package-name
```

---

## Resources

- 📖 [Full README](README.md) - Complete documentation
- 🌐 [Expo Docs](https://docs.expo.dev/)
- 🗺️ [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- 📱 [React Navigation](https://reactnavigation.org/)

---

**Need Help?** Check the troubleshooting section in the main README.md

**Ready to Build?** You now have a working foundation. Start implementing features one by one! 🎉
