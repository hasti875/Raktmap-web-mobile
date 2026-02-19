# Testing Guide - Raktmap Mobile App

## 🧪 Quick Test: Login with Existing Backend Credentials

### Step 1: Verify Backend is Running

Open terminal in backend folder:
```bash
cd E:\Innovate_BatchSMS\project\backend
npm run dev
```

You should see: `✅ MongoDB connected successfully!`

### Step 2: Check Your IP Address

```bash
ipconfig
```

Look for **IPv4 Address** (e.g., `10.185.242.181`)

### Step 3: Update Mobile App Configuration

The IP is already set in [src/config/api.ts](src/config/api.ts):
```typescript
const API_BASE_URL = 'http://10.185.242.181:5000'
```

**If your IP is different**, update it to match your actual IP address.

### Step 4: Start the Mobile App

```bash
cd E:\Innovate_BatchSMS\project\raktmap_mobile
npx expo start
```

### Step 5: Test on Your Phone

1. **Install Expo Go** from Play Store/App Store
2. **Connect to same WiFi** as your computer
3. **Scan the QR code** from the terminal
4. App will load!

### Step 6: Login with Backend Credentials

Use **any existing account** from your web app:

#### Test with Admin Account:
- Email: `admin@raktmap.com` (or your admin email)
- Password: Your admin password

#### Test with Hospital Account:
- Email: Any hospital email from your backend
- Password: The hospital's password

**The app will automatically detect if you're an admin or hospital and show the correct dashboard!**

---

## 🔍 Troubleshooting Login Issues

### Issue: "Network Error" or "Cannot connect"

**Check:**
1. ✅ Backend is running on port 5000
2. ✅ Your phone and PC are on the **same WiFi network**
3. ✅ IP address in `api.ts` matches your computer's IP
4. ✅ Turn off VPN on both phone and computer
5. ✅ Check Windows Firewall (may need to allow Node.js)

**Test backend connection:**
Open browser on your phone and visit:
```
http://YOUR_IP:5000/donors
```

If you see data or "Token required" → Backend is accessible ✅
If it doesn't load → Network issue ❌

### Issue: "Invalid credentials"

**This means the connection works but credentials are wrong!**

1. Check you're using the correct email (lowercase)
2. Verify password is correct
3. Try logging in on the web app first to confirm credentials

### Issue: "MongoDB not connected"

Backend can't reach database:
1. Check your `.env` file has correct `MONGODB_URI`
2. Check MongoDB Atlas network access
3. Restart backend server

---

## 🆕 Testing New Registration

### Hospital Registration (Works)

1. Tap "Create Account"
2. Fill in:
   - Name: Test Hospital
   - Email: test@hospital.com
   - Phone: 9876543210
   - Role: Hospital
   - Password: test123
3. Tap "Create Account"
4. **Check your email for OTP**
5. Enter the 6-digit OTP
6. Complete registration!

### Donor Registration (Requires Admin)

Currently, donors must be created by admins through the web dashboard. This is to maintain verification quality.

**Alternative:** If you want donors to self-register, we can create a simplified donor registration endpoint.

---

## 📱 Testing Different User Roles

### As Hospital:
After login, you'll see:
- **Hospital Dashboard**
- (Features being built: Create blood requests, Find donors, etc.)

### As Admin:
After login, you'll see:
- **Admin Dashboard**
- (Features being built: User management, Analytics, etc.)

### As Donor:
- Currently requires admin to create account via web dashboard
- Once created, can login via mobile app

---

## 🐛 Enable Debug Logs

To see what's happening behind the scenes:

### Backend Logs:
Terminal running `npm run dev` shows:
- All API requests
- Database queries
- Errors

### Mobile App Logs:
Terminal running `npx expo start` shows:
- Network requests
- JavaScript errors

To see detailed network logs:
```bash
# Clear cache and restart with verbose logging
npx expo start -c
```

---

## ✅ Working Features Checklist

Test these features:

- [ ] Open app → See Welcome screen
- [ ] Tap "Sign In" → See Login screen
- [ ] Enter credentials → Login successful
- [ ] See correct dashboard (Admin/Hospital)
- [ ] Logout → Return to Welcome screen
- [ ] Tap "Create Account" → See Register screen
- [ ] Register hospital → OTP verification flow
- [ ] Complete registration → Login works

---

## 🚀 Next: Build Full Features

Once login is working, we can build:

### For Hospitals:
1. **Create Blood Request Screen**
   - Form to submit urgent blood needs
   - Select blood group, urgency, location
   
2. **View Available Donors Map**
   - Show nearby donors on map
   - Filter by blood group, distance
   
3. **QR Scanner for Donation Verification**
   - Scan donor QR code
   - Mark donation complete

### For Donors:
1. **View Nearby Requests Map**
   - See urgent blood requests
   - Calculate distance
   
2. **Accept/Decline Requests**
   - Respond to notifications
   - Update availability
   
3. **Donation History**
   - View past donations
   - Track impact

### For Admins:
1. **User Management**
   - Approve/reject hospitals
   - Create donor accounts
   - Manage access
   
2. **Analytics Dashboard**
   - Total donations
   - Active requests
   - User statistics

---

## 🔧 Common Fixes

### Clear App Cache
If app behaves strangely:
```bash
# Stop expo
# Then restart with cache cleared
npx expo start -c
```

### Reset Auth State
If stuck on login screen:
1. Close app completely
2. Reopen from Expo Go
3. Try again

### Check Backend Connection
Test endpoint directly:
```bash
# On your computer
curl http://localhost:5000/donors

# From another device (use your IP)
curl http://YOUR_IP:5000/donors
```

---

## 📞 Need Help?

**Connection Issues:**
- Verify same WiFi network
- Check IP address is correct
- Test backend in browser on phone

**Login Issues:**
- Confirm credentials work on web app
- Check backend logs for errors
- Try different account

**Registration Issues:**
- Check email spam folder for OTP
- Verify email service is configured in backend
- Try resending OTP

---

**Ready to test?** 
1. Start backend: `npm run dev`
2. Start mobile app: `npx expo start`
3. Open Expo Go and scan QR
4. Login with your credentials! 🎉
