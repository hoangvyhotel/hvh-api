# Auth API Documentation

## Tổng quan

API xác thực người dùng: đăng nhập, đăng ký, logout và các thao tác liên quan đến token.
Tài liệu này dựa trên mã nguồn hiện tại trong `src/controllers`, `src/services`, `src/middleware` và `src/utils/jwt`.

## Base URL

```
http://localhost:3000/api/auth
```

## Endpoints

### 1. Login

```http
POST /api/auth/login
```

**Request Body:**

```json
{
  "userName": "user1",   // optional (controller/service hỗ trợ tìm theo userName)
  "password": "secret"  // required
}
```

**Behavior:**
- Gọi `AuthService.login` để kiểm tra credential.
- Nếu hợp lệ, trả về object chứa thông tin user và token (theo code hiện tại `tokens` là một string access token).
- Middleware `authenticate` dùng header `Authorization: Bearer <token>` hoặc cookie `token`.

**Success Response (200):**

```json
{
  "succeeded": true,
  "message": "Login successful",
  "statusCode": 200,
  "code": "LOGIN_SUCCESS",
  "data": {
    "user": {
      "id": "<userId>",
      "userName": "user1",
      "role": "STAFF"
    },
    "tokens": "<access_token_string>"
  },
  "errors": null
}
```

> Note: dự án có helper `sendToken` và `src/utils/jwt` để gửi `access_token`/`refresh_token` dưới dạng cookie (`access_token`/`refresh_token`), nhưng controller hiện tại chỉ trả JSON với `tokens`.

---

### 2. Register

```http
POST /api/auth/register
```

**Request Body:**

```json
{
  "username": "user1",
  "password": "secret",
  "passwordManage": "secret2"
}
```

**Behavior:**
- Tạo user mới (hash password) với role mặc định là `STAFF`.
- Nếu username đã tồn tại, service ném `AppError.conflict("USERNAME_ALREADY_EXISTS")`.
- Trả về thông tin user và token (theo code hiện tại `tokens` là một string access token).

**Success Response (201):**

```json
{
  "succeeded": true,
  "message": "User registered successfully",
  "statusCode": 201,
  "code": "REGISTER_SUCCESS",
  "data": {
    "user": { "id": "<userId>", "userName": "user1", "role": "STAFF" },
    "tokens": "<access_token_string>"
  },
  "errors": null
}
```

---

### 3. Refresh token (not implemented)

```http
POST /api/auth/refresh-token
```

- Route hiện tại khai báo nhưng không xử lý (empty route in `auth.route.ts`).
- Code service có hàm `refreshToken` bị comment; nếu cần triển khai, nên dùng `src/utils/jwt.verifyRefreshToken` và `generateAccessToken`/`createAccessRefreshToken`.

---

### 4. Logout

```http
POST /api/auth/logout
```

**Authentication required:** route dùng middleware `authenticate` (Bearer token header hoặc cookie `token`).

**Behavior hiện tại:**
- Controller xóa cookie `token` bằng cách set cookie giá trị `null` và trả về response thành công.
- Lưu ý: project còn có utility `clearAuthCookies(res)` trong `src/utils/jwt` để xóa `access_token` và `refresh_token` (nếu bạn dùng cơ chế cookie đó).

**Success Response (200):**

```json
{
  "succeeded": true,
  "message": "Logout successful",
  "statusCode": 200,
  "code": "LOGOUT_SUCCESS",
  "data": {
    "message": "Logged out successfully",
    "loggedOut": true
  },
  "errors": null
}
```

---

## Request / Response Schemas

- Requests defined in `src/types/request/auth.ts`:
  - `LoginRequest` (body: `userName?`, `password`)
  - `RegisterRequest` (body: `username`, `password`, `passwordManage`)
  - Several other request types exist for refresh/change/reset password but not implemented in controllers.

- Responses defined in `src/types/response/auth.ts`:
  - `LoginResponse`: `{ user: UserInfo, tokens: string }` per current code
  - `RegisterResponse`: same shape
  - `LogoutResponse`: `{ message: string, loggedOut: boolean }`

## Auth header / cookie behavior

- Middleware `authenticate` (in `src/middleware/auth.ts`) sẽ tìm token theo thứ tự:
  1. `Authorization: Bearer <token>` header
  2. Cookie `token`
- Nếu không có token, trả `401` với code `NO_TOKEN`.
- Token được xác thực bằng `jwt.verify(token, process.env.JWT_SECRET)`.
- `optionalAuth` tương tự nhưng không trả lỗi nếu token không hợp lệ / không có token.

## Environment variables (liên quan đến auth)

- `JWT_SECRET` (bắt buộc) — secret để sign/verify access token
- `JWT_REFRESH_SECRET` (bắt buộc theo `src/utils/jwt.ts`) — secret cho refresh token
- `JWT_ACTIVATION_SECRET` (bắt buộc theo `src/utils/jwt.ts`) — secret cho activation token
- `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` — (optional) thời gian hết hạn
- `COOKIE_EXPIRE` — controller auth dùng để tính expires cho cookie legacy `token`

> Nếu `JWT_SECRET`/`JWT_REFRESH_SECRET`/`JWT_ACTIVATION_SECRET` không tồn tại, file `src/utils/jwt.ts` sẽ throw Error('JWT configuration is incomplete') và ứng dụng sẽ crash.

## Errors & Status Codes

Common errors produced by service/middleware:
- 400 / Validation errors (via `AppError.validation`)
- 401 Unauthorized
  - `NO_TOKEN` — token không cung cấp
  - `INVALID_TOKEN` — token không hợp lệ
  - `TOKEN_EXPIRED` — token hết hạn
  - `INVALID_CREDENTIALS`, `WRONG_PASSWORD` — login fails
- 404 Not Found — `NON_EXISTING_USER` when username not found
- 409 Conflict — `USERNAME_ALREADY_EXISTS` (register duplicate)
- 500 Internal errors — `INTERNAL_ERROR` and others

Responses use the standardized `BaseResponse<T>` shape from `src/types/response/base`.

## Notes & Recommendations

- Hiện có một số inconsistencies:
  - `src/utils/jwt.ts` uses `access_token` / `refresh_token` cookie names, while `src/controllers/auth.controller.ts` uses the legacy `token` cookie and the controller's `login` currently returns tokens in JSON instead of setting cookies.
  - `AuthService.login` returns `tokens` as a string (access token) while types in `src/types/response/auth.ts` define richer `AuthTokens` shape. If you want refresh tokens or cookie-based auth, consider updating `AuthService.login` to use `createAccessRefreshToken` and controller to set cookies using `sendToken` from `src/utils/jwt`.

- Make sure `.env` contains required JWT secrets to prevent startup crash.

- If you want me to, tôi có thể:
  - Generate a complete `test-auth-api.http` file for quick manual testing.
  - Update `login` controller to set cookies using `src/utils/jwt.sendToken` and make responses use `AuthTokens` shape consistently.
  - Implement `refresh-token` endpoint and service logic.

---

## Quick examples (REST Client / cURL)

Login (example response shown):

```http
POST /api/auth/login
Content-Type: application/json

{ "userName": "admin", "password": "secret" }
```

Response body (simplified):

```json
{
  "succeeded": true,
  "data": { "user": { "id": "...", "userName": "admin" }, "tokens": "<access_token>" }
}
```

Logout (requires Authorization header or cookie `token`):

```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

Response: `LOGOUT_SUCCESS` (200)


---

File generated from project sources on: 2025-08-21
