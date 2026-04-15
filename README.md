# NIFES FYB Dinner & Thanksgiving Website

Production-style event web app for NIFES CUSTECH Osara FYB Dinner & Thanksgiving.

## Stack
- Frontend: React + Vite + Tailwind CSS v4 + Framer Motion + Swiper + canvas-confetti / react-confetti
- Backend: Node.js + Express
- Payment: Paystack (test/live via env)
- Ticketing: High-res branded PNG (Canvas) + QRCode
- Email: Nodemailer SMTP

## Features Implemented
- Elegant Christian gala-themed landing page with animated hero and countdown
- Event details, schedule, sponsorship, gallery, and contact sections
- Registration form with Nigerian phone validation and category/ticket logic
- Paystack payment initialization endpoint (+ local mock fallback)
- Payment verification endpoint and ticket generation (PNG + unique QR/Ticket ID)
- Auto-email ticket delivery (when SMTP env variables are configured)
- Admin dashboard at `/admin` (password-protected via backend header)
- Admin stats, CSV export, ticket resend, and check-in by ticket ID
- SEO/Open Graph meta tags
- Basic offline fallback page via service worker

## Local Setup

### 1) Backend
```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

### 2) Frontend
```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and backend on `http://localhost:5050`.

## Paystack Notes
- Leave `PAYSTACK_SECRET_KEY` empty for local mock mode (redirects back and verifies as demo).
- Add your test key to enable real Paystack test flow.
- Switch to live by replacing with your live secret key and updating callback/domain settings in Paystack dashboard.

## Admin Access
- Route: `http://localhost:5173/admin`
- Password comes from `backend/.env` -> `ADMIN_PASSWORD`.

## Data Storage
- Registrations are stored in `backend/data/registrations.json`.
- Generated ticket images (PNG) are stored in `backend/tickets/`.

## Deploy (Vercel/Netlify + Render/Railway)
- Deploy frontend separately (Vercel/Netlify).
- Deploy backend to Render/Railway/Fly.
- Set frontend `VITE_API_BASE_URL` to backend URL.
- Set backend `FRONTEND_URL` to frontend URL.
- Configure Paystack + SMTP env vars in deployed backend.

## Customization
- Event date/time: `frontend/.env` (`VITE_EVENT_DATE`)
- Theme/colors/styles: `frontend/src/index.css`
- Sections/content: `frontend/src/App.jsx`
- Admin logic/API: `backend/src/server.js`
