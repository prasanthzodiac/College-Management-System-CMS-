# 🔐 Firebase Setup for Railway

## How to Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** (gear icon)
4. Click **Service Accounts** tab
5. Click **Generate New Private Key**
6. Download the JSON file

## Add to Railway

### Method 1: Single JSON Variable (Recommended)

In Railway → Variables tab:

- **Key**: `FIREBASE_SERVICE_ACCOUNT`
- **Value**: Copy the entire contents of the downloaded JSON file as a single line

### Method 2: Individual Variables

If Method 1 doesn't work, add these three variables:

- **FIREBASE_PROJECT_ID** = (from the JSON file, field: `project_id`)
- **FIREBASE_CLIENT_EMAIL** = (from the JSON file, field: `client_email`)
- **FIREBASE_PRIVATE_KEY** = (from the JSON file, field: `private_key` - include BEGIN/END lines)

## ⚠️ Security

- **Never commit Firebase credentials to Git**
- **Only add them as environment variables in Railway**
- **Keep the downloaded JSON file secure and local**

## 📋 Complete Railway Variables

Required:
- `PORT=8080`
- `NODE_ENV=production`
- `DATABASE_URL` (your MySQL connection string)
- `FIREBASE_SERVICE_ACCOUNT` (or individual Firebase vars)
- `CORS_ORIGIN` (your Vercel frontend URL)

Optional:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `SENDGRID_API_KEY`

