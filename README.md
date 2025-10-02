# 📈 Stocks Learners

A full-stack stock trading learning platform built with Next.js, Express, and PostgreSQL.

## 🚀 Features

- **Real-time Stock Data** - Live market data and stock information
- **Paper Trading** - Practice trading without real money
- **Portfolio Management** - Track holdings and performance
- **Market Indices** - View major market indices
- **Watchlist** - Save and monitor favorite stocks
- **User Authentication** - Secure email OTP and Google OAuth
- **Admin Dashboard** - Manage users and view analytics
- **Contact System** - Users can submit queries

## 🛠️ Tech Stack

### Frontend

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Shadcn UI

### Backend

- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Helmet.js (Security)
- Express Rate Limit

## 📚 Documentation

All project documentation is organized in the **[copilot-logs](./copilot-logs/)** folder:

### 🔐 Security & Authentication

- [AUTH_SECURITY_AUDIT.md](./copilot-logs/AUTH_SECURITY_AUDIT.md) - Security audit findings
- [SECURITY_IMPLEMENTATION_SUMMARY.md](./copilot-logs/SECURITY_IMPLEMENTATION_SUMMARY.md) - Implementation details
- [SECURITY_TESTING.md](./copilot-logs/SECURITY_TESTING.md) - Testing guide
- [FRONTEND_AUTH_GUIDE.md](./copilot-logs/FRONTEND_AUTH_GUIDE.md) - API reference
- [QUICK_REFERENCE.md](./copilot-logs/QUICK_REFERENCE.md) - Quick reference

### 📖 Full Documentation Index

See **[copilot-logs/INDEX.md](./copilot-logs/INDEX.md)** for a complete list of all documentation.

## 🏃 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/jayendrabharti/stocks-learners.git
   cd stocks-learners
   ```

2. **Setup Backend**

   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npx prisma migrate dev
   npm run build
   npm start
   ```

3. **Setup Frontend**

   ```bash
   cd ../frontend
   npm install
   cp .env.example .env.local
   # Edit .env.local with your configuration
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080

## 🔒 Security Features

- ✅ Rate limiting (brute force protection)
- ✅ OTP-based authentication with attempt tracking
- ✅ Account locking after failed attempts
- ✅ Security headers (Helmet.js)
- ✅ Input validation
- ✅ Field whitelisting
- ✅ Automatic token cleanup
- ✅ JWT with refresh tokens

**Security Score:** 9/10 ⭐

## 📝 Environment Variables

### Backend (.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
ACCESS_TOKEN_SECRET="your-access-secret"
REFRESH_TOKEN_SECRET="your-refresh-secret"
CLIENT_BASE_URL="http://localhost:3000"
NODE_ENV="development"
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL="http://localhost:8080"
```

## 🧪 Testing

See [SECURITY_TESTING.md](./copilot-logs/SECURITY_TESTING.md) for comprehensive testing guide.

## 📂 Project Structure

```
stocks-learners/
├── frontend/          # Next.js frontend
│   ├── app/          # App router pages
│   ├── components/   # React components
│   ├── services/     # API services
│   └── types/        # TypeScript types
├── server/           # Express backend
│   ├── src/
│   │   ├── controllers/  # Route controllers
│   │   ├── middlewares/  # Custom middleware
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── utils/        # Utilities
│   │   └── prisma/       # Database schema
│   └── build/        # Compiled JavaScript
└── copilot-logs/     # Documentation
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is for educational purposes.

## 👥 Author

**Jayendra Bharti**

- GitHub: [@jayendrabharti](https://github.com/jayendrabharti)

## 🙏 Acknowledgments

- Built with assistance from GitHub Copilot
- Market data powered by Groww API (for learning purposes)
- UI components from Shadcn UI

---

**Last Updated:** October 2, 2025
