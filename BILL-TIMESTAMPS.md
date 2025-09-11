# Bill Timestamps Logic

## Vấn đề trước đây

- Khi tạo bill (trả phòng), `createdAt` được set thành thời điểm hiện tại
- Không có cách nào biết thời điểm checkin thực tế
- `updatedAt` không có ý nghĩa rõ ràng

## Logic mới đã sửa

### 🕐 **createdAt (Thời điểm checkin)**

- **Nguồn**: Lấy từ `bookingInfo.CheckinDate`
- **Ý nghĩa**: Thời điểm khách thực sự checkin vào phòng
- **Cách thực hiện**:
  ```typescript
  createdAt: new Date(bookingCreatedAt); // Từ booking
  ```

### 🕐 **updatedAt (Thời điểm checkout/trả phòng)**

- **Nguồn**: `new Date()` - thời điểm hiện tại
- **Ý nghĩa**: Thời điểm khách trả phòng và tạo bill
- **Cách thực hiện**:
  ```typescript
  updatedAt: new Date(); // Thời điểm hiện tại
  ```

## Tại sao logic này hợp lý?

### ✅ **Ưu điểm**:

1. **Truy vết thời gian chính xác**: Biết được thời gian thực tế khách ở
2. **Tính toán chi phí**: Có thể tính duration dựa trên `createdAt` và `updatedAt`
3. **Báo cáo doanh thu**: Có thể group theo thời điểm checkin hoặc checkout
4. **Audit trail**: Lưu lại lịch sử đầy đủ về booking lifecycle

### 📊 **Use cases**:

```typescript
// Tính thời gian ở (duration)
const duration = bill.updatedAt - bill.createdAt;

// Báo cáo doanh thu theo ngày checkin
bills.filter((bill) => isSameDay(bill.createdAt, targetDate));

// Báo cáo doanh thu theo ngày checkout
bills.filter((bill) => isSameDay(bill.updatedAt, targetDate));
```

## Thay đổi code

### 1. **bill.service.ts - createBill()**

```typescript
// Lấy thời điểm checkin từ booking
const bookingCreatedAt = bookingInfo.CheckinDate || new Date();

const billToSave: IBill = {
  // ... other fields
  createdAt: new Date(bookingCreatedAt), // Thời điểm checkin
  updatedAt: new Date(), // Thời điểm trả phòng
};
```

### 2. **bill.db.ts - createBill()**

```typescript
// Chỉ convert createdAt nếu nó là string
if (p.createdAt && typeof p.createdAt === "string") {
  p.createdAt = new Date(p.createdAt);
}
// Giữ nguyên Date object hoặc undefined để mongoose xử lý

// Đảm bảo updatedAt luôn là thời điểm hiện tại
if (p.updatedAt) {
  p.updatedAt = new Date(p.updatedAt);
}
```

## Kết quả

- **createdAt**: Thời điểm checkin (từ booking)
- **updatedAt**: Thời điểm checkout (tạo bill)
- **Duration**: `updatedAt - createdAt` = thời gian ở thực tế
