# Run for Bright Futures – Charity 5K Website

Run for Bright Futures is a full-stack web application created for a CSCI-334 User Interface Programming group project. The site was designed for a fictional nonprofit organization hosting a charity 5K on June 19 to raise money for children's education and after-school programs.

The application allows users to learn about the charity, register for the race, log in, view race details, and access a personal dashboard. It also includes admin features for managing registered runners.

---

## Project Overview

This project is split into two main parts:

- **Frontend:** React with Vite  
- **Backend:** ASP.NET Core Minimal API  
- **Storage:** Local JSON file for runner data  

The goal of the project was to create a simple, clear, and easy-to-use charity race website with both user and admin functionality.

---

## Features

### Public Features
- View charity information  
- View race information  
- View race-day schedule  

### User Features
- Register for the 5K  
- Log in with email and password  
- View personal dashboard  
- View teammate information  
- Access private race information after login  

### Admin Features
- View all registered runners  
- View runner details  
- Update runner information  
- Delete runners  
- Promote runners to admin  
- Preview reminder email content  

---

## Tech Stack
### Frontend
- React 18  
- Vite  
- JavaScript  
- CSS  
### Backend
- ASP.NET Core Minimal API  
- C#  
- JSON file storage  

---

## Project Structure

```bash
WebAppGroupProject-CSCI-334/
│
├── README.md
├── Phase II Presentation/
│
└── UI Project/
    ├── charity-run-react/
    │   └── charity-run-react/
    │       ├── src/
    │       │   ├── App.jsx
    │       │   ├── api.js
    │       │   ├── main.jsx
    │       │   └── styles.css
    │       ├── package.json
    │       └── index.html
    │
    └── charity-run-backend-net10/
        ├── Program.cs
        ├── CharityRunBackend.csproj
        └── runners.json
``````

## How to compile and run the program
**Frontend**
```bash
cd "UI Project/charity-run-react/charity-run-react"
npm install
npm run dev
```
**Backend**
```bash
cd "UI Project/charity-run-backend-net10"
dotnet run
```

## API Base URL

The frontend connects to:
```bash
http://localhost:5000
```

## Default Test Accounts

### Admin
```text
Email: admin@example.com
Password: Admin123!
```

### Runner
```text
Email: runner@example.com
Password: Runner123!
```

## UI Pages
- Home Page
- Login Page
- Registration Page
- Dashboard Page
- Admin Panel

## Notes
- Frontend built using React with a clean UI design
- User sessions handled using token-based authentication
- Data stored in a local JSON file (no database)
- Project created for academic and demonstration purposes

## Team Members
- Bryce Batey (Github Account : bbatey1)
- Daniel Howard (Github Account : CodeCreator9999)
- Ponpawit Potisom (Github Account : ppotisom-pp)

## Course 
CSCI-334 – User Interface Programming
Group 6 Project
