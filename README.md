# 🎓 Attendify - Smart Attendance Verification System

Attendify is a modern, full-stack web application designed to automate and verify classroom attendance. It combines a dynamic React frontend with a native PHP API backend, backed by secure MySQL storage, Google OAuth authentication, and interactive geofencing.

---

## ✨ Key Features

### 1. 📍 Precision Geofencing Verification
- Allows teachers to configure session locations based on specific classroom polygon coordinates (e.g. Class 608, 609, 610, 611).
- Implements a custom **point-in-polygon (ray-casting) mathematical algorithm** on the client side to verify that students are physically inside the classroom boundary when checking in.
- Includes a teacher toggle to **enable/disable geolocation checks** during session creation.

### 2. 🔐 Secure Domain-Restricted Authentication
- Seamless Google Sign-In (GIS API) integration.
- Restricted to institutional emails (`@charusat.edu.in`) to prevent unauthorized sign-ins.
- Local email verification fallback support.

### 3. 📸 AI-Powered Liveness Check
- Uses browser MediaDevices & Canvas APIs to detect student presence.
- Implements local heuristics for **motion and blink detection**.
- Integrates optional **Gemini Vision API** checks on selfie submissions to verify image validity and prevent photo-spoofing.

### 4. 📊 Live Monitoring & Analytics Dashboard
- **Teacher Dashboard**: Monitor real-time student check-in counters, remaining attendance counts, recent checks with selfies, and session parameters.
- **Admin Dashboard**: Comprehensive management of students, faculty rosters, and class schedules.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React, Vite, TypeScript, TailwindCSS, Shadcn/ui, Lucide Icons |
| **Backend** | Native PHP 8.x, Composer, PDO |
| **Database** | MySQL 8.x |
| **Deployment** | AWS Amplify (Frontend), AWS Elastic Beanstalk (Backend), AWS RDS (MySQL) |

---

## 📂 Project Structure

```
Attendify/
├── frontend/             # React + Vite Client Application
│   ├── src/
│   │   ├── components/   # Reusable UI Components
│   │   ├── config/       # Classroom & Subjects mappings
│   │   ├── pages/        # Main route screens (Dashboards, Auth, Attendance)
│   │   └── lib/          # Geofencing, Liveness, and Utility functions
│   └── package.json
│
├── backend/              # Native PHP API Backend
│   ├── php/              # Endpoint controller scripts
│   │   ├── config.php    # DB Connection & CORS dynamic config
│   │   └── *.php         # Database queries & endpoints
│   └── composer.json     # Dependency Management
└── README.md
```

---

## 🚀 Local Setup Instructions

### Prerequisites
- Install [Node.js](https://nodejs.org/) (v18+)
- Install a PHP development suite like [Laragon](https://laragon.org/) or [XAMPP](https://www.apachefriends.org/)
- MySQL Server

### 1. Database Setup
1. Create a MySQL database named `attendify`.
2. Run the SQL schema or run the initialization script:
   ```bash
   php backend/php/create_table.php
   ```

### 2. Run Backend API
1. Start your local PHP server pointing to the `backend/php` directory.
   ```bash
   php -S 127.0.0.1:8081 -t backend/php
   ```

### 3. Run Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

---

## ☁️ Production Deployment on AWS

Attendify is built to be deployed natively on AWS:
- **Database**: Host your MySQL schema on **Amazon RDS**.
- **Backend API**: Upload the backend files directly to **AWS Elastic Beanstalk (PHP)**, configuring database details under Software Environment properties.
- **Frontend App**: Link your Git repository to **AWS Amplify** for automated builds, automated SSL certificates, and client-side route rewrites.

For step-by-step UI directions, refer to our [AWS Beginner's Deployment Guide](aws_beginner_deployment_guide.md).
