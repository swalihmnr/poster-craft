# PosterCraft

PosterCraft is a full-stack, web-based Visual Template Engine and SaaS application that allows administrators to create dynamic poster templates and empowers users to effortlessly generate customized posters. It is designed to handle events, campaigns, and dynamic design workflows directly in the browser.

## 🚀 Features

- **Dynamic Visual Template Engine**: An interactive, browser-based editor to design templates with precise layer positioning, cropping, and text styling.
- **Automated Poster Generation**: Users can input their details (name, photos, text) and instantly generate personalized, high-quality graphics based on pre-defined templates.
- **Photoshop (PSD) Integration**: Support for parsing and using Photoshop frame assets directly in the web application using `ag-psd`.
- **Advanced Cloudinary Integration**: Two-step direct-to-cloud asset uploads bypassing server-side memory limits, optimized for high-resolution graphics.
- **Admin Dashboard**: Comprehensive management of templates, graphic assets, users, and programs/events.
- **Role-Based Access Control**: Secure JWT-based authentication system with User, Admin, and Super Admin privileges.
- **Vercel Monorepo Ready**: Fully configured to be seamlessly deployed as a monorepo on Vercel utilizing both `@vercel/node` and `@vercel/static-build`.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS for responsive, modern UI design
- **State Management**: React Context API
- **Routing**: React Router DOM
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs for secure password hashing
- **Validation**: Zod (for environment variables and payload schema validation)
- **Asset Storage**: Cloudinary (Direct Browser Uploads)
- **Email Service**: Nodemailer (for OTP and transactional emails)
- **PSD Processing**: `ag-psd` for reading and extracting Photoshop file layers

## 📁 Project Structure

This project follows a Monorepo architecture containing both the frontend client and the backend API server.

```
poster-craft/
├── backend/                # Express API Server
│   ├── api/index.ts        # Vercel Serverless Function entrypoint
│   ├── src/                # Backend Source Code
│   │   ├── config/         # Database and Environment configs
│   │   ├── middleware/     # Auth, Roles, and Error Handling
│   │   ├── modules/        # Domain-driven feature modules (Auth, Assets, Templates)
│   │   └── utils/          # Helpers (Logger, Email, ApiResponse)
│   └── package.json        # Backend dependencies
├── frontend/               # React Client Application
│   ├── src/                # Frontend Source Code
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Global Auth & App State
│   │   ├── features/       # Feature-specific pages (Admin, User, Auth)
│   │   └── services/       # API integration layers
│   └── package.json        # Frontend dependencies
├── package.json            # Root workspace config
└── vercel.json             # Vercel deployment and routing configuration
```

## ⚙️ Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Local or Atlas Cluster)
- Cloudinary Account (for image hosting)

### 1. Clone & Install Dependencies
Run the install command from the root directory to utilize NPM Workspaces, installing both frontend and backend dependencies simultaneously:
```bash
git clone <your-repo-url>
cd poster-craft
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend` directory using the provided `.env.example` (or configure manually):
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/poster_creator
JWT_ACCESS_SECRET=your_super_secret_access_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SUPER_ADMIN_EMAIL=admin@example.com
```

### 3. Start Development Servers
Start both the Express backend and Vite frontend development servers.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

The application will be accessible at `http://localhost:5173`.

## 🚀 Deployment (Vercel)

This monorepo is fully configured for deployment on **Vercel**. 

1. Import the repository into your Vercel Dashboard.
2. Override the **Build Command** to `npm run build` (which utilizes the root workspace config).
3. Ensure the **Root Directory** is left as the default (the base of the repo).
4. Add all environment variables from your `backend/.env` into the Vercel Environment Variables dashboard.
5. Deploy! Vercel will automatically build the frontend into `frontend/dist` and deploy the backend as a Serverless Function located at `backend/api/index.ts`.
