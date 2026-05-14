# College Management System (CMS)

A comprehensive full-stack College Management System built with React, Node.js, Express, and MySQL. Features real-time attendance tracking, assignment management, internal marks, events, circulars, and more.

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router DOM** for routing
- **Firebase** for authentication
- **Socket.io Client** for real-time updates
- **Axios** for API calls

### Backend
- **Node.js** with TypeScript
- **Express.js** for REST API
- **Socket.io** for real-time WebSocket communication
- **Sequelize ORM** for database operations
- **MySQL/PlanetScale** for database
- **Firebase Admin SDK** for authentication
- **Cloudinary** for media uploads
- **SendGrid** for email notifications

## 📋 Features

### Student Features
- ✅ Real-time attendance tracking
- ✅ View attendance summary and reports
- ✅ Submit assignments
- ✅ View internal marks
- ✅ Request certificates
- ✅ Apply for leaves
- ✅ Submit grievances and feedback
- ✅ View events and circulars

### Staff Features
- ✅ Class timetable management
- ✅ Record and manage attendance
- ✅ Create and grade assignments
- ✅ Record internal marks
- ✅ Approve/reject leave requests
- ✅ View and respond to grievances
- ✅ View events and circulars

### Admin Features
- ✅ User management (students, staff, admins)
- ✅ Subject management
- ✅ Attendance overview
- ✅ Assignment overview
- ✅ Internal marks management
- ✅ Create and manage events
- ✅ Create and manage circulars
- ✅ Certificate request management
- ✅ Leave request management
- ✅ Grievance and feedback management

## 🏗️ Project Structure

```
CMS/
├── backend/          # Node.js/Express backend
│   ├── src/
│   │   ├── models/   # Sequelize models
│   │   ├── routes/   # API routes
│   │   ├── services/ # Business logic
│   │   └── server.ts # Entry point
│   └── package.json
│
├── frontend/         # React frontend
│   ├── src/
│   │   ├── features/ # Feature-based components
│   │   ├── components/ # Reusable components
│   │   ├── services/ # API and Firebase services
│   │   └── main.tsx  # Entry point
│   └── package.json
│
└── docs/            # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MySQL database (or PlanetScale)
- Firebase project
- (Optional) Cloudinary account for file uploads
- (Optional) SendGrid account for emails

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd CMS
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Create .env file
   # Edit .env with your configuration
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env  # Create .env file
   # Edit .env with your configuration
   npm run dev
   ```

4. **Database Setup**
   ```bash
   cd backend
   npm run create-db    # Create database
   npm run seed         # Seed initial data
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080

See [SETUP.md](docs/SETUP.md) for detailed setup instructions.

## 📦 Deployment

### ⚠️ Important: Deployment Architecture

**This project requires TWO separate deployments:**

1. **Frontend** → Deploy to **Vercel** ✅
2. **Backend** → Deploy to **Railway/Render/Fly.io** (NOT Vercel) ⚠️

**Why?** The backend uses Socket.io for real-time WebSocket connections, which requires persistent server connections. Vercel's serverless functions don't support WebSockets.

### Quick Deployment Guide

See [DEPLOYMENT_QUICK_START.md](docs/DEPLOYMENT_QUICK_START.md) for a 5-minute deployment guide.

### Detailed Deployment Instructions

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for comprehensive deployment instructions including:
- Railway deployment (recommended)
- Render deployment
- Fly.io deployment
- Environment variables setup
- Post-deployment configuration
- Troubleshooting

## 🔐 Environment Variables

### Backend (.env)
```env
PORT=8080
NODE_ENV=development

# Database
DATABASE_URL=mysql://user:password@host:port/database

# Firebase Admin
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# CORS
CORS_ORIGIN=http://localhost:5173

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# SendGrid (optional)
SENDGRID_API_KEY=your-sendgrid-key
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## 📚 Documentation

- [Setup Guide](docs/SETUP.md) - Detailed local development setup
- [Deployment Guide](docs/DEPLOYMENT.md) - Complete deployment instructions
- [Quick Deployment](docs/DEPLOYMENT_QUICK_START.md) - Fast deployment guide
- [Database Seeding](docs/SEEDING.md) - Database seeding instructions

## 🧪 Testing

### Demo Accounts

After running `npm run seed`, you can use these demo accounts:

- **Admin**: `admin@college.edu` / `password`
- **Staff**: `staff@college.edu` / `password`
- **Student**: `student1@college.edu` / `password` (and student2, student3, etc.)

## 🛠️ Available Scripts

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run seed         # Seed database
npm run create-db    # Create database
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**
- Check database connection string
- Verify environment variables are set
- Check if port is already in use

**Socket.io not connecting:**
- Ensure backend is deployed to Railway/Render/Fly.io (NOT Vercel)
- Check CORS settings
- Verify WebSocket support in browser

**Database errors:**
- Verify DATABASE_URL is correct
- Check database permissions
- Ensure tables are created (run migrations/seeds)

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for more troubleshooting tips.

## 📝 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. For issues or questions, contact the development team.

## 📞 Support

For deployment help, see:
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Full deployment guide
- [DEPLOYMENT_QUICK_START.md](docs/DEPLOYMENT_QUICK_START.md) - Quick start guide
- [DEPLOYMENT_VERCEL_BACKEND.md](docs/DEPLOYMENT_VERCEL_BACKEND.md) - Why backend can't use Vercel

---

**Built with ❤️ for efficient college management**

