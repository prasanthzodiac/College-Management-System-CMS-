# 🚀 Quick Deployment Guide

## TL;DR

- **Frontend** → Vercel ✅
- **Backend** → Railway (NOT Vercel) ⚠️

---

## Step 1: Deploy Backend to Railway (5 minutes)

1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Set **Root Directory** to `backend`
5. Add environment variables (see below)
6. Deploy! Railway will auto-detect Node.js and build

### Required Environment Variables:
```
PORT=8080
NODE_ENV=production
DATABASE_URL=your-database-url
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
CORS_ORIGIN=https://your-frontend.vercel.app
```

**Get your backend URL**: `https://your-project.railway.app`

---

## Step 2: Deploy Frontend to Vercel (3 minutes)

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click "New Project" → Import GitHub repo
3. Set **Root Directory** to `frontend`
4. Framework: **Vite** (auto-detected)
5. Add environment variables:
   ```
   VITE_API_BASE_URL=https://your-project.railway.app
   VITE_FIREBASE_API_KEY=your-firebase-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```
6. Deploy!

---

## Step 3: Update CORS (1 minute)

1. Go back to Railway dashboard
2. Add your Vercel frontend URL to `CORS_ORIGIN`:
   ```
   CORS_ORIGIN=https://your-frontend.vercel.app
   ```
3. Redeploy backend (Railway auto-redeploys on env var changes)

---

## Step 4: Test (2 minutes)

1. Visit your Vercel frontend URL
2. Try logging in
3. Check browser console for errors
4. Test real-time features (attendance updates)

---

## ✅ Done!

Your app is now live:
- Frontend: `https://your-project.vercel.app`
- Backend: `https://your-project.railway.app`

---

## 🆘 Common Issues

**Socket.io not connecting?**
- Make sure backend is on Railway (NOT Vercel)
- Check `CORS_ORIGIN` includes frontend URL
- Verify backend URL in `VITE_API_BASE_URL`

**Database errors?**
- Check `DATABASE_URL` is correct
- Ensure database allows connections from Railway IPs
- Run `npm run seed` if needed

**CORS errors?**
- Update `CORS_ORIGIN` in Railway with your Vercel URL
- Redeploy backend

---

For detailed instructions, see `DEPLOYMENT.md`

