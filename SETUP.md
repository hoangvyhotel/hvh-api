# 🏨 HVH Hotel Management API - Setup Guide

## 📋 Yêu cầu hệ thống

- **Node.js**: >= 16.x
- **MongoDB**: >= 4.4
- **npm** hoặc **yarn**

## 🚀 Cài đặt và chạy project

### 1. Clone repository

```bash
git clone <repository-url>
cd hvh-api
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Setup environment variables

```bash
# Copy file .env.example thành .env
cp .env.example .env

# Hoặc trên Windows
copy .env.example .env
```

Sau đó chỉnh sửa file `.env` với thông tin cấu hình của bạn:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/hvh_hotel

# JWT Secrets (Thay đổi trong production)
JWT_SECRET=hvh_hotel_super_secret_key_2025_very_long_and_secure
JWT_REFRESH_SECRET=hvh_hotel_refresh_secret_key_2025_very_long_and_secure
JWT_ACTIVATION_SECRET=hvh_hotel_activation_secret_key_2025_very_long_and_secure

# Server
PORT=3001
NODE_ENV=development
```

### 4. Khởi động MongoDB

Đảm bảo MongoDB đang chạy trên máy của bạn:

```bash
# Trên Windows (nếu cài MongoDB service)
net start MongoDB

# Hoặc chạy mongod trực tiếp
mongod
```

### 5. Build project

```bash
npm run build
```

### 6. Chạy development server

```bash
npm run dev
```

### 7. Seed test data (Optional)

```bash
# Tạo data test cho Room
npm run seed:rooms
```

**⚠️ Lưu ý**: Trước khi chạy seed:rooms, cần cập nhật `SAMPLE_HOTEL_IDS` trong file `scripts/seed-rooms.ts` với hotel IDs thực tế từ database của bạn.

## 📡 API Endpoints

### Room APIs

```
POST   /api/rooms                    - Tạo phòng mới
GET    /api/rooms                    - Lấy tất cả phòng
GET    /api/rooms/:id                - Lấy phòng theo ID
GET    /api/rooms/hotel/:hotelId     - Lấy phòng theo hotel
GET    /api/rooms/available          - Lấy phòng có sẵn
GET    /api/rooms/stats              - Thống kê phòng
PUT    /api/rooms/:id                - Cập nhật phòng
PATCH  /api/rooms/:id/status         - Cập nhật trạng thái phòng
DELETE /api/rooms/:id                - Xóa phòng (soft delete)
DELETE /api/rooms/:id/permanent      - Xóa phòng hoàn toàn
```

### Health Check

```
GET    /api/health                   - Kiểm tra trạng thái server
```

## 🧪 Testing API

### 1. Sử dụng REST Client (VS Code)

- Mở file `test-room-api.http`
- Cập nhật `@hotelId` với hotel ID thực tế
- Sử dụng REST Client extension để test

### 2. Sử dụng Postman

- Import các request từ file `test-room-api.http`
- Hoặc tạo collection mới với các endpoint trên

### 3. Sử dụng curl

```bash
# Tạo phòng mới
curl -X POST http://localhost:3001/api/rooms \
  -H "Content-Type: application/json" \
  -d '{
    "floor": 1,
    "originalPrice": 500000,
    "afterHoursPrice": 600000,
    "dayPrice": 450000,
    "nightPrice": 550000,
    "description": "Phòng đơn tầng 1",
    "typeHire": 1,
    "status": true,
    "hotelId": "YOUR_HOTEL_ID_HERE"
  }'

# Lấy tất cả phòng
curl http://localhost:3001/api/rooms
```

## 📂 Cấu trúc project

```
src/
├── api/
│   ├── index.ts              # Main router
│   └── routes/
│       ├── auth.route.ts     # Authentication routes
│       └── room.route.ts     # Room CRUD routes
├── controllers/
│   ├── auth.controller.ts    # Auth controllers
│   └── room.controller.ts    # Room controllers
├── db/
│   ├── user.db.ts           # User database operations
│   └── room.db.ts           # Room database operations
├── middleware/
│   ├── auth.ts              # Authentication middleware
│   ├── validation.ts        # General validation
│   └── room.validation.ts   # Room-specific validation
├── models/
│   ├── Users.ts             # User model
│   ├── Room.ts              # Room model
│   └── Hotel.ts             # Hotel model
├── types/
│   ├── request/             # Request type definitions
│   └── response/            # Response type definitions
├── utils/
│   ├── AppError.ts          # Custom error class
│   ├── response.ts          # Response helper
│   ├── logger.ts            # Logging utility
│   └── jwt.ts               # JWT utilities
├── config/
│   └── database.ts          # Database configuration
└── app.ts                   # Main application file
```

## 🛠 Scripts có sẵn

```bash
npm run dev              # Chạy development server
npm run build            # Build project
npm run start            # Chạy production server
npm run test             # Chạy tests
npm run lint             # Kiểm tra code style
npm run lint:fix         # Tự động fix code style
npm run seed:rooms       # Tạo test data cho rooms
```

## 🔧 Troubleshooting

### MongoDB connection error

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Giải pháp**: Đảm bảo MongoDB đang chạy trên port 27017

### Port already in use

```
Error: listen EADDRINUSE :::3001
```

**Giải pháp**: Thay đổi PORT trong file `.env` hoặc kill process đang sử dụng port 3001

### JWT_SECRET not found

```
Error: JWT_SECRET is required
```

**Giải pháp**: Đảm bảo file `.env` tồn tại và có đầy đủ các biến môi trường

## 🚀 Production Deployment

### 1. Cấu hình production

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hvh_hotel
JWT_SECRET=your_super_secure_secret_here
ALLOWED_ORIGINS=https://yourdomain.com
PORT=80
```

### 2. Build và deploy

```bash
npm run build
npm start
```

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng:

1. Kiểm tra logs trong thư mục `logs/`
2. Đảm bảo tất cả dependencies đã được cài đặt
3. Kiểm tra MongoDB connection
4. Xem file `.env` có đầy đủ biến môi trường không
