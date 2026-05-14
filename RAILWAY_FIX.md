# 🔧 Railway Deployment Fix

## Issue: "Railpack could not determine how to build the app"

This error occurs when Railway can't detect your project type. Here's how to fix it:

---

## ✅ Solution 1: Manual Configuration in Railway Dashboard

### Step 1: Set Root Directory
1. Go to your Railway project
2. Click on your service
3. Go to **Settings** tab
4. Scroll to **Root Directory**
5. Set it to: `backend`
6. Click **Save**

### Step 2: Set Build Command
1. Still in **Settings** tab
2. Scroll to **Build Command**
3. Set it to: `npm install && npm run build`
4. Click **Save**

### Step 3: Set Start Command
1. Still in **Settings** tab
2. Scroll to **Start Command**
3. Set it to: `npm start`
4. Click **Save**

### Step 4: Redeploy
1. Go to **Deployments** tab
2. Click **Redeploy** or trigger a new deployment

---

## ✅ Solution 2: Use Dockerfile (Alternative)

If Nixpacks still doesn't work, Railway will automatically use the Dockerfile:

1. Railway should auto-detect `backend/Dockerfile`
2. Make sure **Root Directory** is set to `backend`
3. Deploy

---

## ✅ Solution 3: Verify Configuration Files

Make sure these files exist in the `backend` directory:

- ✅ `package.json` (exists)
- ✅ `nixpacks.toml` (exists - updated with providers)
- ✅ `railway.json` (exists)
- ✅ `Dockerfile` (exists - backup option)

---

## 🔍 Check These in Railway Dashboard

1. **Root Directory**: Must be `backend` (not root)
2. **Build Command**: `npm install && npm run build`
3. **Start Command**: `npm start`
4. **Node Version**: Should detect Node.js 18+ automatically

---

## 📝 Updated Files

I've updated `backend/nixpacks.toml` to include:
```toml
[providers]
node = "18"
```

This explicitly tells Railway this is a Node.js 18 project.

---

## 🚀 Next Steps

1. **Commit and push the updated nixpacks.toml**:
   ```bash
   git add backend/nixpacks.toml
   git commit -m "Fix Railway nixpacks configuration"
   git push
   ```

2. **In Railway Dashboard**:
   - Verify Root Directory is `backend`
   - Set Build Command: `npm install && npm run build`
   - Set Start Command: `npm start`
   - Redeploy

3. **If still not working**:
   - Railway will fall back to Dockerfile automatically
   - Or manually select Dockerfile in Settings → Build → Builder

---

## 💡 Why This Happens

Railway's Nixpacks tries to auto-detect the project type. Sometimes it needs:
- Explicit provider declaration (Node.js)
- Root directory correctly set
- Build/start commands explicitly set

The updated `nixpacks.toml` now explicitly declares it's a Node.js project, which should fix the detection issue.

