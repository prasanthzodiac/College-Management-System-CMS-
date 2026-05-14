## Setup

### Prerequisites
- Node.js 18+
- PlanetScale database
- Firebase project (Web app + Service Account)
- Cloudinary account
- SendGrid API key

### Frontend
1. Create `frontend/.env` with:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
VITE_API_BASE_URL=http://localhost:8080
```
2. Install deps and run:
```
cd frontend
npm i
npm run dev
```

### Backend
1. Create `backend/.env` with:
```
PORT=8080
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=mysql://<username>:<password>@<host>/<db>?sslaccept=strict
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
CLOUDINARY_CLOUD_NAME=ddlexqc0g
CLOUDINARY_API_KEY=113492389368635
CLOUDINARY_API_SECRET=hOPUq5KkOFxj9c4YxnCSQz0exHo
SENDGRID_API_KEY=...
EMAIL_FROM=no-reply@example.com
```
2. Install deps and run:
```
cd backend
npm i
npm run dev
```

### Notes
- PlanetScale: create a password and use the `mysql://` URL with `sslaccept=strict`.
- Firebase: enable Email/Password and Google sign-in.
- Cloudinary: set unsigned transformations via URL parameters as needed.
- SendGrid: verify sender identity.

