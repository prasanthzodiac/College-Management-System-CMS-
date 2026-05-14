# 🚀 Deployment Guide - Complete Reference

## 📚 Quick Links

- **Quick Start**: [DEPLOY_NOW.md](./DEPLOY_NOW.md) - Fast deployment guide
- **Step-by-Step**: [DEPLOYMENT_STEPS.md](./DEPLOYMENT_STEPS.md) - Detailed instructions
- **Railway Setup**: [FIREBASE_RAILWAY_QUICK.md](./FIREBASE_RAILWAY_QUICK.md) - Firebase credentials
- **Vercel Setup**: [VERCEL_ENV_VARS.md](./VERCEL_ENV_VARS.md) - Frontend environment variables
- **Troubleshooting**: [RAILWAY_MANUAL_FIX.md](./RAILWAY_MANUAL_FIX.md) - Railway issues

## 🎯 Deployment Architecture

```
Frontend (Vercel) → Backend (Railway) → Database (MySQL/PlanetScale)
```

- **Frontend**: React + Vite → Deploy to Vercel
- **Backend**: Node.js + Express + Socket.io → Deploy to Railway/Render/Fly.io
- **Database**: MySQL (PlanetScale, Railway MySQL, or your own)

## ✅ Pre-Deployment Checklist

- [x] Code pushed to GitHub
- [x] Backend builds successfully
- [x] Frontend builds successfully
- [x] Railway configuration ready
- [x] Vercel configuration ready
- [x] Dockerfile configured
- [x] Environment variables documented

## 🔐 Environment Variables

### Backend (Railway)
See [FIREBASE_RAILWAY_QUICK.md](./FIREBASE_RAILWAY_QUICK.md) for Firebase setup.

Required:
- `PORT=8080`
- `NODE_ENV=production`
- `DATABASE_URL` (MySQL connection string)
- `FIREBASE_SERVICE_ACCOUNT` (JSON) or individual Firebase vars
- `CORS_ORIGIN` (your Vercel frontend URL)

### Frontend (Vercel)
See [VERCEL_ENV_VARS.md](./VERCEL_ENV_VARS.md) for details.

Required:
- `VITE_API_BASE_URL` (your Railway backend URL)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## 🚀 Deployment Steps

1. **Deploy Backend to Railway**
   - Set Root Directory: `backend`
   - Set Builder: `Dockerfile` (if auto-detection fails)
   - Add environment variables
   - Deploy

2. **Deploy Frontend to Vercel**
   - Set Root Directory: `frontend`
   - Framework: Vite (auto-detected)
   - Add environment variables
   - Deploy

3. **Update CORS**
   - Update `CORS_ORIGIN` in Railway with Vercel URL
   - Redeploy backend

## 📖 Detailed Documentation

- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Complete deployment guide
- [docs/DEPLOYMENT_QUICK_START.md](./docs/DEPLOYMENT_QUICK_START.md) - 5-minute guide
- [DEPLOYMENT_ANALYSIS.md](./DEPLOYMENT_ANALYSIS.md) - Technical analysis

## 🐛 Common Issues

### Railway: "start.sh not found"
- Solution: Set Builder to `Dockerfile` in Railway Settings
- See: [RAILWAY_MANUAL_FIX.md](./RAILWAY_MANUAL_FIX.md)

### Railway: "Railpack could not determine"
- Solution: Use Dockerfile builder instead of Nixpacks
- See: [RAILWAY_DOCKER_FIX.md](./RAILWAY_DOCKER_FIX.md)

### CORS Errors
- Solution: Update `CORS_ORIGIN` in Railway with your Vercel URL
- Ensure frontend URL is correct

## 📝 Notes

- Backend **CANNOT** be deployed to Vercel (Socket.io requirement)
- Always set Root Directory correctly (`backend` for Railway, `frontend` for Vercel)
- Environment variables must be set in platform dashboards, not in code
- Never commit `.env` files to Git

## ✅ Status

**Ready for Deployment!** 🎉

All configurations are complete. Follow the guides above to deploy.

