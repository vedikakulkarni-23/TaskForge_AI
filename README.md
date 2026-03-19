<!-- IMPORTANT: FOR MEETING WE HAVE USED OUR OWN WEBRTC SO IGNORE JITSI INFORMATION IN THIS FILE -->

# 🚀 TASKFORGE - Team Collaboration Platform

**AI-Powered Task Management with Video Meetings & Gamification**

A modern, full-stack web application for teams to collaborate, manage tasks, and stay productive.

![Node.js](https://img.shields.io/badge/Node.js-16+-green)
![React](https://img.shields.io/badge/React-18.2-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## ✨ Features

- ✅ **Task Management** - Kanban board with drag & drop
- 🤖 **AI-Powered** - Auto-generate task descriptions (Groq AI)
- 🎥 **Video Meetings** - Built-in team video calls (Jitsi)
- 🎮 **Gamification** - Points, badges, and leaderboards
- 🔐 **Secure** - Email verification + 2FA authentication
- 👥 **Team Collaboration** - Assign tasks, track progress
- 📊 **Analytics** - Team performance insights

---

## 📸 Screenshots

*(Add your screenshots here after uploading to GitHub)*

---

## 🛠️ Tech Stack

**Frontend:** React, Tailwind CSS, Axios  
**Backend:** Node.js, Express, MongoDB  
**AI:** Groq SDK  
**Video:** Jitsi Meet  

---

## 📋 Prerequisites

Before you start, make sure you have:

1. **Node.js** (version 16 or higher)
   - Download: https://nodejs.org
   - To check: Open terminal and type `node --version`

2. **A code editor** (recommended)
   - VS Code: https://code.visualstudio.com

3. **A web browser** (Chrome, Firefox, etc.)

---

## 🚀 Installation Guide (Step-by-Step)

### **Step 1: Download the Code**

#### Option A: Using Git (if you have it)
```bash
git clone https://github.com/YOUR_USERNAME/taskforge.git
cd taskforge
```

#### Option B: Download ZIP (easier for beginners)
1. Click the green **"Code"** button at the top of this page
2. Click **"Download ZIP"**
3. Extract the ZIP file to your Desktop
4. Open terminal/command prompt and navigate to the folder:
   ```bash
   # Windows:
   cd C:\Users\YourName\Desktop\taskforge-main

   # Mac/Linux:
   cd ~/Desktop/taskforge-main
   ```

---

### **Step 2: Get FREE API Keys**

You need 3 free accounts (takes ~10 minutes total):

#### 🗄️ **MongoDB (Database)** - FREE
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up (use Google for quick signup)
3. Create a **FREE cluster** (M0 - it's forever free!)
4. Click **"Database Access"** → **"Add New User"**
   - Username: `taskforge`
   - Password: Click "Autogenerate" and **COPY IT**
   - Role: Atlas Admin
5. Click **"Network Access"** → **"Add IP Address"** → **"Allow Access from Anywhere"**
6. Go back to **"Database"** → Click **"Connect"** → **"Connect your application"**
7. Copy the connection string (looks like this):
   ```
   mongodb+srv://taskforge:<password>@cluster0.xxxxx.mongodb.net/
   ```
8. **IMPORTANT:** Replace `<password>` with your actual password from step 4!

#### 🤖 **Groq (AI Features)** - FREE
1. Go to: https://console.groq.com
2. Sign up with Google
3. Click **"API Keys"** → **"Create API Key"**
4. Name it "TASKFORGE" and click Create
5. **COPY THE KEY** (starts with `gsk_`)

#### 📧 **Gmail (Email Notifications)** - FREE
1. Go to: https://myaccount.google.com/apppasswords
2. Sign in with your Gmail
3. If asked, enable **2-Step Verification** first
4. Select **"Mail"** and **"Other"** → Type "TASKFORGE"
5. Click **"Generate"**
6. **COPY THE 16-DIGIT CODE** (like: `abcd efgh ijkl mnop`)

**Save all 3 keys somewhere safe!** You'll need them in Step 4.

---

### **Step 3: Install Backend**

```bash
# Go to backend folder
cd backend

# Install all packages (this will take 1-2 minutes)
npm install
```

You should see packages installing. Wait until it says "added XXX packages".

---

### **Step 4: Configure Backend**

1. In the `backend` folder, find the file called **`.env.example`**
2. **Copy it** and rename the copy to **`.env`**
3. Open **`.env`** in your code editor (or Notepad)
4. Replace the values with your actual keys:

```env
# Server
PORT=5000
NODE_ENV=development

# Database - PASTE YOUR MONGODB CONNECTION STRING HERE!
MONGODB_URI=mongodb+srv://taskforge:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/taskforge

# JWT Secret (you can leave this as is)
JWT_SECRET=taskforge_secret_key_2024_super_secure_random_string

# Email - PUT YOUR GMAIL HERE!
EMAIL_USER=your.email@gmail.com
EMAIL_APP_PASSWORD=abcdefghijklmnop

# Frontend URL (leave as is)
FRONTEND_URL=http://localhost:3000

# Admin Account (you can change these later)
ADMIN_EMAIL=admin@taskforge.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Admin User

# AI - PASTE YOUR GROQ KEY HERE!
GROQ_API_KEY=gsk_your_groq_key_here
```

**Make sure to replace:**
- `MONGODB_URI` → Your MongoDB connection string
- `EMAIL_USER` → Your Gmail address
- `EMAIL_APP_PASSWORD` → Your 16-digit Gmail code (remove spaces!)
- `GROQ_API_KEY` → Your Groq API key

**Save the file!**

---

### **Step 5: Create Admin Account**

Still in the `backend` folder, run:

```bash
node quickAdminSetup.js
```

You should see:
```
✅ Connected to MongoDB
🎉 Admin Created Successfully!

Email: admin@taskforge.com
Password: admin123
```

---

### **Step 6: Install Frontend**

```bash
# Go back to main folder, then to frontend
cd ../frontend

# Install all packages (this will take 2-3 minutes)
npm install
```

Wait until it says "added XXX packages".

---

### **Step 7: Start the Application!**

You need **TWO terminal windows** open:

#### Terminal 1 - Start Backend:
```bash
cd backend
npm run dev
```

You should see:
```
✅ Server running on port 5000
✅ Connected to MongoDB
🤖 Groq AI: Enabled
```

**Keep this window open!**

#### Terminal 2 - Start Frontend:
Open a **NEW terminal window** and run:
```bash
cd frontend
npm start
```

Your browser will automatically open to `http://localhost:3000`

If it doesn't, manually go to: **http://localhost:3000**

---

### **Step 8: Login!**

On the login page, enter:
- **Email:** `admin@taskforge.com`
- **Password:** `admin123`

You'll receive a **2FA code via email** (check spam folder if not in inbox).

Enter the code and you're in! 🎉

---

## 🎯 Quick Start Video Guide

*(Coming soon - you can add a YouTube link here later)*

---

## 📖 What Each Folder Does

```
taskforge/
├── backend/           ← Server code (Node.js + Express)
│   ├── controllers/   ← Logic for handling requests
│   ├── routes/        ← API endpoints
│   ├── services/      ← AI, Email, Video features
│   ├── models/        ← Database structure
│   └── .env           ← YOUR SECRET KEYS (never share!)
│
├── frontend/          ← Website code (React)
│   ├── src/
│   │   ├── pages/     ← Different pages (Login, Dashboard, etc.)
│   │   └── components/← Reusable UI pieces
│   └── public/        ← Images, icons
│
└── README.md          ← This file!
```

---

## 🐛 Common Problems & Solutions

### ❌ "npm not found"
**Problem:** Node.js not installed  
**Solution:** Install Node.js from https://nodejs.org

### ❌ "Cannot connect to MongoDB"
**Problem:** Wrong connection string in `.env`  
**Solution:** 
1. Check your `.env` file
2. Make sure you replaced `<password>` with your actual password
3. Make sure there are no extra spaces

### ❌ "Port 3000 already in use"
**Problem:** Another app is using port 3000  
**Solution:** Close other apps or change the port

### ❌ "Email not sending"
**Problem:** Wrong Gmail password or 2-Step Verification not enabled  
**Solution:**
1. Make sure you used the **16-digit app password** (not your Gmail password!)
2. Remove any spaces from the password
3. Enable 2-Step Verification on your Gmail account

### ❌ "Groq AI not working"
**Problem:** Invalid API key  
**Solution:**
1. Check your Groq API key in `.env`
2. Make sure it starts with `gsk_`
3. Get a new key from https://console.groq.com

---

## 📱 Default Login Credentials

**Admin Account:**
- Email: `admin@taskforge.com`
- Password: `admin123`

**⚠️ IMPORTANT:** Change this password after first login!

---

## 🎮 How to Use

### **As Admin:**
1. Create teams
2. Create users (they get email to set password)
3. Assign members to teams
4. View all activities

### **As Team Leader:**
1. Create tasks
2. Assign tasks to team members (or yourself!)
3. Use AI to generate task descriptions
4. Start video meetings
5. Track team progress

### **As Member:**
1. View your assigned tasks
2. Update task status (To Do → In Progress → Done)
3. Earn points and badges
4. Join team meetings

---

## 🏆 Gamification System

- **Start a task:** +5 points
- **Complete a task:** +10 points
- **Total per task:** 15 points

**Badges:**
- 🌟 Rising Star - 5 tasks completed
- ⭐ Task Master - 10 tasks completed
- 🏅 Team Player - 20 tasks completed

---

## 🤖 AI Features (Powered by Groq)

1. **Auto-generate task descriptions** - Just enter a title, AI writes the details
2. **Team performance insights** - AI analyzes your team's productivity
3. **Smart task prioritization** - AI suggests which tasks to do first
4. **Meeting agenda generator** - AI creates meeting plans
5. **AI chat assistant** - Ask questions about your workspace

---

## 🎥 Video Meetings (Powered by Jitsi)

- Click "Start Meeting" to instantly create a video room
- HD video & audio
- Screen sharing
- Chat
- Recording
- **100% Free, unlimited time!**

---

## 📦 What Gets Installed?

When you run `npm install`, these packages are installed:

**Backend (~50 MB):**
- express - Web server
- mongoose - Database
- bcryptjs - Security
- jsonwebtoken - Login tokens
- groq-sdk - AI features
- nodemailer - Emails

**Frontend (~200 MB):**
- react - User interface
- axios - API calls
- tailwindcss - Styling

---

## 🌟 Free Services Used

All these services have **generous FREE tiers**:

- **MongoDB Atlas** - 512 MB free database
- **Groq AI** - 7,200 free requests/day
- **Gmail** - 500 free emails/day

**No credit card required for any of them!**

---

## 🔒 Security Features

- ✅ Password encryption
- ✅ JWT authentication
- ✅ Email verification
- ✅ Two-factor authentication (2FA)
- ✅ Role-based access control

---

## 🤝 Contributing

Found a bug? Want to add a feature?

1. Fork this repository
2. Create a new branch: `git checkout -b feature-name`
3. Make your changes
4. Commit: `git commit -m 'Add some feature'`
5. Push: `git push origin feature-name`
6. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - feel free to use it for learning or your own projects!

---

## 📞 Need Help?

If you're stuck:

1. Read the **Common Problems** section above
2. Check that all your `.env` values are correct
3. Make sure both backend and frontend are running
4. Open an **Issue** on GitHub

---

## 🙏 Acknowledgments

- **Groq** - Lightning-fast AI
- **MongoDB** - Flexible database
- **React** - Amazing UI framework

---

## ⭐ Star This Project

If you found this helpful, give it a star! ⭐

It helps others discover the project.

---

**Built with ❤️ for teams who want to collaborate smarter!**

---

## 📚 Additional Resources

- [Detailed Setup Guide](./SETUP_GUIDE_FOR_FRIENDS.md) - Step-by-step with screenshots
- [Quick Reference](./QUICK_CHECKLIST.md) - Fast installation checklist
- [API Documentation](./API_DOCS.md) - For developers

---

**Questions? Open an issue on GitHub!** 💬