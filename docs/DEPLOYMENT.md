# Deployment Guide

## Overview

This project requires **two separate deployments**:
- **Frontend**: Deploy to Vercel (perfect for React/Vite)
- **Backend**: Deploy to Railway/Render/Fly.io (supports Socket.io WebSockets)

---

## 🎨 Frontend Deployment (Vercel)

### Prerequisites
- Vercel account (free tier available)
- GitHub repository with your code

### Steps

1. **Push your code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - **Root Directory**: Select `frontend` folder
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Environment Variables** (in Vercel dashboard)
   ```
   VITE_API_BASE_URL=https://your-backend-url.railway.app
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your frontend will be live at `https://your-project.vercel.app`

---

## ⚙️ Backend Deployment Options

### Option 1: Railway (Recommended) 🚂

**Why Railway?**
- ✅ Supports WebSockets (Socket.io)
- ✅ Easy database integration
- ✅ Free tier available
- ✅ Simple deployment from GitHub

#### Steps:

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - **Root Directory**: Select `backend` folder

3. **Configure Build Settings**
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Watch Paths**: `backend/**`

4. **Add Environment Variables**
   ```
   PORT=8080
   NODE_ENV=production
   
   # Database (PlanetScale or Railway MySQL)
   DATABASE_URL=mysql://user:password@host:port/database
   
   # Firebase Admin
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY=your-private-key
   FIREBASE_CLIENT_EMAIL=your-client-email
   
   # CORS (use your Vercel frontend URL)
   CORS_ORIGIN=https://your-frontend.vercel.app
   
   # Cloudinary (optional, for file uploads)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   
   # SendGrid (optional, for emails)
   SENDGRID_API_KEY=your-sendgrid-key
   ```

5. **Deploy**
   - Railway will automatically deploy
   - Get your backend URL: `https://your-project.railway.app`
   - Update `VITE_API_BASE_URL` in Vercel with this URL

---

### Option 2: Render 🎨

**Why Render?**
- ✅ Supports WebSockets
- ✅ Free tier available
- ✅ Easy setup

#### Steps:

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

3. **Add Environment Variables** (same as Railway)

4. **Enable WebSocket Support**
   - In service settings, ensure WebSockets are enabled (usually enabled by default)

5. **Deploy**
   - Click "Create Web Service"
   - Get your backend URL: `https://your-service.onrender.com`

---

### Option 3: Fly.io 🚀

**Why Fly.io?**
- ✅ Excellent WebSocket support
- ✅ Global edge network
- ✅ Free tier available

#### Steps:

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login to Fly.io**
   ```bash
   fly auth login
   ```

3. **Create Fly App**
   ```bash
   cd backend
   fly launch
   ```
   - Follow prompts to create app
   - Don't deploy yet (we need to configure first)

4. **Create `fly.toml`** in `backend/`:
   ```toml
   app = "your-app-name"
   primary_region = "iad"
   
   [build]
     builder = "paketobuildpacks/builder:base"
   
   [http_service]
     internal_port = 8080
     force_https = true
     auto_stop_machines = false
     auto_start_machines = true
     min_machines_running = 1
     processes = ["app"]
   
   [[services]]
     protocol = "tcp"
     internal_port = 8080
     processes = ["app"]
   
     [[services.ports]]
       port = 80
       handlers = ["http"]
       force_https = true
   
     [[services.ports]]
       port = 443
       handlers = ["tls", "http"]
   
     [[services.tcp_checks]]
       interval = "15s"
       timeout = "2s"
       grace_period = "1s"
   ```

5. **Set Environment Variables**
   ```bash
   fly secrets set DATABASE_URL=mysql://...
   fly secrets set FIREBASE_PROJECT_ID=...
   # ... (set all other env vars)
   ```

6. **Deploy**
   ```bash
   fly deploy
   ```

---

## 🔧 Post-Deployment Configuration

### 1. Update CORS Settings
After deploying backend, update `CORS_ORIGIN` to include your Vercel frontend URL:
```
CORS_ORIGIN=https://your-frontend.vercel.app,https://your-frontend.vercel.app
```

