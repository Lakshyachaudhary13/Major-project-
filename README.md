# 🏢 Complaint Management System (CMS)

[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)
[![Supabase](https://img.shields.io/badge/Powered_by-Supabase-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)

A comprehensive, web-based platform designed to bridge the communication gap between students, faculty members, and the college administration. This system provides a centralized environment to efficiently register, track, and resolve grievances with full transparency and accountability.

---

## 🌟 Key Features

### 🎓 Student Module
- **Hassle-free Registration**: Quick onboarding for students to join the portal.
- **Lodge Complaints**: Digital forms to submit grievances with category selection.
- **Live Tracking**: Real-time updates on complaint status (Pending → In-Progress → Resolved).
- **Personal Dashboard**: View all past and current complaints in one place.

### 👨‍🏫 Teacher Module
- **Assignment System**: Receive complaints directed to your department or assigned by admin.
- **Workflow Management**: Update status and add resolution comments.
- **Dedicated Portal**: Clean interface to manage multiple student issues at once.

### 🔑 Admin Module
- **Full Oversight**: Monitor the entire system's health and resolution metrics.
- **User Management**: Add/Remove teachers and verify student accounts.
- **Strategic Assignment**: Routing complaints to the appropriate department/staff.
- **Advanced Analytics**: track grievance redressal efficiency.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | HTML5, CSS3 (Vanilla), JavaScript (ES6+) |
| **Backend** | Node.js, Express.js |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | BCrypt.js (Hashing) & Express-Session |
| **Security** | Helmet, CORS, Express-Rate-Limit |
| **Optimization** | Compression Middleware |
| **Testing** | Jest |

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/)
- A [Supabase](https://supabase.com/) account for database hosting.

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/Lakshyachaudhary13/Major-project-.git
cd Major-project-
npm install
```

### 3. Configuration
Create a `.env` file in the root directory and add your Supabase credentials:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
PORT=3000
SESSION_SECRET=your_secure_secret
```

### 4. Running the Project
For development with auto-reload:
```bash
npm run dev
```

For production:
```bash
npm start
```

---

## 🧪 Testing
The project uses **Jest** for unit testing. To run the tests, use:
```bash
npm test
```

---

## 🛡️ Security Features
- **Password Hashing**: Implemented using `bcryptjs`.
- **Session Security**: Managed via `express-session`.
- **DDoS Protection**: Rate limiting enabled on all API routes.
- **Header Protection**: Secured with `helmet`.

---

## 📜 Conclusion
The **Complaint Management System** digitizes the grievance redressal process, ensuring that every voice is heard and every issue is tracked to resolution. It replaces outdated paper-based systems with a modern, scalable cloud-based solution.

---

### 👨‍💻 Developed By
**Lakshya Chaudhary**  
*Major Project - Academic Year 2026*  
[GitHub Profile](https://github.com/Lakshyachaudhary13)
