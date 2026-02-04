# JWT Authentication với Role-Based Access Control

Hệ thống đã được tái kiến trúc theo hướng dẫn từ [Corbado - Node.js Express PostgreSQL JWT Authentication with Roles](https://www.corbado.com/blog/nodejs-express-postgresql-jwt-authentication-roles)

## 🎯 Các tính năng đã implement

### ✅ Authentication
- ✅ Đăng ký (Signup) với validation
- ✅ Đăng nhập (Signin) với username/email
- ✅ Đăng nhập qua Google OAuth
- ✅ Đăng xuất (Logout) 
- ✅ Refresh Access Token
- ✅ JWT Token-based authentication

### ✅ Authorization (Role-Based Access Control)
- ✅ Model Role với 3 roles: `user`, `moderator`, `admin`
- ✅ Quan hệ Many-to-Many giữa User và Role
- ✅ Middleware kiểm tra roles: `isAdmin`, `isModerator`, `isModeratorOrAdmin`
- ✅ Protected routes theo role

### ✅ Security Features
- ✅ Password hashing với bcryptjs
- ✅ JWT signing và verification
- ✅ Refresh token với expiration
- ✅ Duplicate email/username checking
- ✅ Role validation

## 📋 Cấu trúc Database

### Bảng mới: `roles`
```sql
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);
```

### Bảng mới: `user_roles` (junction table)
```sql
CREATE TABLE user_roles (
    user_id INTEGER REFERENCES user_account(user_id),
    role_id INTEGER REFERENCES roles(id),
    PRIMARY KEY (user_id, role_id)
);
```

### Cập nhật bảng `user_account`
- Đổi field `role` ENUM thành `account_type` ENUM ('individual', 'business')
- Thêm field `username` (unique, optional)
- Thêm `updated_at` timestamp

## 🚀 Setup & Migration

### 1. Khởi tạo database
```bash
# Tạo các bảng mới (roles, user_roles)
# Cập nhật bảng user_account
```

Bật sync trong `server.js` để tự động tạo bảng:
```javascript
await sequelize.sync({ alter: true }); // Uncomment dòng này
```

### 2. Khởi tạo roles
```bash
# Roles sẽ tự động được tạo khi start server
npm start

# Hoặc chạy script riêng:
node src/config/initial-roles.js
```

### 3. Chạy server
```bash
npm start
# hoặc
npm run dev
```

## 📡 API Endpoints

### Authentication Routes (`/api/auth`)

#### 1. Đăng ký
```http
POST /api/auth/signup
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "accountType": "individual",
  "fullName": "John Doe",
  "roles": ["user"]  // Optional, mặc định là ["user"]
}
```

**Response:**
```json
{
  "message": "User registered successfully!",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "username": "johndoe"
  }
}
```

#### 2. Đăng nhập
```http
POST /api/auth/signin
Content-Type: application/json

{
  "emailOrUsername": "johndoe",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "roles": ["ROLE_USER"],
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6..."
}
```

#### 3. Đăng nhập Google
```http
POST /api/auth/google
Content-Type: application/json

{
  "idToken": "google_id_token_here"
}
```

#### 4. Đăng xuất
```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

#### 5. Refresh Token
```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

### User Routes (`/api/users`)

#### Public Route
```http
GET /api/users/test/all
# Không cần authentication
```

#### User Route
```http
GET /api/users/test/user
Authorization: Bearer <access_token>
# Cần authentication, bất kỳ user nào đã login
```

#### Moderator Route
```http
GET /api/users/test/mod
Authorization: Bearer <access_token>
# Cần role: moderator
```

#### Admin Route
```http
GET /api/users/test/admin
Authorization: Bearer <access_token>
# Cần role: admin
```

## 🔐 Cách sử dụng JWT Token

### 1. Lấy token từ response khi login
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Thêm token vào header
**Cách 1: Bearer Token (Recommended)**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Cách 2: x-access-token**
```http
x-access-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 👥 Role Management

### Gán role khi đăng ký
```json
{
  "email": "admin@example.com",
  "password": "AdminPass123",
  "roles": ["admin", "moderator"]  // Có thể gán nhiều roles
}
```

### Roles hiện có
- `user`: Người dùng thường
- `moderator`: Người quản lý nội dung
- `admin`: Quản trị viên hệ thống

### Kiểm tra role trong middleware
```javascript
// Chỉ admin
router.get('/admin-only', [authJwt.verifyToken, authJwt.isAdmin], controller);

// Chỉ moderator
router.get('/mod-only', [authJwt.verifyToken, authJwt.isModerator], controller);

// Moderator hoặc Admin
router.get('/mod-or-admin', [authJwt.verifyToken, authJwt.isModeratorOrAdmin], controller);
```

## 🧪 Testing với Postman/Insomnia

### 1. Đăng ký user thường
```json
POST /api/auth/signup
{
  "username": "user1",
  "email": "user1@test.com",
  "password": "Pass123",
  "accountType": "individual",
  "fullName": "User One"
}
```

### 2. Đăng ký admin
```json
POST /api/auth/signup
{
  "username": "admin",
  "email": "admin@test.com",
  "password": "AdminPass123",
  "accountType": "individual",
  "fullName": "Admin User",
  "roles": ["admin", "user"]
}
```

### 3. Login và lấy token
```json
POST /api/auth/signin
{
  "emailOrUsername": "admin",
  "password": "AdminPass123"
}
```

### 4. Test protected routes
```http
# Public - OK
GET /api/users/test/all

# User - Cần login
GET /api/users/test/user
Authorization: Bearer <token>

# Admin - Chỉ admin mới truy cập được
GET /api/users/test/admin
Authorization: Bearer <admin_token>
```

## 🔧 Cấu hình môi trường (.env)

```env
# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=24h

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=weather_traffic
DB_USER=postgres
DB_PASS=your_password

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
```

## 📚 Files đã thay đổi/tạo mới

### Tạo mới:
- `src/models/role.model.js` - Model cho Role
- `src/middleware/verifySignUp.js` - Middleware validate đăng ký
- `src/config/initial-roles.js` - Script khởi tạo roles

### Cập nhật:
- `src/models/user.model.js` - Thêm quan hệ với Role, username field
- `src/middleware/auth.middleware.js` - Thêm role checking (isAdmin, isModerator)
- `src/services/auth.service.js` - Cập nhật logic authentication với roles
- `src/controllers/auth.controller.js` - Thêm signup, signin, logout
- `src/routes/auth.routes.js` - Cập nhật routes với middleware
- `src/routes/user.routes.js` - Thêm test routes cho role-based access
- `src/controllers/user.controller.js` - Thêm demo controllers
- `src/server.js` - Tự động khởi tạo roles khi start

## ⚠️ Migration Notes

### Từ hệ thống cũ sang mới:

1. **Database changes:**
   - Bảng `user_account`: Đổi field `role` → `account_type`
   - Thêm bảng `roles`
   - Thêm bảng `user_roles`
   - Thêm field `username` vào `user_account`

2. **API changes:**
   - `/api/auth/register` → `/api/auth/signup`
   - `/api/auth/login` → `/api/auth/signin`
   - Login request body: `email` → `emailOrUsername`
   - Response format thay đổi (thêm roles array)

3. **Code changes:**
   - Middleware: `authMiddleware` → `authJwt.verifyToken`
   - Token payload: Thêm `roles` array
   - User model: Thay `user.role` → `user.account_type` + `user.getRoles()`

## 🎉 Kết quả

Bạn đã có một hệ thống authentication hoàn chỉnh với:
- ✅ JWT-based authentication
- ✅ Role-based authorization
- ✅ Secure password hashing
- ✅ Token refresh mechanism
- ✅ Google OAuth integration
- ✅ Protected routes theo roles
- ✅ Validation và error handling

## 📖 Tài liệu tham khảo
- [Corbado - Node.js Express PostgreSQL JWT Authentication with Roles](https://www.corbado.com/blog/nodejs-express-postgresql-jwt-authentication-roles)
