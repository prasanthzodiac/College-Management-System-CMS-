# 🚀 Step-by-Step Deployment Guide

## ✅ Pre-Deployment Checklist

Before deploying, make sure you have:

- [ ] **GitHub Repository**: Code pushed to GitHub
- [ ] **Database**: MySQL database ready (PlanetScale, Railway MySQL, or your own)
- [ ] **Firebase Project**: Created with Web app and Service Account
- [ ] **Cloudinary Account** (optional, for file uploads)
- [ ] **SendGrid Account** (optional, for emails)

---

## 📝 Step 1: Prepare Environment Variables

### Backend Variables (for Railway/Render/Fly.io)

Create a list of your backend environment variables:

```
PORT=8080
NODE_ENV=production
DATABASE_URL=mysql://user:password@host:port/database?sslaccept=strict
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
CORS_ORIGIN=https://your-frontend.vercel.app
```

*(You'll update CORS_ORIGIN after deploying frontend)*

### Frontend Variables (for Vercel)

Create a list of your frontend environment variables:

```
VITE_API_BASE_URL=https://your-backend.railway.app
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

---

## 🚂 Step 2: Deploy Backend to Railway

### 2.1 Create Railway Account
1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub

### 2.2 Deploy from GitHub
1. Click "New Project" → "Deploy from GitHub repo"
2. Select your repository
3. **IMPORTANT**: Click on the service → Settings → Set **Root Directory** to `backend`

### 2.3 Configure Build Settings
Railway auto-detects, but verify:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 2.4 Add Environment Variables
1. Go to your service → Variables tab
2. Add each variable from Step 1
3. For `CORS_ORIGIN`, use a placeholder first: `https://placeholder.vercel.app`
4. Click "Deploy"

### 2.5 Get Backend URL
1. Wait for deployment to complete
2. Go to Settings → Networking
3. Generate a domain or use the provided one
4. Copy your backend URL: `https://your-project.railway.app`
5. Test: Visit `https://your-project.railway.app/health` (should return `{"ok":true}`)

---

## ⚡ Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub

### 3.2 Import Project
1. Click "Add New..." → "Project"
2. Import your GitHub repository
3. **IMPORTANT**: Set **Root Directory** to `frontend`
4. Framework: **Vite** (auto-detected)

### 3.3 Configure Environment Variables
1. Before deploying, go to "Environment Variables"
2. Add all variables from Step 1 (Frontend Variables)
3. For `VITE_API_BASE_URL`, use your Railway backend URL from Step 2.5
4. Click "Save"

### 3.4 Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Get your frontend URL: `https://your-project.vercel.app`

---

## 🔄 Step 4: Update CORS Settings

1. Go back to Railway dashboard
2. Go to your backend service → Variables
3. Update `CORS_ORIGIN` with your actual Vercel URL:
   ```
   CORS_ORIGIN=https://your-project.vercel.app
   ```
4. Railway will automatically redeploy with new settings

---

## 🗄️ Step 5: Database Setup

### 5.1 Create Database (if not done)
- **PlanetScale**: Create database and get connection string
- **Railway MySQL**: Add MySQL service, get connection string
- **Your own MySQL**: Ensure it's accessible from Railway

### 5.2 Run Database Migrations
The backend auto-syncs on startup, but you can manually seed:

**Option A: Via Railway CLI**
```bash
railway run npm run seed
```

**Option B: Via Local Machine**
1. Set `DATABASE_URL` in your local `.env`
2. Run: `cd backend && npm run seed`

### 5.3 Verify Database Connection
Check Railway logs to ensure database connection is successful.

---

## ✅ Step 6: Test Deployment

### 6.1 Test Backend
```bash
# Health check
curl https://your-backend.railway.app/health

# Should return: {"ok":true}
```

### 6.2 Test Frontend
1. Visit: `https://your-frontend.vercel.app`
2. Try logging in with demo accounts:
   - Admin: `admin@college.edu` / `password`
   - Staff: `staff@college.edu` / `password`
   - Student: `student1@college.edu` / `password`

### 6.3 Test Real-time Features
1. Open two browser windows
2. Login as staff in one, student in another
3. Record attendance in staff window
4. Verify it updates in real-time in student window

### 6.4 Check Browser Console
- Open browser DevTools → Console
- Look for any errors
- Verify Socket.io connection is established

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: Deployment fails
- **Solution**: Check Railway logs, verify all environment variables are set

**Problem**: Database connection error
- **Solution**: Verify `DATABASE_URL` format, check database is accessible

**Problem**: Socket.io not connecting
- **Solution**: Ensure backend is on Railway (NOT Vercel), check CORS settings

### Frontend Issues

**Problem**: API calls failing
- **Solution**: Check `VITE_API_BASE_URL` is correct, verify CORS on backend

**Problem**: Firebase auth not working
- **Solution**: Verify all Firebase env vars are set correctly

**Problem**: Build fails
- **Solution**: Check Vercel build logs, ensure all dependencies are in package.json

---

## 📊 Deployment Status

After deployment, you should have:

- ✅ Backend: `https://your-backend.railway.app`
- ✅ Frontend: `https://your-frontend.vercel.app`
- ✅ Database: Connected and synced
- ✅ Socket.io: Working (real-time features)
- ✅ Authentication: Firebase working

---

## 🔗 Quick Links

- **Railway Dashboard**: https://railway.app/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Backend Health**: `https://your-backend.railway.app/health`
- **Frontend**: `https://your-frontend.vercel.app`

---

## 📝 Notes

- **Never commit `.env` files** - Use platform environment variables
- **Update CORS after frontend deployment** - Backend needs frontend URL
- **Monitor logs** - Check Railway and Vercel logs for errors
- **Database seeding** - Run `npm run seed` after first deployment

---

**Ready to deploy? Follow the steps above! 🚀**

