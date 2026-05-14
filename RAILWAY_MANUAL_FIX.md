# 🔧 Railway Manual Fix - Step by Step

## ⚠️ Still Getting "start.sh not found" Error?

Railway might not be reading the `railway.json` file yet. Here's how to manually fix it in the Railway dashboard:

---

## 🎯 Step-by-Step Manual Fix

### Step 1: Open Railway Dashboard
1. Go to https://railway.app
2. Login to your account
3. Open your project
4. Click on your **service** (the backend service)

### Step 2: Go to Settings
1. Click on the **Settings** tab (top menu)
2. Scroll down to find the **Build** section

### Step 3: Change Builder to Dockerfile
1. In the **Build** section, find **Builder**
2. You'll see a dropdown or option that says "Nixpacks" or "Auto-detect"
3. **Change it to "Dockerfile"**
4. If there's a **Dockerfile Path** field, set it to: `Dockerfile`
   - (Since Root Directory is `backend`, Railway will look for `backend/Dockerfile`)

### Step 4: Verify Root Directory
1. Still in **Settings** tab
2. Find **Root Directory** section
3. Make sure it says: `backend`
4. If not, change it to `backend` and click **Save**

### Step 5: Clear Build Cache (Optional but Recommended)
1. Still in **Settings** tab
2. Look for **Clear Build Cache** or **Reset** option
3. Click it to clear any cached build configuration

### Step 6: Redeploy
1. Go to **Deployments** tab
2. Click **Redeploy** button (or the three dots menu → Redeploy)
3. Or trigger a new deployment by making a small commit and pushing

---

## 🔍 What to Look For in Build Logs

After redeploying, check the **Deployments** tab → Click on the latest deployment → View logs.

You should see:
```
✅ Docker build starting
✅ Building with Dockerfile
✅ Step 1/7 : FROM node:20-alpine AS deps
✅ Step 2/7 : WORKDIR /app
...
✅ Successfully built
✅ Starting server with: node dist/server.js
```

If you still see "Nixpacks" or "start.sh" errors, the builder wasn't changed correctly.

---

## 🚨 Alternative: Delete and Recreate Service

If the above doesn't work:

1. **Delete the current service** (Settings → Danger Zone → Delete Service)
2. **Create a new service**:
   - Click "New" → "GitHub Repo"
   - Select your repository
   - **IMPORTANT**: Set Root Directory to `backend` immediately
   - Railway should detect Dockerfile automatically
   - If not, manually set Builder to Dockerfile in Settings

---

## ✅ Quick Checklist

Before redeploying, verify:
- [ ] Root Directory = `backend`
- [ ] Builder = `Dockerfile` (NOT Nixpacks)
- [ ] Dockerfile Path = `Dockerfile` (or leave empty if auto-detected)
- [ ] All environment variables are set
- [ ] Clicked Save after making changes

---

## 💡 Why This Happens

Railway sometimes caches the builder type. Even after updating `railway.json`, you might need to:
1. Manually change it in the dashboard
2. Clear build cache
3. Or recreate the service

The Dockerfile approach is more reliable than Nixpacks for this project.

---

**After making these changes, Railway should build successfully using Dockerfile! 🐳**

