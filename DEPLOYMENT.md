# RaktMap Deployment Guide

## Overview
RaktMap uses a **split deployment architecture**:
- **Frontend**: Deployed on Vercel (static React app)
- **Backend**: Should be deployed on Render, Railway, or similar (Node.js server)

## Why This Architecture?

Your backend has:
- Long-running processes
- MongoDB change streams
- Real-time notifications
- Complex database operations

These features work better on platforms designed for persistent Node.js servers (like Render) rather than Vercel's serverless functions.

---

## 🚀 Deployment Steps

### Step 1: Deploy Backend (Render Recommended)

1. **Go to [Render.com](https://render.com)** and sign in
2. **Create New Web Service**
3. **Connect your GitHub repository**
4. **Configure the service:**
   - **Name**: `raktmap-backend`
   - **Root Directory**: `project/backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or paid for better performance)

5. **Add Environment Variables:**
   ```
   MONGODB_URI=<your-mongodb-atlas-connection-string>
   JWT_SECRET=<your-secret-key>
   TWILIO_ACCOUNT_SID=<your-twilio-sid>
   TWILIO_AUTH_TOKEN=<your-twilio-token>
   TWILIO_PHONE_NUMBER=<your-twilio-phone>
   ```

6. **Deploy** and copy the backend URL (e.g., `https://raktmap-backend.onrender.com`)

---

### Step 2: Deploy Frontend (Vercel)

1. **Go to [Vercel.com](https://vercel.com)** and sign in
2. **Import your GitHub repository**
3. **Configure the project:**
   - **Framework Preset**: Vite
   - **Root Directory**: Leave as is (vercel.json handles it)
   - **Build Command**: Will use vercel.json settings
   - **Output Directory**: Will use vercel.json settings

4. **Add Environment Variable:**
   - Go to **Settings** → **Environment Variables**
   - Add:
     ```
     Name: VITE_API_URL
     Value: https://raktmap-backend.onrender.com
     ```
     (Replace with your actual backend URL from Step 1)

5. **Deploy**

---

### Step 3: Update Backend CORS

After deploying frontend, update your backend's CORS configuration:

1. **Edit `project/backend/server.js`** (around line 45-52)
2. **Add your Vercel URL** to the allowed origins:
   ```javascript
   app.use(cors({
     origin: [
       'http://localhost:5173',
       'http://localhost:5174',
       'https://donor-location-tracker.onrender.com',
       'https://your-vercel-app.vercel.app',  // Add this
       'https://your-custom-domain.com'        // If you have one
     ],
     credentials: true
   }));
   ```

3. **Commit and push** - Render will auto-redeploy

---

## 🔧 Troubleshooting

### Frontend Build Fails
- Check that `VITE_API_URL` environment variable is set in Vercel
- Verify the build command in vercel.json
- Check build logs for specific errors

### Backend Connection Issues
- Verify MongoDB Atlas allows connections from `0.0.0.0/0` (or Render's IP ranges)
- Check all environment variables are set correctly
- Review Render logs for connection errors

### CORS Errors
- Make sure your Vercel URL is added to backend CORS origins
- Verify `credentials: true` is set in CORS config
- Check that frontend is using the correct API URL

---

## 📝 Current Configuration

### Files Modified:
1. ✅ `project/backend/package.json` - Added required fields
2. ✅ `project/frontend/package.json` - Added vercel-build script
3. ✅ `vercel.json` - Configured for frontend-only deployment
4. ✅ `project/frontend/src/utils/axios.ts` - Uses environment variable
5. ✅ `project/frontend/src/contexts/AuthContext.tsx` - Uses environment variable
6. ✅ `project/frontend/.env.example` - Documents required variables

### Environment Variables Needed:

**Backend (Render):**
- `MONGODB_URI`
- `JWT_SECRET`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

**Frontend (Vercel):**
- `VITE_API_URL` (your backend URL)

---

## 🎯 Next Steps

1. ✅ Code changes are committed and pushed
2. ⏳ Deploy backend to Render (or similar)
3. ⏳ Get backend URL
4. ⏳ Add `VITE_API_URL` to Vercel environment variables
5. ⏳ Trigger Vercel redeploy
6. ⏳ Update backend CORS with Vercel URL
7. ✅ Test the application!

---

## 💡 Alternative: Deploy Everything to Render

If you prefer a simpler setup, you can deploy both frontend and backend to Render:

1. **Backend**: Same as above
2. **Frontend**: 
   - Create a new Static Site on Render
   - Root Directory: `project/frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Add `VITE_API_URL` environment variable

This gives you everything on one platform, though Vercel typically has better global CDN for frontend assets.
