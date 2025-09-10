# Deployment Guide - Railway

## Environment Variables for Railway

Khi deploy lên Railway, bạn cần set các environment variables sau:

### Required Environment Variables:

```bash
# Database
MONGO_URI=mongodb+srv://your-mongodb-connection-string

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
COOKIE_EXPIRE=7

# CORS & Security
ALLOWED_ORIGINS=https://hvh-web.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Server
NODE_ENV=production
PORT=3001
API_VERSION=v1
```

## Deployment Steps:

1. **Push code to GitHub**
2. **Connect Railway to your repository**
3. **Set environment variables** trong Railway dashboard
4. **Deploy**

## CORS Configuration:

- **Frontend Domain**: `https://hvh-web.vercel.app`
- **API Domain**: `https://your-railway-app.railway.app`

### Debugging CORS Issues:

1. Check Railway logs for CORS error messages
2. Verify ALLOWED_ORIGINS environment variable is set correctly
3. Ensure frontend is calling the correct API URL
4. Check browser network tab for preflight OPTIONS requests

### Common CORS Issues:

1. **Environment variable not set**: Make sure `ALLOWED_ORIGINS` is set in Railway
2. **Wrong domain**: Verify the exact frontend domain (with/without www, http/https)
3. **Trailing slash**: Remove trailing slashes from domains
4. **Case sensitivity**: Ensure exact case matching

## Testing:

```bash
# Test CORS from browser console (on https://hvh-web.vercel.app):
fetch('https://your-railway-app.railway.app/health', {
  method: 'GET',
  credentials: 'include'
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('CORS Error:', error));
```
