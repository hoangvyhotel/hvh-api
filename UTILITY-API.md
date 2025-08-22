# Tài liệu API Tiện ích

## Tổng quan

API quản lý tiện ích khách sạn (Utility) với đầy đủ chức năng CRUD (Create, Read, Update, Delete).

## Base URL

```
http://localhost:3000/api/utilities
```

## Endpoints

### 1. Tạo tiện ích mới

```http
POST /api/utilities
```

**Request Body:**

```json
{
	"name": "Wifi",
	"price": 50000,
	"icon": "wifi.svg",
	"status": true,
	"hotelId": "60d5ecb54b24c2001f6479a1"
}
```

**Response:**

```json
{
	"succeeded": true,
	"message": "Tạo tiện ích thành công",
	"statusCode": 201,
	"code": "UTILITY_CREATE_SUCCESS",
	"data": {
		"_id": "...",
		"name": "Wifi",
		"price": 50000,
		"icon": "wifi.svg",
		"status": true,
		"hotelId": "60d5ecb54b24c2001f6479a1",
		"createdAt": "2025-08-21T10:00:00.000Z",
		"updatedAt": "2025-08-21T10:00:00.000Z"
	},
	"errors": null
}
```

### 2. Lấy tất cả tiện ích

```http
GET /api/utilities?hotelId=60d5ecb54b24c2001f6479a1&status=true
```

**Query Parameters:**
- `hotelId`: Bắt buộc, lọc theo khách sạn
- `status`: Optional, lọc theo trạng thái (true/false)

**Response:**

```json
{
	"succeeded": true,
	"message": "Lấy danh sách tiện ích thành công",
	"statusCode": 200,
	"code": "UTILITY_LIST_SUCCESS",
	"data": [
		{
			"_id": "...",
			"name": "Wifi",
			"price": 50000,
			"icon": "wifi.svg",
			"status": true,
			"hotelId": "60d5ecb54b24c2001f6479a1",
			"createdAt": "...",
			"updatedAt": "..."
		}
		// ...
	],
	"errors": null
}
```

### 3. Lấy tiện ích theo ID

```http
GET /api/utilities/:id
```

**Response:**

```json
{
	"succeeded": true,
	"message": "Lấy thông tin tiện ích thành công",
	"statusCode": 200,
	"code": "UTILITY_GET_SUCCESS",
	"data": {
		"_id": "...",
		"name": "Wifi",
		"price": 50000,
		"icon": "wifi.svg",
		"status": true,
		"hotelId": "60d5ecb54b24c2001f6479a1",
		"createdAt": "...",
		"updatedAt": "..."
	},
	"errors": null
}
```

### 4. Cập nhật tiện ích

```http
PUT /api/utilities/:id
```

**Request Body (tất cả fields đều optional):**

```json
{
	"name": "Wifi Free",
	"price": 0,
	"icon": "wifi.svg",
	"status": true,
	"hotelId": "60d5ecb54b24c2001f6479a1"
}
```

**Response:**

```json
{
	"succeeded": true,
	"message": "Cập nhật tiện ích thành công",
	"statusCode": 200,
	"code": "UTILITY_UPDATE_SUCCESS",
	"data": {
		"_id": "...",
		"name": "Wifi Free",
		"price": 0,
		"icon": "wifi.svg",
		"status": true,
		"hotelId": "60d5ecb54b24c2001f6479a1",
		"createdAt": "...",
		"updatedAt": "..."
	},
	"errors": null
}
```

### 5. Xóa tiện ích

```http
DELETE /api/utilities/:id
```

**Response:**

```json
{
	"succeeded": true,
	"message": "Xóa tiện ích thành công",
	"statusCode": 200,
	"code": "UTILITY_DELETE_SUCCESS",
	"data": { "deleted": true },
	"errors": null
}
```

## Data Schema

### Utility Model

```typescript
{
	_id: ObjectId,
	name: string,           // Tên tiện ích (bắt buộc)
	price: number,          // Giá tiện ích (bắt buộc, >= 0)
	icon?: string,          // Đường dẫn icon (optional)
	status: boolean,        // true: có sẵn, false: không sử dụng
	hotelId: ObjectId,      // Reference đến Hotel (bắt buộc)
	createdAt: Date,
	updatedAt: Date
}
```

## Validation Rules

### Create Utility

- `name`: Bắt buộc, chuỗi không rỗng
- `price`: Bắt buộc, số >= 0
- `icon`: Optional, chuỗi
- `status`: Optional, boolean (mặc định true)
- `hotelId`: Bắt buộc, MongoDB ObjectId hợp lệ

### Update Utility

- Tất cả fields đều optional
- Validation giống như Create Utility cho các field được cung cấp

## Error Responses

### Lỗi xác thực (400)

```json
{
	"succeeded": false,
	"message": "hotelId là bắt buộc",
	"statusCode": 400,
	"code": "MISSING_HOTEL_ID",
	"data": null,
	"errors": null
}
```

### Lỗi trùng tiện ích (409)

```json
{
	"succeeded": false,
	"message": "Tiện ích cùng tên đã tồn tại cho khách sạn này",
	"statusCode": 409,
	"code": "DUPLICATE_UTILITY",
	"data": null,
	"errors": { "keyValue": { "name": "Wifi", "hotelId": "..." } }
}
```

### Lỗi không tìm thấy (404)

```json
{
	"succeeded": false,
	"message": "Không tìm thấy tài nguyên",
	"statusCode": 404,
	"code": "NOT_FOUND",
	"data": null,
	"errors": null
}
```

## Usage Examples

### Postman Collection

Sử dụng file `test-utility-api.http` trong thư mục gốc của project để test API.


## Notes

- Tên tiện ích phải duy nhất trong cùng một khách sạn
- Sắp xếp theo createdAt (mới nhất trước) cho getAll
- Populate hotelId trong response để lấy thông tin hotel (nếu cần)
