# 🔧 Railway Deployment Fix - Using Dockerfile

## Issue: "Script start.sh not found" / "Railpack could not determine how to build"

## ✅ Solution: Use Dockerfile Instead of Nixpacks

Railway is having trouble with Nixpacks auto-detection. The easiest fix is to use the Dockerfile directly.

---

## 🚀 Quick Fix Steps

### Option 1: Manual Configuration in Railway Dashboard (Recommended)

1. **Go to Railway Dashboard**
   - Open your project
   - Click on your service

2. **Settings → Build**
   - Find **Builder** section
   - Change from **"Nixpacks"** to **"Dockerfile"**
   - Railway will auto-detect `backend/Dockerfile`
   - Click **Save**

3. **Settings → Root Directory**
   - Make sure it's set to: `backend`
   - Click **Save**

4. **Redeploy**
   - Go to **Deployments** tab
   - Click **Redeploy** or trigger a new deployment

---

### Option 2: Updated railway.json (Already Done)

I've updated `backend/railway.json` to explicitly use Dockerfile:

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  }
}
```

After pushing this change, Railway should automatically use Dockerfile.

---

## ✅ What Changed

1. **Updated `railway.json`**: Changed builder from NIXPACKS to DOCKERFILE
2. **Added `.nvmrc`**: Helps with Node.js version detection
3. **Updated `nixpacks.toml`**: Direct node command (backup option)

---

## 📝 Next Steps

1. **Commit and push the changes**:
   ```bash
   git add backend/railway.json backend/.nvmrc backend/nixpacks.toml
   git commit -m "Switch Railway to use Dockerfile builder"
   git push
   ```

2. **In Railway Dashboard**:
   - Go to Settings → Build
   - Select **Dockerfile** as builder
   - Ensure Root Directory is `backend`
   - Redeploy

3. **Verify Deployment**:
   - Check build logs
   - Should see Docker build steps
   - Should start with `node dist/server.js`

---

## 🐳 Why Dockerfile Works Better

- ✅ Explicit build steps
- ✅ No auto-detection issues
- ✅ More reliable
- ✅ Already configured correctly
- ✅ Multi-stage build for optimization

---

## 🔍 If Still Having Issues

1. **Check Root Directory**: Must be `backend`
2. **Check Dockerfile exists**: Should be at `backend/Dockerfile`
3. **Check build logs**: Look for Docker build output
4. **Manual override**: In Railway Settings, manually set:
   - Builder: Dockerfile
   - Dockerfile Path: `Dockerfile` (relative to root directory)

---

The Dockerfile is already properly configured and will work perfectly with Railway! 🚀

