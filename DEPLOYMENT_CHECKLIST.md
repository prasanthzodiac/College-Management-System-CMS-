# ✅ Deployment Checklist

## Pre-Deployment Verification

- [x] **Backend builds successfully** (`npm run build` in `backend/`)
- [x] **Frontend builds successfully** (`npm run build` in `frontend/`)
- [x] **TypeScript errors fixed**
- [x] **All configuration files created**
- [x] **Documentation complete**

## Configuration Files Created

- [x] `backend/.env.example` - Environment variable template
- [x] `frontend/.env.example` - Environment variable template
- [x] `backend/railway.json` - Railway deployment config
- [x] `backend/render.yaml` - Render deployment config
- [x] `backend/nixpacks.toml` - Nixpacks build config
- [x] `backend/Procfile` - Process file for Render/Heroku
- [x] `frontend/vercel.json` - Vercel deployment config
- [x] `.gitignore` - Git ignore rules
- [x] `deploy.sh` - Deployment preparation script (Linux/Mac)
- [x] `deploy.ps1` - Deployment preparation script (Windows)

## Documentation Created

- [x] `README.md` - Main project documentation
- [x] `docs/DEPLOYMENT.md` - Complete deployment guide
- [x] `docs/DEPLOYMENT_QUICK_START.md` - Quick 5-minute guide
- [x] `docs/DEPLOYMENT_VERCEL_BACKEND.md` - Why backend can't use Vercel

## Deployment Steps

### Step 1: Backend Deployment (Railway/Render/Fly.io)

#### Option A: Railway (Recommended)
1. [ ] Go to [railway.app](https://railway.app) and sign up
2. [ ] Create new project → Deploy from GitHub
3. [ ] Select repository and set root directory to `backend`
4. [ ] Add environment variables:
   - [ ] `PORT=8080`
   - [ ] `NODE_ENV=production`
   - [ ] `DATABASE_URL=your-database-url`
   - [ ] `FIREBASE_PROJECT_ID=your-project-id`
   - [ ] `FIREBASE_PRIVATE_KEY=your-private-key`
   - [ ] `FIREBASE_CLIENT_EMAIL=your-client-email`
   - [ ] `CORS_ORIGIN=https://your-frontend.vercel.app`
   - [ ] (Optional) `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - [ ] (Optional) `SENDGRID_API_KEY`
5. [ ] Deploy and get backend URL: `https://your-project.railway.app`
6. [ ] Test health endpoint: `curl https://your-project.railway.app/health`

#### Option B: Render
1. [ ] Go to [render.com](https://render.com) and sign up
2. [ ] Create new Web Service → Connect GitHub
3. [ ] Set root directory to `backend`
4. [ ] Build command: `npm install && npm run build`
5. [ ] Start command: `npm start`
6. [ ] Add environment variables (same as Railway)
7. [ ] Deploy and get backend URL

#### Option C: Fly.io
1. [ ] Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. [ ] Login: `fly auth login`
3. [ ] Create app: `cd backend && fly launch`
4. [ ] Set secrets: `fly secrets set KEY=value`
5. [ ] Deploy: `fly deploy`

### Step 2: Frontend Deployment (Vercel)

1. [ ] Go to [vercel.com](https://vercel.com) and sign up
2. [ ] Create new project → Import GitHub repository
3. [ ] Set root directory to `frontend`
4. [ ] Framework: Vite (auto-detected)
5. [ ] Add environment variables:
   - [ ] `VITE_API_BASE_URL=https://your-backend.railway.app`
   - [ ] `VITE_FIREBASE_API_KEY=your-firebase-key`
   - [ ] `VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com`
   - [ ] `VITE_FIREBASE_PROJECT_ID=your-project-id`
   - [ ] `VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com`
   - [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id`
   - [ ] `VITE_FIREBASE_APP_ID=your-app-id`
6. [ ] Deploy and get frontend URL: `https://your-project.vercel.app`

### Step 3: Update CORS

1. [ ] Go back to backend platform (Railway/Render/Fly.io)
2. [ ] Update `CORS_ORIGIN` environment variable:
   ```
   CORS_ORIGIN=https://your-frontend.vercel.app
   ```
3. [ ] Redeploy backend (auto-redeploys on env var change)

### Step 4: Database Setup

1. [ ] Ensure database is accessible from backend platform
2. [ ] Run migrations if needed (Sequelize auto-syncs on startup)
3. [ ] Seed initial data if needed:
   ```bash
   # On local machine or via Railway CLI
   npm run seed
   ```

### Step 5: Testing

1. [ ] Visit frontend URL
2. [ ] Test login with demo accounts:
   - Admin: `admin@college.edu` / `password`
   - Staff: `staff@college.edu` / `password`
   - Student: `student1@college.edu` / `password`
3. [ ] Test real-time features (attendance updates)
4. [ ] Check browser console for errors
5. [ ] Test all major features:
   - [ ] Attendance recording
   - [ ] Assignment submission
   - [ ] Internal marks
   - [ ] Events and circulars
   - [ ] User management (admin)

## Post-Deployment

- [ ] Monitor backend logs for errors
- [ ] Set up uptime monitoring (UptimeRobot, etc.)
- [ ] Configure custom domain (optional)
- [ ] Set up SSL certificates (automatic on Vercel/Railway)
- [ ] Test WebSocket connections
- [ ] Verify database connections
- [ ] Check error tracking (optional: Sentry, etc.)

## Troubleshooting

### Backend Issues
- [ ] Check backend logs in Railway/Render/Fly.io dashboard
- [ ] Verify environment variables are set correctly
- [ ] Test health endpoint: `/health`
- [ ] Check database connection string format
- [ ] Verify CORS settings include frontend URL

### Frontend Issues
- [ ] Check browser console for errors
- [ ] Verify `VITE_API_BASE_URL` points to backend
- [ ] Check Firebase configuration
- [ ] Verify CORS is configured on backend

### Socket.io Issues
- [ ] Ensure backend is on Railway/Render/Fly.io (NOT Vercel)
- [ ] Check WebSocket support in browser
- [ ] Verify backend URL is correct
- [ ] Check CORS includes frontend URL

## Important Notes

⚠️ **Backend CANNOT be deployed to Vercel** - Socket.io requires persistent WebSocket connections which Vercel's serverless functions don't support.

✅ **Recommended Architecture:**
- Frontend: Vercel
- Backend: Railway (or Render/Fly.io)
- Database: PlanetScale or Railway MySQL

## Cost Estimation

### Free Tier (Development/Small Projects)
- Vercel: Free
- Railway: $5/month free credit
- Render: Free tier (with limitations)
- Fly.io: Free tier (3 shared VMs)

### Production (Recommended)
- Vercel: Free or Pro ($20/month)
- Railway: ~$5-20/month
- Database: PlanetScale free tier or Railway MySQL (~$5/month)

**Total**: ~$10-25/month for small production app

---

## Quick Commands

### Local Testing
```bash
# Backend
cd backend
npm install
npm run build
npm start

# Frontend
cd frontend
npm install
npm run build
npm run preview
```

### Deployment Preparation
```bash
# Windows PowerShell
.\deploy.ps1

# Linux/Mac
chmod +x deploy.sh
./deploy.sh
```

---

**Status**: ✅ Ready for deployment
**Last Updated**: $(date)

