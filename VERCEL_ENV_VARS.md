# 🔐 Vercel Environment Variables Setup

## Required Environment Variables

Add these environment variables in your Vercel deployment configuration:

### 1. Backend API URL
```
VITE_API_BASE_URL=https://your-backend.railway.app
```
**Note**: Replace `your-backend.railway.app` with your actual Railway backend URL (you'll get this after deploying the backend).

**For now**: You can use a placeholder like `https://placeholder.railway.app` and update it later, OR wait until you deploy the backend first.

### 2. Firebase Configuration
Get these from Firebase Console → Project Settings → Your apps → Web app config:

```
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
```

## How to Add in Vercel

1. **Remove the example variable** (EXAMPLE_NAME)
   - Click the remove button (horizontal line icon) next to it

2. **Add each variable**:
   - Click "Add More" button
   - Enter the Key (e.g., `VITE_API_BASE_URL`)
   - Enter the Value (e.g., `https://your-backend.railway.app`)
   - Repeat for all variables

3. **Or Import .env file**:
   - If you have a `.env` file locally, click "Import .env"
   - Paste the contents

## Deployment Order Options

### Option A: Deploy Frontend First (Recommended)
1. Add all Firebase variables now
2. Use placeholder for `VITE_API_BASE_URL`: `https://placeholder.railway.app`
3. Deploy frontend
4. Deploy backend to Railway
5. Update `VITE_API_BASE_URL` in Vercel with actual backend URL
6. Redeploy frontend (or it will auto-redeploy)

### Option B: Deploy Backend First
1. Deploy backend to Railway first
2. Get backend URL
3. Add all environment variables (including real backend URL)
4. Deploy frontend

## Current Vercel Settings ✅

Based on your configuration:
- ✅ **Root Directory**: `frontend` (correct)
- ✅ **Framework**: Vite (correct)
- ✅ **Build Command**: `vite build` (correct)
- ✅ **Output Directory**: `dist` (correct)

Everything looks good! Just need to add the environment variables.

