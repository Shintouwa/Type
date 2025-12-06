# Blind Typing Test System

A production-ready Blind Typing Test application where participants type invisible text. Features a real-time Admin Dashboard for managing tests and viewing results.

## Features
- **Participants**: Join test, invisible typing area, real-time timer, auto-submission.
- **Admin**: Login (Secure), Paragraph Management (CRUD), Real-time Test Control (Start/Stop), Live Results Table, CSV Export.
- **Security**: Disabled Copy/Paste/Right-Click.
- **Tech Stack**: Node.js, Express, Socket.io, **JSON Database** (No MongoDB required).

## Project Structure
```
/public         # Static frontend files (HTML/CSS/JS)
/src
  /models       # Database Models (JSON based)
  /routes       # API Routes
  /db           # JSON DB Adapter
  server.js     # Main Server Entry Point
seed.js         # Database Seeder
data.json       # Database File (Created automatically)
```

## Setup Instructions

### 1. Prerequisites
- Node.js installed.

### 2. Installation
```bash
npm install
```

### 3. Configuration
Create a `.env` file in the root directory:
```env
PORT=3000
JWT_SECRET=your_super_secret_key
```

### 4. Database Seeding
Run the seeder to create the default Admin and sample paragraphs.
```bash
node seed.js
```
*Default Admin Credentials:* `admin` / `admin123`

### 5. Running the API
```bash
npm start
# OR for development
npm run dev
```

### 6. Usage
1.  **Admin**: Go to `http://localhost:3000/admin.html`. Login with `admin`/`admin123`.
2.  **Participant**: Go to `http://localhost:3000/`. Enter name and wait.
3.  **Flow**:
    - Admin selects a Paragraph and sets Duration.
    - Admin clicks "Start Test".
    - Participants see the text and start typing.
    - Test ends automatically or manually.
    - Results appear on Admin Dashboard.

## API Endpoints
- `POST /api/auth/login` - Admin Login
- `GET /api/paragraphs` - List Paragraphs
- `POST /api/paragraphs` - Add Paragraph (Auth required)
- `GET /api/results` - Get All Results (Auth required)
