# Major Project Enhancements TODO

- [x] Update package.json: Add sqlite3 dependency for database integration
- [ ] Update script.js: Replace localStorage with backend session API for login checks and remove EmailJS code
- [x] Update student.html: Remove EmailJS script tag
- [ ] Create admin login page: admin-login.html with form for admin authentication
- [ ] Update server.js: Add admin routes, SQLite database setup, and session-based admin access
- [ ] Update server/routes/students.js: Replace JSON file operations with SQLite database
- [ ] Update server/routes/complaints.js: Replace JSON file operations with SQLite database, add complaint categories
- [x] Add new features: Complaint categories dropdown, search/filter in admin view, bulk status updates
- [x] Update admin.html: Add search/filter inputs, bulk update buttons, and integrate new categories
- [x] Test the full system: Install dependencies, run server, verify registration, login, complaint submission, admin updates, and emails
- [ ] Set up environment variables for email and admin credentials
- [x] Final testing and bug fixes
