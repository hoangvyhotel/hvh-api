# Room API Documentation

## Tổng quan

API quản lý phòng khách sạn với đầy đủ chức năng CRUD (Create, Read, Update, Delete).

## Base URL

```
http://localhost:3000/api/rooms
```

## Endpoints

### 1. Tạo phòng mới

```http
POST /api/rooms
```

**Request Body:**

```json
{
  "floor": 1,
  "originalPrice": 500000,
  "afterHoursPrice": 600000,
  "dayPrice": 450000,
  "nightPrice": 550000,
  "description": "Phòng đơn tầng 1, view thành phố",
  "typeHire": 1,
  "status": true,
  "hotelId": "60d5ecb54b24c2001f6479a1"
}
```

**Response:**

```json
{
  "succeeded": true,
  "message": "Tạo phòng thành công",
  "statusCode": 200,
  "code": "SUCCESS",
  "data": {
    "_id": "...",
    "floor": 1,
    "originalPrice": 500000,
    "afterHoursPrice": 600000,
    "dayPrice": 450000,
    "nightPrice": 550000,
    "description": "Phòng đơn tầng 1, view thành phố",
    "typeHire": 1,
    "status": true,
    "hotelId": "60d5ecb54b24c2001f6479a1",
    "createdAt": "2025-08-20T06:05:32.000Z",
    "updatedAt": "2025-08-20T06:05:32.000Z"
  },
  "errors": null
}
```

### 2. Lấy tất cả phòng

```http
GET /api/rooms
```

### 3. Lấy phòng theo ID

```http
GET /api/rooms/:id
```

### 4. Lấy phòng theo Hotel ID

```http
GET /api/rooms/hotel/:hotelId
```

### 5. Lấy phòng có sẵn

```http
GET /api/rooms/available
```

**Query Parameters (optional):**

- `hotelId`: Filter theo hotel ID

### 6. Lấy thống kê phòng

```http
GET /api/rooms/stats
```

**Query Parameters (optional):**

- `hotelId`: Filter theo hotel ID

**Response:**

```json
{
  "succeeded": true,
  "message": "Lấy thống kê phòng thành công",
  "statusCode": 200,
  "code": "SUCCESS",
  "data": {
    "totalRooms": 10,
    "availableRooms": 7,
    "occupiedRooms": 3,
    "occupancyRate": "30.00"
  },
  "errors": null
}
```

### 7. Cập nhật phòng

```http
PUT /api/rooms/:id
```

**Request Body (tất cả fields đều optional):**

```json
{
  "floor": 2,
  "originalPrice": 600000,
  "afterHoursPrice": 700000,
  "dayPrice": 550000,
  "nightPrice": 650000,
  "description": "Phòng đơn tầng 2, view thành phố - Updated",
  "typeHire": 2,
  "status": true,
  "hotelId": "60d5ecb54b24c2001f6479a1"
}
```

### 8. Cập nhật trạng thái phòng

```http
PATCH /api/rooms/:id/status
```

**Request Body:**

```json
{
  "status": false
}
```

### 9. Xóa phòng (Soft Delete)

```http
DELETE /api/rooms/:id
```

### 10. Xóa phòng hoàn toàn (Hard Delete)

```http
DELETE /api/rooms/:id/permanent
```

## Data Schema

### Room Model

```typescript
{
  _id: ObjectId,
  floor: number,              // Tầng (1-50)
  originalPrice: number,      // Giá gốc
  afterHoursPrice: number,    // Giá ngoài giờ
  dayPrice: number,           // Giá ngày
  nightPrice: number,         // Giá đêm
  description: string,        // Mô tả (10-500 ký tự)
  typeHire: number,           // 1: theo giờ, 2: theo ngày, 3: qua đêm
  status: boolean,            // true: có sẵn, false: đã thuê
  hotelId: ObjectId,          // Reference đến Hotel
  createdAt: Date,
  updatedAt: Date
}
```

## Validation Rules

### Create Room

- `floor`: Bắt buộc, số nguyên từ 1-50
- `originalPrice`: Bắt buộc, số dương
- `afterHoursPrice`: Bắt buộc, số dương
- `dayPrice`: Bắt buộc, số dương
- `nightPrice`: Bắt buộc, số dương
- `description`: Bắt buộc, chuỗi 10-500 ký tự
- `typeHire`: Bắt buộc, số nguyên 1-3
- `status`: Optional, boolean (mặc định true)
- `hotelId`: Bắt buộc, MongoDB ObjectId hợp lệ

### Update Room

- Tất cả fields đều optional
- Validation giống như Create Room cho các field được cung cấp

### Update Status

- `status`: Bắt buộc, boolean

## Error Responses

### Validation Error (400)

```json
{
  "succeeded": false,
  "message": "Validation error: Tầng phải là số nguyên từ 1 đến 50, Giá gốc phải là số dương",
  "statusCode": 400,
  "code": "VALIDATION",
  "data": null,
  "errors": null
}
```

### Not Found Error (404)

```json
{
  "succeeded": false,
  "message": "Không tìm thấy phòng",
  "statusCode": 404,
  "code": "NOT_FOUND",
  "data": null,
  "errors": null
}
```

### Invalid ID Error (400)

```json
{
  "succeeded": false,
  "message": "Room ID phải là MongoDB ObjectId hợp lệ",
  "statusCode": 400,
  "code": "VALIDATION",
  "data": null,
  "errors": null
}
```

## Usage Examples

### Postman Collection

Sử dụng file `test-room-api.http` trong thư mục gốc của project để test API.

### Sample Data

Chạy script seed để tạo data test:

```bash
npm run seed:rooms
```

### Testing với REST Client

1. Mở file `test-room-api.http`
2. Cập nhật `@hotelId` với ID hotel thực tế
3. Chạy từng request để test API

## Notes

- Tất cả endpoint sử dụng validation middleware
- Soft delete: chỉ đổi status thành false
- Hard delete: xóa hoàn toàn khỏi database
- Populate hotelId trong response để lấy thông tin hotel
- Sắp xếp theo createdAt (mới nhất trước) cho getAll
- Sắp xếp theo floor cho getByHotelId và getAvailableRooms
