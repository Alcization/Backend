                               +-------------------------+
                               |     CLIENT (Browser/    |
                               |      Mobile App)        |
                               +-----------+-------------+
                                           |
                                           |
                                           v
+--------------------------------------------------------------------------------------+
|                                       BACKEND                                        |
|                                                                                      |
|    +-------------------------+                                                       |
|    |  API GATEWAY (NGINX)    |                                                       |
|    | (SSL, Load Balancing)   |                                                       |
|    +-----------+-------------+                                                       |
|                |                                                                     |
|      +---------+----------------------------+                                        |
|      | (REST API)                           | (REST API)                             |
|      v                                      v                                        |
| +----+--------------+                   +----+-------------------+                   |
| | DỊCH VỤ WEB       |                   | DỊCH VỤ AI (Real-time) |                   |
| | (Core API)        |                   | (FastAPI)              |                   |
| | - Node.js         |                   | - Đọc dữ liệu dự đoán  |                   |
| | - Quản lý user    |                   +------------------------+                   |
| | - Logic nghiệp vụ |                                                                |
| +-------+----------+                                                                 |
|         |                                                                            |
|         | (Đọc/Ghi Dữ liệu)                                                          |
|         v                                                                            |
| +-------+-----------+                +-------------------+                           |
| | DATABASE          +--------------> | MESSAGE QUEUE     |<----(Lắng nghe Task)---+  |
| | - Kết quả dự đoán |                | (Redis / RabbitMQ)|                        |  |
| | - Users, lịch sử  |                +-------------------+                        |  |
| +-------------------+                     | (Nhận Task)                           |  |
|                                           v                                       |  |
|                                   +-------+----------------+                      |  |
|                                   | AI WORKER (Async)      |                      |  |
|                                   | (Celery + Keras)       |                      |  |
|                                   | - Tải model .h5        |----------------------+  |
|                                   | - Xử lý dự đoán        |     (Lưu kết quả)       |
|                                   | - (Cần GPU)            |         |               |
|                                   +------------------------+         |               |
|                                           |                          v               |
|                                           +---------------------> (DATABASE)         |
|                                                                                      |
+--------------------------------------------------------------------------------------+

# DỊCH VỤ WEB (EXPRESS.JS)
/web-service/
├── node_modules/
├── src/
│   ├── routes/             
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── prediction.routes.js
│   │   └── index.js
│   │
│   ├── config/             # Chứa các file cấu hình
│   │   ├── config.js
│   │   ├── database.js
│   │   └── redis.js
│   │
│   ├── controllers/        # Xử lý logic request/response
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   └── prediction.controller.js
│   │
│   ├── helpers/            # Các hàm cần cho các tác vụ đặc biệt     
│   │   ├── sendMail.js
│   │   └── createOTP.js
│   │ 
│   ├── services/           # Xử lý logic nghiệp vụ
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   └── ai.service.js
│   │
│   ├── models/             # Định nghĩa cấu trúc của database
│   │   ├── user.model.js
│   │   ├── prediction.model.js
│   │   └── index.js
│   │
│   ├── middleware/         # Các hàm xử lý trung gian
│   │   ├── auth.middleware.js
│   │   ├── error.handler.js
│   │   └── request.logger.js
│   │
│   ├── utils/              # Các hàm tiện ích dùng chung
│   │   ├── logger.js
│   │   └── asyncHandler.js
│   │ 
│   ├── app.js
│   └── server.js
│
├── .env
├── .env.example
├── .gitignore
├── Dockerfile              # File để build Docker image nếu dùng docker
├── package.json
└── package-lock.json

# DỊCH VỤ AI
/ai_service
|-- /model
|   |-- convlstm_model.h5
|-- app.py
|-- requirements.txt


# 🔐 AUTHENTICATION & AUTHORIZATION

**Hệ thống đã được tái kiến trúc với JWT Authentication và Role-Based Access Control**

📖 **Chi tiết:** Xem [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md)

## Tính năng chính:
- ✅ JWT Token-based Authentication
- ✅ Role-Based Access Control (User, Moderator, Admin)
- ✅ Secure password hashing (bcryptjs)
- ✅ Refresh token mechanism
- ✅ Google OAuth integration
- ✅ Protected routes theo roles

## Quick Start:

Database: https://drive.google.com/file/d/1vXGOifugsELpbw-GvOac-VX2-LcbfgMP/view?usp=sharing

### 1. Khởi động server
```bash
npm install
npm start
# Roles sẽ tự động được khởi tạo
```

