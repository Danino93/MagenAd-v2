# 🛡️ MagenAd V2 - Google Ads Fraud Detection

> Advanced AI-powered fraud detection system for Google Ads campaigns

[![Version](https://img.shields.io/badge/version-2.0-blue.svg)](https://github.com/yourusername/magenad)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-Production-success.svg)]()

---

## 🎯 What is MagenAd?

MagenAd is an intelligent fraud detection system that monitors your Google Ads campaigns 24/7, identifying suspicious clicks and protecting your advertising budget.

### Key Features

- 🤖 **12 AI Detection Rules** - Comprehensive fraud detection
- 📊 **Real-time Dashboard** - Live monitoring and alerts
- 📄 **Automated Reports** - PDF/Excel reports
- 🔔 **Smart Alerts** - Email + WhatsApp notifications
- 📈 **Quiet Index** - Campaign quality scoring
- 🌐 **Multi-Account** - Manage multiple Google Ads accounts

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or Supabase)
- Redis 6+ (optional, for caching)
- Google Ads Account

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/magenad.git
cd magenad

# Backend
cd backend
npm install
cp .env.example .env
# Configure .env with your credentials
npm run dev

# Frontend
cd ../frontend
npm install
npm run dev
```

Visit: http://localhost:5173

---

## 📖 Documentation

- [User Guide](docs/USER_GUIDE.md) - Complete user documentation
- [API Documentation](docs/API_DOCUMENTATION.md) - API reference
- [Technical Blueprint](docs/01_TECHNICAL_BLUEPRINT_COMPLETE.md) - Architecture details
- [Execution Plan](docs/03_EXECUTION_PLAN_60_DAYS.md) - 60-day development plan

---

## 🏗️ Architecture

```
magenad/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── config/
│   ├── jobs/         # Cron jobs
│   └── tests/
├── frontend/         # React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   └── tests/
├── db/               # Database migrations
│   └── migrations/
└── docs/             # Documentation
```

---

## 🔧 Tech Stack

**Backend:**
- Node.js + Express
- Supabase (PostgreSQL)
- Redis (Caching)
- Google Ads API
- Node-Cron (Jobs)

**Frontend:**
- React 18
- Vite
- TailwindCSS
- Recharts
- Zustand

**Testing:**
- Jest (Backend)
- Vitest (Frontend)
- Playwright (E2E)
- k6 (Load Testing)

---

## 📊 Detection Rules

### Category A: Click Patterns
- **A1:** IP Anomaly Detection
- **A2:** Click Velocity Spikes
- **A3:** Geographic Anomalies

### Category B: Cost Patterns
- **B1:** CTR Anomalies
- **B2:** CPC Anomalies
- **B3:** Conversion Rate Anomalies

### Category C: Behavioral Patterns
- **C1:** Time-based Patterns
- **C2:** Device Distribution Anomalies

[View all 12 rules →](docs/02_DETECTION_RULES_FINAL.md)

---

## 🔒 Security Features

- ✅ Rate Limiting
- ✅ Security Headers (Helmet)
- ✅ Input Validation & Sanitization
- ✅ CORS Configuration
- ✅ JWT Authentication
- ✅ Row Level Security (RLS)

---

## 📈 Performance

- ⚡ Response Time: < 200ms (with caching)
- ⚡ Database Queries: Optimized with indexes
- ⚡ Bundle Size: < 1MB (with code splitting)
- ⚡ Cache Hit Rate: 80%+

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📝 License

MIT License - see [LICENSE](LICENSE)

---

## 💬 Support

- 📧 Email: support@magenad.com
- 💬 Discord: [Join our server](https://discord.gg/magenad)
- 📖 Docs: [docs.magenad.com](https://docs.magenad.com)

---

## 🙏 Acknowledgments

Built with ❤️ by the MagenAd team

Special thanks to:
- Google Ads API team
- Supabase team
- Open source community

---

**⭐ Star us on GitHub if you find this useful!**
