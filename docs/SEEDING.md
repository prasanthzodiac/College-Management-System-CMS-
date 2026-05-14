# Database Seeding Guide

This guide will help you seed the database with initial data including 5 staff members, 10 students, and 1 week of attendance records.

## Prerequisites

1. Make sure your database is set up and accessible
2. Update `backend/.env` with your actual database credentials
3. Install dependencies: `cd backend && npm install`

## Running the Seed Script

### Step 1: Update Database URL

Edit `backend/.env` and set your `DATABASE_URL`:

```env
DATABASE_URL=mysql://username:password@localhost:3306/cms_db?sslaccept=strict
```

### Step 2: Run the Seed Script

```bash
cd backend
npm run seed
```

This will:
- Create 5 staff members
- Create 10 students (1st semester)
- Create 5 subjects for 1st semester
- Enroll all students in all subjects
- Create 1 week of attendance sessions (5 working days)
- Generate attendance entries for each session

## Login Credentials

After running the seed script, you'll see login credentials printed in the console.

### Staff Accounts (Password: `password`)
- staff1@college.edu - Dr. John Doe
- staff2@college.edu - Dr. Jane Smith
- staff3@college.edu - Prof. Robert Johnson
- staff4@college.edu - Dr. Sarah Williams
- staff5@college.edu - Prof. Michael Brown

### Student Accounts (Password: `password`)
- student1@college.edu - Alice Johnson (21BCS001)
- student2@college.edu - Bob Anderson (21BCS002)
- student3@college.edu - Charlie Brown (21BCS003)
- student4@college.edu - Diana Prince (21BCS004)
- student5@college.edu - Ethan Hunt (21BCS005)
- student6@college.edu - Fiona Apple (21BCS006)
- student7@college.edu - George Washington (21BCS007)
- student8@college.edu - Hannah Montana (21BCS008)
- student9@college.edu - Ian Fleming (21BCS009)
- student10@college.edu - Jessica Jones (21BCS010)

## Current Date Context

The seed script is configured for:
- **Current Date**: April 11, 2025 at 10:00 AM
- **Week of Classes**: April 4-8, 2025 (5 working days)
- **Semester**: 1st Semester

## Notes

- The script will clear all existing data before seeding
- All students are enrolled in all 1st semester subjects
- Attendance sessions are randomly distributed across 8 periods per day
- Students have an 85% present rate on average

## Troubleshooting

If you encounter errors:

1. **Database Connection Error**: Check your `DATABASE_URL` in `.env`
2. **Table Not Found**: Run `npm run dev` first to sync models, then run seed
3. **Permission Errors**: Ensure your database user has CREATE, INSERT, DELETE permissions

