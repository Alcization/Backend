# Web Service Backend

Backend này được xây dựng bằng Express.js, kết nối PostgreSQL qua Sequelize, và tự khởi tạo role khi khởi động thành công.

## Tổng quan

Ứng dụng được tổ chức theo mô hình quen thuộc:

```text
src/
├── config/
├── controllers/
├── helpers/
├── middleware/
├── models/
├── routes/
├── services/
├── utils/
├── app.js
└── server.js
```

Các route hiện có được gắn dưới prefix `/api`:

- `/api/auth`
- `/api/users`
- `/api/predictions`
- `/api/map`
- `/api/business`
- `/api/admin`
- `/api/routes`
- `/api/analysis`
- `/api/response-scenarios`
- `/api/weather`

Ngoài ra còn có 2 endpoint kiểm tra trạng thái triển khai:

- `GET /healthz`
- `GET /readyz`

## Yêu cầu môi trường

- Node.js 18+ là khuyến nghị
- PostgreSQL 16+ hoặc một PostgreSQL tương thích
- npm

## Cài đặt

```bash
npm install
```

## Biến môi trường

Tạo file `.env` ở thư mục gốc và cấu hình tối thiểu:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=change_me

DB_HOST=localhost
DB_PORT=4567
DB_NAME=weather_traffic
DB_USER=postgres
DB_PASS=admin
DB_DIALECT=postgres

# Tùy chọn
DB_SSL=false
ALLOW_START_WITHOUT_DB=false
EXTERNAL_DATABASE_URL=
DATABASE_URL=
```

Nếu bạn dùng PostgreSQL bên ngoài, có thể đặt `EXTERNAL_DATABASE_URL` hoặc `DATABASE_URL` thay cho bộ `DB_*`.

## Chạy cục bộ

```bash
npm start
```

Chế độ phát triển:

```bash
npm run dev
```

Khi khởi động, server sẽ:

1. Kết nối database
2. Khởi tạo các role mặc định
3. Lắng nghe HTTP trên `PORT` hoặc mặc định `3000`

## Chạy bằng Docker Compose

```bash
docker compose up --build
```

Trong `docker-compose.yml`, service `app` sẽ kết nối tới PostgreSQL bằng các giá trị sau:

- `DB_HOST=db`
- `DB_PORT=5432`
- `DB_NAME=weather_traffic`
- `DB_USER=postgres`
- `DB_PASS=admin`

Port được publish ra máy host:

- API: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

## Chạy image riêng lẻ

```bash
docker build -t web-service-backend .
docker run --rm -p 3000:3000 --env-file .env web-service-backend
```

Với cách này, bạn cần tự cung cấp một PostgreSQL bên ngoài và cấu hình lại `DB_HOST`/`DB_PORT` hoặc dùng `EXTERNAL_DATABASE_URL`.

## Tài liệu API

- `swagger.yaml` chứa đặc tả Swagger/OpenAPI của backend
- `API_DOCUMENTATION.md` và các file phân tích đi kèm dùng để tham khảo nghiệp vụ và phản hồi API

## Ghi chú

- `GET /healthz` không phụ thuộc database, dùng để kiểm tra process còn sống
- `GET /readyz` phản ánh trạng thái kết nối database
- `ALLOW_START_WITHOUT_DB=true` cho phép service vẫn khởi động ở chế độ degraded nếu database tạm thời không truy cập được
