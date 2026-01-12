# ⚡ Quick Start - הרצת הפרויקט

**מדריך מהיר להרצת הפרויקט מקומית**

---

## 🚀 שלבים מהירים

### 1. התקן Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. הגדר Environment Variables

**צור `backend/.env.local`:**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
PORT=3001
```

**צור `frontend/.env.local`:**
```env
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. הרץ את השרתים

**טרמינל 1 - Backend:**
```bash
cd backend
npm run dev
```

**טרמינל 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 4. פתח בדפדפן

```
http://localhost:5173
```

---

## ⚠️ בעיות נפוצות

### Frontend לא נטען?

1. **בדוק ש-`npm install` רץ:**
   ```bash
   cd frontend
   npm install
   ```

2. **בדוק ש-Port 5173 פנוי:**
   ```bash
   netstat -ano | findstr :5173
   ```

3. **נסה Port אחר:**
   ```bash
   npm run dev -- --port 5174
   ```

### Backend לא עונה?

1. **בדוק ש-`npm install` רץ:**
   ```bash
   cd backend
   npm install
   ```

2. **בדוק ש-Port 3001 פנוי:**
   ```bash
   netstat -ano | findstr :3001
   ```

3. **בדוק ש-`.env.local` קיים:**
   ```bash
   cd backend
   dir .env.local
   ```

### שגיאות Dependencies?

**נסה למחוק node_modules ולהתקין מחדש:**
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## ✅ בדיקות מהירות

### Backend Health Check:
```bash
curl http://localhost:3001/api/health
```

### Frontend:
פתח `http://localhost:5173` - צריך לראות את הדף

---

**עודכן:** 2026-01-11
