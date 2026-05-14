# Complete Setup Guide

## Step 1: Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## Step 2: Configure Environment Variables

### Backend (.env)
Create `backend/.env` with:
```env
PORT=8080
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=mysql://username:password@localhost:3306/cms_db?sslaccept=strict
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"demo-project","private_key_id":"demo-key","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"demo@demo.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/demo%40demo.iam.gserviceaccount.com"}
CLOUDINARY_CLOUD_NAME=ddlexqc0g
CLOUDINARY_API_KEY=113492389368635
CLOUDINARY_API_SECRET=hOPUq5KkOFxj9c4YxnCSQz0exHo
SENDGRID_API_KEY=demo_sendgrid_key
EMAIL_FROM=no-reply@college.edu
```

### Frontend (.env)
Create `frontend/.env` with:
```env
VITE_FIREBASE_API_KEY=demo-api-key
VITE_FIREBASE_AUTH_DOMAIN=localhost
VITE_FIREBASE_PROJECT_ID=demo-project
VITE_FIREBASE_APP_ID=demo-app-id
VITE_API_BASE_URL=http://localhost:8080
```

## Step 3: Seed the Database

```bash
cd backend
npm run seed
```

This creates:
- 5 staff members
- 10 students (1st semester)
- 5 subjects
- 1 week of attendance data

## Step 4: Start the Servers

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

## Step 5: Login

### Staff Login
- Email: `staff1@college.edu` to `staff5@college.edu`
- Password: `password`

### Student Login
- Email: `student1@college.edu` to `student10@college.edu`
- Password: `password`

## Real-Time Features

When a staff member marks attendance:
1. The attendance is saved to the database
2. Real-time Socket.io updates are sent to connected students
3. Student attendance pages update automatically without refresh

## Testing Real-Time Updates

1. Open two browser windows
2. Login as staff in one window
3. Login as student in another window
4. Navigate to attendance pages in both
5. Mark attendance as staff - it should appear immediately on student side

