# Hoang Vy Hotel API

Backend API cho hệ thống quản lý khách sạn Hoang Vy được xây dựng với Node.js, TypeScript, Express và MongoDB.

## 🚀 Tính năng

- **Authentication & Authorization**: JWT-based authentication với role-based access control
- **User Management**: Quản lý người dùng với các role khác nhau (Admin, Manager, Staff, Customer)
- **Room Management**: Quản lý phòng khách sạn với trạng thái và loại phòng
- **Booking System**: Hệ thống đặt phòng với validation và payment tracking
- **Validation**: Input validation với Joi
- **Error Handling**: Centralized error handling với custom error classes
- **Logging**: Structured logging với Winston
- **Security**: Helmet, CORS, Rate limiting
- **Database**: MongoDB với Mongoose ODM
- **TypeScript**: Full TypeScript support với strict type checking

## 📁 Cấu trúc thư mục

```
src/
├── config/           # Cấu hình database và các service khác
├── controllers/      # Controllers xử lý business logic
├── middleware/       # Middleware (auth, validation, etc.)
├── models/          # Mongoose models
├── routes/          # API routes
├── services/        # Business logic services (SOLID principles)
├── types/           # TypeScript type definitions
├── utils/           # Utility functions (logger, error handler)
└── app.ts           # Main application file
```

## 🛠️ Cài đặt

### Yêu cầu hệ thống

- Node.js >= 16.0.0
- MongoDB >= 4.4
- npm hoặc yarn

### Cài đặt dependencies

```bash
npm install
```

### Cấu hình môi trường

1. Copy file môi trường:
```bash
cp env.example .env
```

2. Cập nhật các biến môi trường trong file `.env`:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
API_VERSION=v1

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/hvh_hotel
DATABASE_NAME=hvh_hotel

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_REFRESH_EXPIRES_IN=30d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Chạy ứng dụng

#### Development mode
```bash
npm run dev
```

#### Production mode
```bash
npm run build
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api/v1
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Profile
```http
GET /auth/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890"
}
```

#### Change Password
```http
PUT /auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### Response Format

Tất cả API responses đều theo format chuẩn:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

## 🔐 Authentication

### JWT Token

API sử dụng JWT tokens cho authentication. Token được gửi trong header:

```
Authorization: Bearer <token>
```

### User Roles

- **ADMIN**: Full access to all features
- **MANAGER**: Access to management features
- **STAFF**: Access to operational features
- **CUSTOMER**: Access to booking and profile features

## 🗄️ Database Schema

### User Model
```typescript
interface IUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  lastLogin?: Date;
}
```

### Room Model
```typescript
interface IRoom {
  roomNumber: string;
  type: RoomType;
  floor: number;
  price: number;
  capacity: number;
  amenities: string[];
  status: RoomStatus;
  description?: string;
  images?: string[];
}
```

### Booking Model
```typescript
interface IBooking {
  customerId: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  guests: Guest[];
  specialRequests?: string;
  paymentMethod?: PaymentMethod;
}
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📝 Logging

Ứng dụng sử dụng Winston cho logging với các level:

- **ERROR**: Lỗi hệ thống
- **WARN**: Cảnh báo
- **INFO**: Thông tin chung
- **DEBUG**: Debug information

Logs được lưu trong thư mục `logs/`:

- `combined.log`: Tất cả logs
- `error.log`: Chỉ error logs

## 🔧 Development

### Code Style

Dự án sử dụng ESLint và Prettier cho code formatting:

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### TypeScript

Dự án sử dụng TypeScript với strict mode. Để build:

```bash
npm run build
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment | development |
| PORT | Server port | 3001 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/hvh_hotel |
| JWT_SECRET | JWT secret key | - |
| JWT_EXPIRES_IN | JWT expiration time | 7d |
| RATE_LIMIT_MAX_REQUESTS | Rate limit requests | 100 |

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Docker (Optional)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3001

CMD ["node", "dist/app.js"]
```

## 📄 License

ISC License

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

Nếu có vấn đề hoặc câu hỏi, vui lòng tạo issue trên GitHub repository.