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


# API
A. Auth & Core User (/api/auth & /api/users)

POST /auth/register, /auth/login, /auth/refresh-token ...

GET /users/me: Lấy thông tin profile + Role (Individual/Business/Admin).

PUT /users/me: Cập nhật profile.

GET /users/me/preferences: Lấy cấu hình thông báo (notification_preference).

PUT /users/me/preferences: Cập nhật ngưỡng cảnh báo cá nhân (Mưa/Nhiệt độ/Tắc đường).

GET /users/notifications: Lấy danh sách thông báo đã nhận (noti_event).

PUT /users/notifications/:id/read: Đánh dấu đã đọc.

B. Route & Location Management (/api/routes)

GET /locations: Lấy danh sách saved_location.

POST /locations: Lưu vị trí mới.

GET /routes: Lấy danh sách saved_route.

POST /routes: Tạo tuyến đường mới (Input: Start, End, Waypoints -> Backend tính toán route_segment).

GET /routes/:id: Xem chi tiết một tuyến đường.

GET /routes/:id/analysis: (Quan trọng) Trả về dữ liệu tổng hợp thời tiết + giao thông trên tuyến đường này (Mapping use case "Xem phân tích thời tiết dọc tuyến").

C. Map & Real-time Data (/api/map)

GET /map/traffic: Trả về GeoJSON trạng thái giao thông (các route_segment có màu sắc theo vận tốc/tắc đường).

GET /map/weather-areas: Trả về các vùng thời tiết (weather_area).

GET /map/incidents: Trả về các điểm ngập lụt/tai nạn hiện tại.

D. Prediction & Risk Assessment (/api/analysis)
Logic tính toán rủi ro.

POST /analysis/forecast: Input (Lat, Lng) -> Output: Thời tiết dự báo.

POST /analysis/trip-risk:

Input: { route_id, start_time } hoặc { origin, destination, start_time }.

Output: Risk Level, Suggestion (Lưu vào bảng risk_assessment).

Mapping: Use Case "Lập kế hoạch chuyến đi", "Đánh giá rủi ro".

E. Business Specific Features (/api/business)
Dành riêng cho Business User quản lý chính sách và báo cáo.

GET /business/policies: Xem danh sách alert_policy (Quy định ngưỡng cảnh báo riêng cho đội xe).

POST /business/policies: Tạo policy mới (Ví dụ: Cảnh báo nếu gió > cấp 7 trong khung giờ 8h-17h).

GET /business/dashboard: Số liệu tổng quan (Số xe đang chạy, số cảnh báo đã kích hoạt).

GET /business/reports/weekly: Tải báo cáo PDF tự động.

F. Admin & Response Scenarios (/api/admin)
Quản lý khu vực và kịch bản ứng phó (Runbooks).

GET /admin/areas: CRUD admin_area (Khu vực quản lý).

GET /admin/scenarios: Danh sách kịch bản (response_scenario).

POST /admin/scenarios: Tạo kịch bản mới (VD: Kịch bản chống ngập Q1).

POST /admin/scenarios/:id/items: Thêm checklist_item vào kịch bản.

GET /admin/dashboard: Dashboard tổng quan hệ thống (System health, Active users).