### 2. Update Frontend API URL
In Vercel, update `VITE_API_BASE_URL` to point to your deployed backend.

### 3. Database Setup
- If using PlanetScale: Use your existing connection string
- If using Railway MySQL: Railway provides connection string automatically
- Run migrations/seeds if needed:
  ```bash
  # On your local machine or via Railway CLI
  npm run seed
  ```

### 4. Test Real-time Features
- Open frontend in two browser windows
- Test attendance updates to verify Socket.io is working
- Check browser console for WebSocket connection status

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: Socket.io not connecting
- **Solution**: Ensure your backend platform supports WebSockets (Railway/Render/Fly.io do)
- Check `CORS_ORIGIN` includes your frontend URL
- Verify backend URL is accessible (not blocked by firewall)

**Problem**: Database connection errors
- **Solution**: Check `DATABASE_URL` is correct
- Ensure database allows connections from your backend IP
- For PlanetScale: Check branch is set to production

**Problem**: Port already in use
- **Solution**: Backend should use `PORT` environment variable (Railway/Render set this automatically)

### Frontend Issues

**Problem**: API calls failing
- **Solution**: Check `VITE_API_BASE_URL` is set correctly
- Verify CORS is configured on backend
- Check browser console for CORS errors

**Problem**: Socket.io client not connecting
- **Solution**: Ensure backend URL is correct
- Check WebSocket support in browser
- Verify backend is running and accessible

---

## 📊 Recommended Architecture

```
┌─────────────────┐
│   Vercel        │
│   (Frontend)    │
│   React + Vite  │
└────────┬────────┘
         │ HTTPS
         │ API Calls + WebSocket
         ▼
┌─────────────────┐
│   Railway/      │
│   Render/Fly.io │
│   (Backend)     │
│   Express +     │
│   Socket.io     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PlanetScale/  │
│   MySQL         │
│   (Database)    │
└─────────────────┘
```

---

## 💰 Cost Estimation

### Free Tier (Suitable for Development/Small Projects)
- **Vercel**: Free (unlimited for personal projects)
- **Railway**: $5/month free credit (usually enough for small apps)
- **Render**: Free tier (with limitations)
- **Fly.io**: Free tier (3 shared VMs)

### Production (Recommended)
- **Vercel**: Free or Pro ($20/month for teams)
- **Railway**: ~$5-20/month depending on usage
- **Database**: PlanetScale free tier or Railway MySQL (~$5/month)

**Total**: ~$10-25/month for a small production app

---

## ✅ Deployment Checklist

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Railway/Render/Fly.io
- [ ] Environment variables configured in both platforms
- [ ] Database connection working
- [ ] CORS configured correctly
- [ ] Socket.io WebSocket connection working
- [ ] Test all features (login, attendance, assignments, etc.)
- [ ] Update frontend API URL in production
- [ ] Run database seeds if needed
- [ ] Monitor logs for errors

---

## 🚀 Quick Start Commands

### Local Testing Before Deployment
```bash
# Backend
cd backend
npm install
npm run build
npm start

# Frontend (in another terminal)
cd frontend
npm install
npm run build
npm run preview
```

### After Deployment
1. Test frontend: Visit your Vercel URL
2. Test backend: `curl https://your-backend.railway.app/health`
3. Test Socket.io: Open browser console, check for WebSocket connection

---

## 📝 Notes

- **Never commit `.env` files** - Use platform environment variables
- **Use production database** - Don't use local database in production
- **Enable HTTPS** - Both platforms provide SSL certificates automatically
- **Monitor logs** - Check Railway/Render/Fly.io logs for errors
- **Set up alerts** - Configure uptime monitoring (UptimeRobot, etc.)

---

## 🆘 Need Help?

If you encounter issues:
1. Check platform logs (Railway/Render/Fly.io dashboard)
2. Verify environment variables are set correctly
3. Test backend health endpoint: `/health`
4. Check browser console for frontend errors
5. Verify database connection string format

