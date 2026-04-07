# API Documentation - Weather Traffic Backend

Base URL: `http://localhost:3000`

## Table of Contents

- [Authentication](#authentication)
- [User Profile](#user-profile)
- [User Preferences](#user-preferences)
- [Notifications](#notifications)
- [Report Schedules](#report-schedules)
- [Route &amp; Location Management](#route--location-management)
- [Prediction &amp; Risk Assessment](#prediction--risk-assessment)
- [Map &amp; Real-time Data](#map--real-time-data)
- [Business Features](#business-features)
- [Admin &amp; Response Scenarios](#admin--response-scenarios)
- [Alert Events Management](#alert-events-management)
- [User Response Scenarios](#user-response-scenarios)
- [Error Handling](#error-handling)

---

## Authentication

### Register User

Create a new user account (Individual or Business) with role assignment.

**Endpoint:** `POST /api/auth/signup`

**Request Body:**

```json
{
  "username": "johndoe",
  "email": "user@example.com",
  "password": "securePassword123",
  "accountType": "individual",
  "fullName": "John Doe",
  "roles": ["user"]
}
```

**Field Descriptions:**

- `username` (optional): Unique username for login
- `email` (required): User's email address
- `password` (required): User's password (will be hashed)
- `accountType` (optional): `"individual"` or `"business"` (default: `"individual"`)
- `fullName` (required for individual): Full name of the user
- `companyName` (required for business): Company name
- `taxCode` (optional for business): Business tax code
- `roles` (optional): Array of roles to assign (default: `["user"]`)
  - Available roles: `"user"`, `"moderator"`, `"admin"`

**Response:** `201 Created`

```json
{
  "message": "User registered successfully!",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe"
  }
}
```

---

### Login with Email/Password or Username

Authenticate using email or username with password.

**Endpoint:** `POST /api/auth/signin`

**Request Body:**

```json
{
  "emailOrUsername": "johndoe",
  "password": "securePassword123"
}
```

**Field Descriptions:**

- `emailOrUsername` (required): User's email address or username
- `password` (required): User's password

**Response:** `200 OK`

```json
{
  "id": 1,
  "username": "johndoe",
  "email": "user@example.com",
  "roles": ["user"],
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6..."
}
```

---

### Login with Google

Authenticate using Google OAuth ID token.

**Endpoint:** `POST /api/auth/google`

**Request Body:**

```json
{
  "idToken": "google_id_token_from_frontend"
}
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "username": null,
  "email": "user@gmail.com",
  "roles": ["user"],
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6..."
}
```

---

### Logout

Logout user and invalidate refresh token.

**Endpoint:** `POST /api/auth/logout`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "message": "Logged out successfully"
}
```

---

### Refresh Access Token

Generate a new access token using refresh token.

**Endpoint:** `POST /api/auth/refresh-token`

**Request Body:**

```json
{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Response:** `200 OK`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Send OTP to Email

Generate and send a 6-digit OTP code to the provided email.

**Endpoint:** `POST /api/auth/send-otp`

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Field Descriptions:**

- `email` (required): Target email to receive OTP

**Response:** `200 OK`

```json
{
  "message": "OTP sent successfully"
}
```

**Notes:**

- OTP has a validity period of 5 minutes.
- If an email requests OTP multiple times, only the newest OTP is valid.

---

### Verify OTP

Verify OTP code for an email.

**Endpoint:** `POST /api/auth/verify-otp`

**Request Body:**

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Field Descriptions:**

- `email` (required): Email that received OTP
- `code` (required): 6-digit OTP code

**Response:** `200 OK`

```json
{
  "message": "OTP verified successfully",
  "ok": true
}
```

**Common Error Cases:**

- `400 Bad Request`: `Invalid OTP`
- `400 Bad Request`: `OTP expired`

---

### Reset Password by Email

Update account password using email and new password.

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**

```json
{
  "email": "user@example.com",
  "newPassword": "NewPass123"
}
```

**Field Descriptions:**

- `email` (required): Account email
- `newPassword` (required): New password (minimum 6 characters)

**Response:** `200 OK`

```json
{
  "message": "Password updated successfully"
}
```

**Common Error Cases:**

- `400 Bad Request`: `Email and newPassword are required`
- `400 Bad Request`: `newPassword must be at least 6 characters`
- `404 Not Found`: `User not found`

---

### Using JWT Token for Protected Routes

Include the access token in request headers using one of these methods:

**Method 1: Bearer Token (Recommended)**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Method 2: x-access-token Header**

```
x-access-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## User Profile

### Get Current User Profile

**Endpoint:** `GET /api/users/me`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
    "user_id":1,
    "email": "john123@example.com",
    "username": "johndoe123",
    "account_type": "individual",
    "status": "active",
    "created_at": "2026-03-01T23:50:55.945Z",
    "updated_at": "2026-03-01T23:50:55.945Z",
    "IndividualUser": {
        "individual_id": 8,
        "full_name": "John Doe",
        "user_id": 21
    },
    "BusinessUser": null
}
```

---

### Update User Profile

**Endpoint:** `PUT /api/users/me`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "phone_number": "+84901234567",
  "language": "en",
  "full_name": "John Smith"
}
```

---

## User Preferences

### Get Notification Preferences

**Endpoint:** `GET /api/users/me/preferences`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
[
  {
    "pref_id": 1,
    "user_id": 1,
    "noti_type": "Traffic",
    "threshold": 5
  }
]
```

---

### Update Notification Preference

**Endpoint:** `PUT /api/users/me/preferences`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "noti_type": "Traffic",
  "threshold": 7
}
```

---

## Notifications

### Get User Notifications

**Endpoint:** `GET /api/users/notifications`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Query Parameters:**

- `limit` (optional): Maximum number of notifications (default: 50)

**Response:** `200 OK`

```json
[
    {
        "noti_event_id": 8,
        "user_id": 21,
        "name": "Canh bao mua lon",
        "description": "Mua lon tai khu vuc Quan 1",
        "type": "Warning",
        "issue_at": "2026-02-20T17:42:30.113Z",
        "is_read": false
    }
]
```

---

### Mark Notification as Read

**Endpoint:** `PUT /api/users/notifications/:id/read`

**Headers:**

```
Authorization: Bearer <access_token>
```

---

## Report Schedules

### Save Report Schedule

Create or update periodic report delivery schedule for the authenticated user.

**Endpoint:** `POST /api/users/me/report-schedules`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "type": "weekly",
  "day": 2,
  "name": "Thời tiết",
  "email": "receiver@example.com"
}
```

**Field Descriptions:**

- `type` (required): `weekly` or `monthly`
- `day` (required, integer):
  - If `type = monthly`: from `1` to `31`
  - If `type = weekly`: from `2` to `8` (`2 = Monday`, `8 = Sunday`)
- `name` (optional, nullable): Report type name. Can be `null` for business report or a specific value such as `Thời tiết`, `Cảnh báo`, `Sự cố`
- `email` (required): Receiver email address

**Responses:**

- `201 Created`: When user has no schedule yet and a new record is created
- `200 OK`: When user already has a schedule and the existing record is updated

```json
{
  "id": 1,
  "user_id": 21,
  "type": "weekly",
  "day": 2,
  "name": "Thời tiết",
  "email": "receiver@example.com"
}
```

**Common Error Cases:**

- `400 Bad Request`: `type is required and must be weekly or monthly`
- `400 Bad Request`: `day must be from 1 to 31 for monthly schedule`
- `400 Bad Request`: `day must be from 2 to 8 for weekly schedule (2=Monday, 8=Sunday)`
- `400 Bad Request`: `email is required and must be a valid email`

---

### Get Report Schedules

Get periodic report schedules of the authenticated user.

**Endpoint:** `GET /api/users/me/report-schedules`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Query Parameters:**

- `type` (optional): Filter schedules by `weekly` or `monthly`

**Response:** `200 OK`

```json
[
  {
    "id": 2,
    "user_id": 21,
    "type": "monthly",
    "day": 15,
    "name": null,
    "email": "ceo@company.com"
  },
  {
    "id": 1,
    "user_id": 21,
    "type": "weekly",
    "day": 2,
    "name": "Cảnh báo",
    "email": "receiver@example.com"
  }
]
```

**Common Error Cases:**

- `400 Bad Request`: `type must be weekly or monthly`

---

## Route & Location Management

### Get Saved Locations

Get all saved locations for the authenticated user.

**Endpoint:** `GET /api/routes/locations`

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "location_id": 1,
      "user_id": 1,
      "custom_name": "Home",
      "address": "123 Main St, District 1, HCMC",
      "latitude": 10.7769,
      "longitude": 106.7009,
      "created_at": "2025-11-27T10:00:00.000Z"
    },
    {
      "location_id": 2,
      "custom_name": "Office",
      "address": "456 Business Ave, District 2",
      "latitude": 10.8050,
      "longitude": 106.7200
    }
  ]
}
```

---

### Save Location

Save a new favorite location.

**Endpoint:** `POST /api/routes/locations`

**Authentication:** Required

**Request Body:**

```json
{
  "custom_name": "Coffee Shop",
  "address": "789 Coffee St, District 3",
  "latitude": 10.7800,
  "longitude": 106.6900
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "location_id": 3,
    "user_id": 1,
    "custom_name": "Coffee Shop",
    "address": "789 Coffee St, District 3",
    "latitude": 10.7800,
    "longitude": 106.6900,
    "created_at": "2025-11-27T12:00:00.000Z"
  }
}
```

---

### Update Saved Location

Update an existing favorite location of the authenticated user.

**Endpoint:** `PUT /api/routes/locations/:id`

**Authentication:** Required

**Request Body:**

```json
{
  "custom_name": "Gym",
  "address": "999 Fitness St, District 7",
  "latitude": 10.7300,
  "longitude": 106.7100
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "location_id": 3,
    "user_id": 1,
    "custom_name": "Gym",
    "address": "999 Fitness St, District 7",
    "latitude": 10.7300,
    "longitude": 106.7100
  }
}
```

---

### Delete Saved Location

Delete a saved location of the authenticated user.

**Endpoint:** `DELETE /api/routes/locations/:id`

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Location deleted successfully"
}
```

---

### Get Saved Routes

Get all saved routes for the authenticated user.

**Endpoint:** `GET /api/routes`

**Alias Endpoint:** `GET /api/routes/favorites`

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "route_id": 1,
      "user_id": 1,
      "name": "Đường đi làm",
      "start_point": {
        "lat": 10.7769,
        "lng": 106.7009
      },
      "end_point": {
        "lat": 10.805,
        "lng": 106.72
      },
      "start_address": "123 Lê Lợi, Quận 1",
      "end_address": "456 Điện Biên Phủ, Bình Thạnh",
      "distance": 12.5,
      "waypoints": [
        {"lat": 10.7850, "lng": 106.7100},
        {"lat": 10.7950, "lng": 106.7150}
      ]
    }
  ]
}
```

---

### Create Route

Create and save a new route with start, end, and optional waypoints.

**Endpoint:** `POST /api/routes`

**Alias Endpoint:** `POST /api/routes/favorites`

**Authentication:** Required

**Request Body:**

```json
{
  "name": "Đường đi làm",
  "start_point": {
    "lat": 10.7769,
    "lng": 106.7009
  },
  "end_point": {
    "lat": 10.8050,
    "lng": 106.7200
  },
  "start_address": "123 Lê Lợi, Quận 1",
  "end_address": "456 Điện Biên Phủ, Bình Thạnh",
  "waypoints": [
    {"lat": 10.7850, "lng": 106.7100}
  ],
  "distance": 12.5
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "route_id": 2,
    "user_id": 1,
    "name": "Đường đi làm",
    "start_point": {
      "lat": 10.7769,
      "lng": 106.7009
    },
    "end_point": {
      "lat": 10.805,
      "lng": 106.72
    },
    "start_address": "123 Lê Lợi, Quận 1",
    "end_address": "456 Điện Biên Phủ, Bình Thạnh",
    "waypoints": [
      {"lat": 10.785, "lng": 106.71}
    ],
    "distance": 12.5
  }
}
```

---

### Get Route Details

Get detailed information about a specific route including segments.

**Endpoint:** `GET /api/routes/:id`

**Alias Endpoint:** `GET /api/routes/favorites/:id`

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "route_id": 2,
    "name": "Home to Office",
    "distance": 12.5,
    "waypoints": [
      {"lat": 10.7850, "lng": 106.7100}
    ],
    "segments": [
      {
        "segment_id": 101,
        "order_in_route": 1,
        "start_point": {"type": "Point", "coordinates": [106.7009, 10.7769]},
        "end_point": {"type": "Point", "coordinates": [106.7100, 10.7850]}
      },
      {
        "segment_id": 102,
        "order_in_route": 2,
        "start_point": {"type": "Point", "coordinates": [106.7100, 10.7850]},
        "end_point": {"type": "Point", "coordinates": [106.7200, 10.8050]}
      }
    ]
  }
}
```

---

### Update Favorite Route

Update an existing favorite route by id.

**Endpoint:** `PUT /api/routes/favorites/:id`

**Authentication:** Required

**Request Body (all fields optional, but at least one is required):**

```json
{
  "name": "Đường đi làm mới",
  "start_point": {
    "lat": 10.7769,
    "lng": 106.7009
  },
  "end_point": {
    "lat": 10.807,
    "lng": 106.723
  },
  "start_address": "123 Lê Lợi, Quận 1",
  "end_address": "789 Nguyễn Hữu Cảnh, Bình Thạnh",
  "waypoints": [
    {"lat": 10.79, "lng": 106.712}
  ],
  "distance": 13.2
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "route_id": 2,
    "user_id": 1,
    "name": "Đường đi làm mới",
    "start_point": {
      "lat": 10.7769,
      "lng": 106.7009
    },
    "end_point": {
      "lat": 10.807,
      "lng": 106.723
    },
    "start_address": "123 Lê Lợi, Quận 1",
    "end_address": "789 Nguyễn Hữu Cảnh, Bình Thạnh",
    "waypoints": [
      {"lat": 10.79, "lng": 106.712}
    ],
    "distance": 13.2
  }
}
```

---

### Delete Favorite Route

Delete a favorite route by id.

**Endpoint:** `DELETE /api/routes/favorites/:id`

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Route deleted successfully"
}
```

---

### Save Route Search History

Save a route search action for the authenticated user.

**Endpoint:** `POST /api/routes/history`

**Authentication:** Required

**Request Body:**

```json
{
  "origin": "Bến Thành Market",
  "destination": "Tân Sơn Nhất Airport",
  "weather_status": "Light Rain",
  "time": "2026-03-23T08:30:00+07:00"
}
```

Notes:

- `time` is optional. If omitted, server will use current timestamp.
- `origin` and `destination` are required (route place names).

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "trip_id": 15,
    "user_id": 1,
    "origin": "Bến Thành Market",
    "destination": "Tân Sơn Nhất Airport",
    "weather_status": "Light Rain",
    "time": "2026-03-23T01:30:00.000Z"
  }
}
```

---

### Get Route Search History

Get route search history of the authenticated user (newest first).

**Endpoint:** `GET /api/routes/history`

**Authentication:** Required

**Response:** `200 OK`

```json
{
    "success": true,
    "data": [
        {
            "trip_id": 2,
            "user_id": 15,
            "origin": "Phường Đông Hòa,Thành Phố Dĩ An,Tỉnh Bình Dương",
            "destination": "Suối Tiên Depot Phường Long Bình,Thành Phố Hồ Chí Minh",
            "time": "2026-03-23T01:30:00.000Z",
            "weather_status": "Nhiều Mây"
        },
        {
            "trip_id": 1,
            "user_id": 15,
            "origin": "Phường Đông Hòa,Thành Phố Dĩ An,Tỉnh Bình Dương",
            "destination": "Chợ Bến Thành Phường Bến Thành,Thành Phố Hồ Chí Minh",
            "time": "2026-03-23T01:30:00.000Z",
            "weather_status": "Mưa"
        }
    ]
}
```

---

### Save Weather Search History

Save a weather search action at a location for the authenticated user.

**Endpoint:** `POST /api/routes/weather-history`

**Authentication:** Required

**Request Body:**

```json
{
  "location": "Phường Đông Hòa,Thành Phố Dĩ An,Tỉnh Bình Dương",
  "weather_status": "Mưa",
  "temp": 28,
  "time": "2026-03-23T18:15:00+07:00"
}
```

Notes:

- `location` is required (location name/address where weather was checked).
- `weather_status` and `temp` are optional.
- `time` is optional. If omitted, server will use current timestamp.
- `temp` must be an integer value.

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "location_id": 42,
    "user_id": 1,
    "location": "Phường Đông Hòa,Thành Phố Dĩ An,Tỉnh Bình Dương",
    "weather_status": "Mưa",
    "temp": 28,
    "time": "2026-03-23T11:15:00.000Z"
  }
}
```

---

### Get Weather Search History

Get weather search history of the authenticated user (newest first).

**Endpoint:** `GET /api/routes/weather-history`

**Authentication:** Required

**Response:** `200 OK`

```json
{
    "success": true,
    "data": [
        {
            "location_id": 1,
            "user_id": 15,
            "location": "Phường Đông Hòa,Thành Phố Dĩ An,Tỉnh Bình Dương",
            "time": "2026-03-23T11:15:00.000Z",
            "weather_status": "Mưa",
            "temp": 28
        }
    ]
}
```

---

### Get Route Analysis

Get comprehensive weather and traffic analysis along a specific route. **This is the key endpoint for trip planning.**

**Endpoint:** `GET /api/routes/:id/analysis`

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "route_id": 2,
    "route_name": "Home to Office",
    "segments": [
      {
        "segment_id": 101,
        "order": 1,
        "start_point": {"type": "Point", "coordinates": [106.7009, 10.7769]},
        "end_point": {"type": "Point", "coordinates": [106.7100, 10.7850]},
        "traffic": {
          "velocity": 45.5,
          "state": "B",
          "time": "2025-11-27T14:00:00.000Z"
        }
      },
      {
        "segment_id": 102,
        "order": 2,
        "traffic": {
          "velocity": 28.3,
          "state": "D",
          "time": "2025-11-27T14:00:00.000Z"
        }
      }
    ],
    "weather_areas": [
      {
        "area_id": 1,
        "name": "District 1",
        "center_point": {"type": "Point", "coordinates": [106.7009, 10.7769]},
        "current_weather": {
          "temp": 32.5,
          "feelslike": 35.2,
          "humidity": 72.5,
          "precip": 0.5,
          "precipprob": 30.5,
          "windspeed": 12.3,
          "conditions": "Partly cloudy",
          "icon": "partly-cloudy-day"
        }
      }
    ],
    "summary": {
      "average_velocity": 36.9,
      "average_precipitation": 0.5,
      "traffic_status": "Moderate",
      "weather_status": "Light Rain"
    }
  }
}
```

**Example:**

```bash
curl -X GET http://localhost:3000/api/routes/2/analysis \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Prediction & Risk Assessment

### Get Weather Forecast

Get weather forecast for a specific location (next 7 days).

**Endpoint:** `GET /api/analysis/forecast?lat={lat}&lng={lng}`

**Authentication:** Required

**Query Parameters:**

- `lat` (required): Latitude
- `lng` (required): Longitude

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "location": {"lat": 10.7769, "lng": 106.7009},
    "area": {
      "area_id": 1,
      "name": "District 1",
      "distance": 450.5
    },
    "forecasts": [
      {
        "datetime": "2025-11-27T15:00:00.000Z",
        "temp": 33.2,
        "tempmax": 35.0,
        "tempmin": 30.5,
        "humidity": 70.0,
        "precip": 1.2,
        "precipprob": 45.0,
        "windspeed": 15.3,
        "winddir": 180.0,
        "conditions": "Rain showers",
        "icon": "rain"
      },
      {
        "datetime": "2025-11-27T16:00:00.000Z",
        "temp": 32.8,
        "humidity": 75.0,
        "precip": 2.5,
        "precipprob": 60.0,
        "conditions": "Moderate rain"
      }
    ]
  }
}
```

**Example:**

```bash
curl -X GET "http://localhost:3000/api/analysis/forecast?lat=10.7769&lng=106.7009" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### Assess Trip Risk

Assess risk level for a planned trip based on weather and traffic conditions. **This is the key endpoint for trip safety assessment.**

**Endpoint:** `POST /analysis/assess-risk`

**Authentication:** Required

**Request Body (Option 1 - Using saved route):**

```json
{
  "route_id": 2,
  "start_time": "2025-11-27T16:00:00Z",
  "trip_id": 10
}
```

**Request Body (Option 2 - Using coordinates):**

```json
{
  "origin": {
    "lat": 10.7769,
    "lng": 106.7009
  },
  "destination": {
    "lat": 10.8050,
    "lng": 106.7200
  },
  "start_time": "2025-11-27T16:00:00Z"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "assessment_id": 15,
    "route": "Home to Office",
    "departure_time": "2025-11-27T16:00:00.000Z",
    "risk_level": "Medium",
    "score": 12.5,
    "weather_risk": {
      "level": "Medium",
      "score": 15.0,
      "factors": [
        "Moderate rain expected (60% probability)",
        "Strong winds (35 km/h)"
      ]
    },
    "traffic_risk": {
      "level": "Low",
      "score": 8.5,
      "factors": [
        "Slow traffic"
      ]
    },
    "risk_factors": [
      "Moderate rain expected (60% probability)",
      "Strong winds (35 km/h)",
      "Slow traffic"
    ],
    "suggestions": [
      "Check weather updates before departure",
      "Drive with extra caution due to weather conditions",
      "Allow extra time for your journey",
      "Ensure your vehicle has good tire tread",
      "Use headlights and reduce speed in rain"
    ]
  }
}
```

**Risk Levels:**

- `Low`: Score 0-7 - Favorable conditions
- `Medium`: Score 8-14 - Moderate caution advised
- `High`: Score 15-24 - Significant risk, extra precautions needed
- `Critical`: Score 25+ - Consider postponing trip

**Example:**

```bash
curl -X POST http://localhost:3000/api/analysis/assess-risk \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "route_id": 2,
    "start_time": "2025-11-27T16:00:00Z"
  }'
```

---

## Map & Real-time Data

### Get Traffic Data

Get real-time traffic data in GeoJSON format with color-coded segments based on traffic conditions.

**Endpoint:** `GET /map/traffic`

**Authentication:** Not required (public endpoint)

**Response:** `200 OK`

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [106.6297, 10.8231],
          [106.6302, 10.8245]
        ]
      },
      "properties": {
        "segment_id": 1,
        "velocity": 45.5,
        "traffic_state": "B",
        "color": "#7fff00",
        "time_reading": "2025-11-27T10:30:00.000Z",
        "description": "Reasonably free flow"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [106.6302, 10.8245],
          [106.6310, 10.8260]
        ]
      },
      "properties": {
        "segment_id": 2,
        "velocity": 15.2,
        "traffic_state": "E",
        "color": "#ff4500",
        "time_reading": "2025-11-27T10:30:00.000Z",
        "description": "Unstable flow"
      }
    }
  ]
}
```

**Traffic State (LOS - Level of Service):**

- `A` - Free flow (Green: #00ff00)
- `B` - Reasonably free flow (Light green: #7fff00)
- `C` - Stable flow (Yellow: #ffff00)
- `D` - Approaching unstable flow (Orange: #ffa500)
- `E` - Unstable flow (Red-orange: #ff4500)
- `F` - Forced or breakdown flow (Red: #ff0000)

**Usage:**

- Display on map with color-coded road segments
- Velocity in km/h
- Use `color` property directly for rendering

---

### Get Weather Areas

Get weather area information with current weather data.

**Endpoint:** `GET /map/weather-areas`

**Authentication:** Not required (public endpoint)

**Response:** `200 OK`

```json
[
  {
    "area_id": 1,
    "name": "District 1",
    "center_point": {
      "type": "Point",
      "coordinates": [106.7008, 10.7769]
    },
    "weather": {
      "time": "2025-11-27T10:00:00.000Z",
      "temp": 32.5,
      "feelslike": 38.2,
      "humidity": 75.0,
      "precip": 2.5,
      "precipprob": 60.0,
      "preciptype": "rain",
      "windspeed": 15.0,
      "windgust": 25.0,
      "winddir": 180.0,
      "cloudcover": 80.0,
      "visibility": 8.5,
      "uvindex": 7.0,
      "conditions": "Partly Cloudy",
      "icon": "partly-cloudy-day"
    }
  },
  {
    "area_id": 2,
    "name": "District 3",
    "center_point": {
      "type": "Point",
      "coordinates": [106.6820, 10.7860]
    },
    "weather": {
      "time": "2025-11-27T10:00:00.000Z",
      "temp": 31.8,
      "feelslike": 37.0,
      "humidity": 72.0,
      "precip": 0.0,
      "precipprob": 20.0,
      "preciptype": null,
      "windspeed": 12.0,
      "windgust": 20.0,
      "winddir": 160.0,
      "cloudcover": 50.0,
      "visibility": 10.0,
      "uvindex": 8.0,
      "conditions": "Clear",
      "icon": "clear-day"
    }
  }
]
```

**Weather Fields:**

- `temp` - Temperature in Celsius
- `feelslike` - Feels like temperature in Celsius
- `humidity` - Humidity percentage (0-100)
- `precip` - Precipitation in mm
- `precipprob` - Precipitation probability (0-100)
- `preciptype` - Type of precipitation (rain, snow, etc.)
- `windspeed` - Wind speed in km/h
- `windgust` - Wind gust speed in km/h
- `winddir` - Wind direction in degrees (0-360)
- `cloudcover` - Cloud cover percentage (0-100)
- `visibility` - Visibility in km
- `uvindex` - UV index (0-11+)
- `conditions` - Weather condition description
- `icon` - Weather icon identifier

**Usage:**

- Display weather overlays on map
- Show weather data for specific areas
- Create weather-based route warnings

---

### Get Incidents

Get current incidents (floods, accidents, road closures) in GeoJSON format.

**Endpoint:** `GET /map/incidents`

**Authentication:** Not required (public endpoint)

**Response:** `200 OK`

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [106.6297, 10.8231]
      },
      "properties": {
        "incident_id": 1,
        "name": "Severe Flooding on Nguyen Hue Street",
        "type": "Flood",
        "description": "Water level 50cm, road temporarily closed",
        "severity": "High",
        "issue_at": "2025-11-27T09:30:00.000Z",
        "icon": "water",
        "color": "#ff4500"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [106.7008, 10.7769]
      },
      "properties": {
        "incident_id": 2,
        "name": "Traffic Accident on Highway 1",
        "type": "Accident",
        "description": "Two-vehicle collision, one lane blocked",
        "severity": "Medium",
        "issue_at": "2025-11-27T10:15:00.000Z",
        "icon": "warning",
        "color": "#ffa500"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [106.6820, 10.7860]
      },
      "properties": {
        "incident_id": 3,
        "name": "Road Construction",
        "type": "Road Closure",
        "description": "Main road closed for maintenance until 6 PM",
        "severity": "Low",
        "issue_at": "2025-11-27T08:00:00.000Z",
        "icon": "block",
        "color": "#ffff00"
      }
    }
  ]
}
```

**Incident Types:**

- `Flood` - Flooding or water accumulation
- `Accident` - Traffic accident
- `Traffic Jam` - Severe traffic congestion
- `Road Closure` - Road closed or blocked

**Severity Levels:**

- `Low` - Minor impact (Yellow: #ffff00)
- `Medium` - Moderate impact (Orange: #ffa500)
- `High` - Major impact (Red-orange: #ff4500)
- `Critical` - Severe impact (Red: #ff0000)

**Usage:**

- Display incident markers on map
- Filter incidents by type or severity
- Show incident details on click
- Only returns unresolved incidents

---

## Business Features

**Authentication Required:** All business endpoints require JWT token and `business` role.

### Get Alert Policies

Get all alert policies for the authenticated business user.

**Endpoint:** `GET /business/policies`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
[
  {
    "policy_id": 1,
    "business_id": 1,
    "name": "High Wind Alert",
    "description": "Alert when wind speed exceeds level 7 during work hours",
    "start_hour": "08:00:00",
    "end_hour": "17:00:00",
    "week_day": "Mon,Tue,Wed,Thu,Fri",
    "wind_threshold": 60.0,
    "rain_threshold": null,
    "temp_threshold": null,
    "status": true
  }
]
```

---

### Create Alert Policy

Create a new alert policy for business fleet management.

**Endpoint:** `POST /business/policies`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "name": "Heavy Rain Alert",
  "description": "Alert when rainfall exceeds 50mm",
  "start_hour": "06:00:00",
  "end_hour": "22:00:00",
  "week_day": "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
  "rain_threshold": 50.0,
  "wind_threshold": null,
  "temp_threshold": null,
  "status": true
}
```

**Response:** `201 Created`

```json
{
  "policy_id": 2,
  "business_id": 1,
  "name": "Heavy Rain Alert",
  "description": "Alert when rainfall exceeds 50mm",
  "start_hour": "06:00:00",
  "end_hour": "22:00:00",
  "week_day": "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
  "rain_threshold": 50.0,
  "status": true
}
```

---

### Get Business Dashboard

Get overview statistics for business account.

**Endpoint:** `GET /business/dashboard`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "active_policies": 5,
  "alerts_last_24h": 12,
  "alerts_by_type": [
    { "type": "Wind", "count": 7 },
    { "type": "Rain", "count": 5 }
  ],
  "recent_events": [
    {
      "alert_event_id": 45,
      "name": "High Wind Detected",
      "type": "Wind",
      "description": "Wind speed 65km/h exceeded threshold",
      "issue_at": "2025-11-27T14:30:00.000Z"
    }
  ],
  "business_info": {
    "company_name": "ABC Transport Ltd",
    "business_id": 1
  }
}
```

---

### Get Weekly Report

Generate weekly report with alert statistics and policy performance.

**Endpoint:** `GET /business/reports/weekly`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "report_period": {
    "start": "2025-11-20T00:00:00.000Z",
    "end": "2025-11-27T00:00:00.000Z"
  },
  "company_name": "ABC Transport Ltd",
  "weekly_stats": [
    {
      "date": "2025-11-27",
      "alert_count": 8,
      "type": "Wind",
      "policies_triggered": 2
    },
    {
      "date": "2025-11-26",
      "alert_count": 5,
      "type": "Rain",
      "policies_triggered": 1
    }
  ],
  "policy_performance": [
    {
      "policy_id": 1,
      "name": "High Wind Alert",
      "alerts_triggered": 15
    },
    {
      "policy_id": 2,
      "name": "Heavy Rain Alert",
      "alerts_triggered": 8
    }
  ],
  "summary": {
    "total_alerts": 23,
    "active_policies": 5
  }
}
```

---

## Admin & Response Scenarios

**Authentication Required:** All admin endpoints require JWT token and `admin` or `admin_officer` role.

### Get Admin Areas

Get all administrative areas (filtered by officer if not super admin).

**Endpoint:** `GET /admin/areas`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
[
  {
    "area_id": 1,
    "officer_id": 1,
    "name": "District 1 - Central Area",
    "area_type": "urban",
    "boundary_polygon": "{\"type\":\"Polygon\",\"coordinates\":[...]}",
    "AdministrativeOfficer": {
      "officer_id": 1,
      "user_id": 5,
      "department": "Emergency Management"
    }
  }
]
```

---

### Create Admin Area

Create a new administrative area.

**Endpoint:** `POST /admin/areas`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "name": "District 3 - Residential Zone",
  "area_type": "residential",
  "boundary_polygon": "{\"type\":\"Polygon\",\"coordinates\":[[...]]}"
}
```

**Response:** `201 Created`

```json
{
  "area_id": 2,
  "officer_id": 1,
  "name": "District 3 - Residential Zone",
  "area_type": "residential",
  "boundary_polygon": "{\"type\":\"Polygon\",\"coordinates\":[[...]]}"
}
```

---

### Update Admin Area

Update an existing administrative area.

**Endpoint:** `PUT /admin/areas/:id`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "name": "District 3 - Updated Name",
  "area_type": "mixed"
}
```

**Response:** `200 OK`

---

### Delete Admin Area

Delete an administrative area.

**Endpoint:** `DELETE /admin/areas/:id`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "message": "Area deleted successfully"
}
```

---

### Get Response Scenarios

Get all response scenarios, optionally filtered by area.

**Endpoint:** `GET /admin/scenarios`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Query Parameters:**

- `area_id` (optional): Filter by specific admin area

**Example:**

```
GET /admin/scenarios?area_id=1
```

**Response:** `200 OK`

```json
[
  {
    "scenario_id": 1,
    "area_id": 1,
    "name": "Flood Response - District 1",
    "applicable_event_type": "Flood",
    "AdminArea": {
      "area_id": 1,
      "name": "District 1 - Central Area"
    },
    "ChecklistItems": [
      {
        "item_id": 1,
        "scenario_id": 1,
        "name": "Activate emergency team",
        "description": "Call all emergency responders",
        "item_order": 1
      },
      {
        "item_id": 2,
        "scenario_id": 1,
        "name": "Close affected roads",
        "description": "Set up barricades on flooded streets",
        "item_order": 2
      }
    ]
  }
]
```

---

### Get Single Scenario

Get detailed information about a specific scenario with all checklist items.

**Endpoint:** `GET /admin/scenarios/:id`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "scenario_id": 1,
  "area_id": 1,
  "name": "Flood Response - District 1",
  "applicable_event_type": "Flood",
  "AdminArea": {
    "area_id": 1,
    "name": "District 1 - Central Area"
  },
  "ChecklistItems": [
    {
      "item_id": 1,
      "name": "Activate emergency team",
      "description": "Call all emergency responders",
      "item_order": 1
    }
  ]
}
```

---

### Create Response Scenario

Create a new emergency response scenario.

**Endpoint:** `POST /admin/scenarios`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "area_id": 1,
  "name": "Traffic Accident Response",
  "applicable_event_type": "Accident"
}
```

**Response:** `201 Created`

```json
{
  "scenario_id": 2,
  "area_id": 1,
  "name": "Traffic Accident Response",
  "applicable_event_type": "Accident"
}
```

---

### Add Checklist Item

Add an action item to a response scenario.

**Endpoint:** `POST /admin/scenarios/:id/items`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "name": "Deploy traffic police",
  "description": "Send officers to manage traffic flow",
  "item_order": 1
}
```

**Note:** If `item_order` is not provided, it will be automatically assigned as the next sequential number.

**Response:** `201 Created`

```json
{
  "item_id": 3,
  "scenario_id": 1,
  "name": "Deploy traffic police",
  "description": "Send officers to manage traffic flow",
  "item_order": 1
}
```

---

### Get Admin Dashboard

Get system-wide statistics and health indicators.

**Endpoint:** `GET /admin/dashboard`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
    "system_health": {
        "database": "healthy",
        "total_users": 6,
        "active_users_7d": 2,
        "alerts_24h": 0
    },
    "users_by_role": [
        {
            "role": "admin",
            "count": "1"
        },
        {
            "role": "moderator",
            "count": "1"
        },
        {
            "role": "user",
            "count": "5"
        }
    ],
    "admin_areas": 0,
    "response_scenarios": 0,
    "scenarios_by_type": [],
    "timestamp": "2026-03-04T12:04:11.731Z"
}
```

---

## User Response Scenarios

**Authentication Required:** All endpoints require JWT token.

### Get Response Scenarios

Get all response scenarios of the authenticated user.

**Endpoint:** `GET /api/response-scenarios`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Query Parameters:**

- `name` (optional): Search by scenario name (contains, case-insensitive)
- `applicable_event_type` (optional): Search by event type description (contains, case-insensitive)

**Example:**

```
GET /api/response-scenarios?name=cao&applicable_event_type=xe
```

**Response:** `200 OK`

```json
{
    "success": true,
    "data": [
        {
            "scenario_id": 10,
            "user_id": 18,
            "name": "Ứng phó hỏa hoạn nhà cao tầng",
            "applicable_event_type": "Huy động xe thang, ngắt điện khu vực",
            "steps": [
                {
                    "id": 4,
                    "scenario_id": 10,
                    "step": 1,
                    "content": "Xác định vị trí cháy và số người kẹt",
                    "priority": "high"
                },
                {
                    "id": 5,
                    "scenario_id": 10,
                    "step": 2,
                    "content": "Ngắt điện và hệ thống gas",
                    "priority": "high"
                },
                {
                    "id": 6,
                    "scenario_id": 10,
                    "step": 3,
                    "content": "Triển khai xe thang cứu hộ",
                    "priority": "high"
                },
                {
                    "id": 7,
                    "scenario_id": 10,
                    "step": 4,
                    "content": "Sơ cấp cứu người bị nạn",
                    "priority": "medium"
                }
            ]
        },
        {
            "scenario_id": 9,
            "user_id": 18,
            "name": "Kịch bản ngập trên 0.5m",
            "applicable_event_type": "Kích hoạt trạm bơm, phong tỏa khu vực trọng yếu",
            "steps": [
                {
                    "id": 1,
                    "scenario_id": 9,
                    "step": 1,
                    "content": "Thông báo người dân di chuyển",
                    "priority": "high"
                },
                {
                    "id": 2,
                    "scenario_id": 9,
                    "step": 2,
                    "content": "Kích hoạt trạm bơm dự phòng",
                    "priority": "high"
                },
                {
                    "id": 3,
                    "scenario_id": 9,
                    "step": 3,
                    "content": "Cử đội phản ứng nhanh hỗ trợ",
                    "priority": "medium"
                }
            ]
        }
    ]
}
```

---

### Get Single Response Scenario

Get one response scenario by id (must belong to authenticated user).

**Endpoint:** `GET /api/response-scenarios/:id`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
            "scenario_id": 9,
            "user_id": 18,
            "name": "Kịch bản ngập trên 0.5m",
            "applicable_event_type": "Kích hoạt trạm bơm, phong tỏa khu vực trọng yếu",
            "steps": [
                {
                    "id": 1,
                    "scenario_id": 9,
                    "step": 1,
                    "content": "Thông báo người dân di chuyển",
                    "priority": "high"
                },
                {
                    "id": 2,
                    "scenario_id": 9,
                    "step": 2,
                    "content": "Kích hoạt trạm bơm dự phòng",
                    "priority": "high"
                },
                {
                    "id": 3,
                    "scenario_id": 9,
                    "step": 3,
                    "content": "Cử đội phản ứng nhanh hỗ trợ",
                    "priority": "medium"
                }
            ]
        }
    ]
  }
}
```

---

### Create Response Scenario

Create a response scenario and its steps.

**Endpoint:** `POST /api/response-scenarios`

**Headers:**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "Ứng phó hỏa hoạn nhà cao tầng",
  "applicable_event_type": "Huy động xe thang, ngắt điện khu vực",
  "steps": [
    {
      "step": 1,
      "content": "Xác định vị trí cháy và số người kẹt",
      "priority": "high"
    },
    {
      "step": 2,
      "content": "Ngắt điện và hệ thống gas",
      "priority": "high"
    },
    {
      "step": 3,
      "content": "Triển khai xe thang cứu hộ",
      "priority": "high"
    },
    {
      "step": 4,
      "content": "Sơ cấp cứu người bị nạn",
      "priority": "medium"
    }
  ]
}
```

**Validation Rules:**

- `name` (required): Non-empty string
- `applicable_event_type` (required): Non-empty string
- `steps` (required): Array with at least 1 item
- `steps[].step` (required): Positive integer and unique inside the same scenario
- `steps[].content` (required): Non-empty string
- `steps[].priority` (required): `high`, `medium`, `low` (also accepts `cao`, `trung_binh`, `trung bình`, `thấp` and will normalize)

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "scenario_id": 2,
    "user_id": 5,
    "name": "Traffic Accident Response",
    "applicable_event_type": "Multi-vehicle collision during rush hour",
    "steps": [
      {
        "id": 20,
        "scenario_id": 2,
        "step": 1,
        "content": "Call emergency hotline and report location",
        "priority": "high"
      },
      {
        "id": 21,
        "scenario_id": 2,
        "step": 2,
        "content": "Set warning triangle 50 meters behind vehicle",
        "priority": "medium"
      }
    ]
  }
}
```

---

### Update Response Scenario

Update scenario information and/or replace all steps.

**Endpoint:** `PUT /api/response-scenarios/:id`

**Headers:**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body (all fields optional, at least one is required):**

```json
{
  "name": "Traffic Accident Response - Updated",
  "applicable_event_type": "Collision in heavy rain",
  "steps": [
    {
      "step": 1,
      "content": "Contact emergency services and share exact coordinates",
      "priority": "high"
    },
    {
      "step": 2,
      "content": "Direct traffic away from accident lane",
      "priority": "low"
    }
  ]
}
```

**Notes:**

- If `steps` is provided, old steps are deleted and replaced by the new list.
- If no valid fields are provided, API returns `400 Bad Request`.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "scenario_id": 2,
    "user_id": 5,
    "name": "Traffic Accident Response - Updated",
    "applicable_event_type": "Collision in heavy rain",
    "steps": [
      {
        "id": 30,
        "scenario_id": 2,
        "step": 1,
        "content": "Contact emergency services and share exact coordinates",
        "priority": "high"
      },
      {
        "id": 31,
        "scenario_id": 2,
        "step": 2,
        "content": "Direct traffic away from accident lane",
        "priority": "low"
      }
    ]
  }
}
```

---

### Delete Response Scenario

Delete one response scenario and all of its steps.

**Endpoint:** `DELETE /api/response-scenarios/:id`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Scenario deleted successfully"
}
```

---

### Get Admin Dashboard

Get system-wide dashboard statistics for admin users.

**Endpoint:** `GET /admin/dashboard`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "system_health": {
    "database": "healthy",
    "total_users": 150,
    "active_users_7d": 45,
    "alerts_24h": 12
  },
  "users_by_role": [
    {
      "role": "user",
      "count": 120
    },
    {
      "role": "admin",
      "count": 5
    }
  ],
  "admin_areas": 10,
  "response_scenarios": 25,
  "scenarios_by_type": [
    {
      "applicable_event_type": "Flood",
      "count": 8
    },
    {
      "applicable_event_type": "Traffic",
      "count": 10
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Alert Events Management

**Authentication Required:** All alert endpoints require JWT token and `admin` or `admin_officer` role.

### Get All Alert Events

Get all alert events with optional filtering. Officers can only see alerts from their areas.

**Endpoint:** `GET /admin/alerts`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Query Parameters:**

- `type` (optional): Filter by alert type (Flood, Rain, Storm, Traffic, Ngập, Mưa, Bão, Giao thông)
- `level` (optional): Filter by severity level (High, Medium, Low, Cao, Trung bình, Thấp)
- `area_id` (optional): Filter by specific admin area
- `start_date` (optional): Filter alerts from this date (ISO format)
- `end_date` (optional): Filter alerts until this date (ISO format)
- `limit` (optional): Maximum number of results (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Example:**

```
GET /admin/alerts?type=Flood&level=High&area_id=1&start_date=2024-01-01&limit=50
```

**Response:** `200 OK`

```json
[
  {
    "alert_event_id": 1,
    "name": "Heavy Flooding in District 1",
    "type": "Flood",
    "description": "Water level rising rapidly in downtown area",
    "issue_at": "2024-01-15T09:30:00Z",
    "area_id": 1,
    "area_name": "District 1 - Central Area",
    "scenario_id": null,
    "level": "High",
    "user_id": 5,
    "UserAccount": {
      "user_id": 5,
      "username": "admin_officer_1",
      "email": "officer1@admin.com"
    },
    "ResponseScenario": null
  },
  {
    "alert_event_id": 2,
    "name": "Traffic Jam on Highway 1",
    "type": "Traffic",
    "description": "Heavy congestion due to accident",
    "issue_at": "2024-01-15T10:15:00Z",
    "area_id": 2,
    "area_name": "District 2 - Suburban Area",
    "scenario_id": 5,
    "level": "Medium",
    "user_id": 5,
    "UserAccount": {
      "user_id": 5,
      "username": "admin_officer_1",
      "email": "officer1@admin.com"
    },
    "ResponseScenario": {
      "scenario_id": 5,
      "name": "Traffic Accident Response",
      "applicable_event_type": "Traffic"
    }
  }
]
```

---

### Get Single Alert Event

Get detailed information about a specific alert event.

**Endpoint:** `GET /admin/alerts/:id`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "alert_event_id": 1,
  "name": "Heavy Flooding in District 1",
  "type": "Flood",
  "description": "Water level rising rapidly in downtown area",
  "issue_at": "2024-01-15T09:30:00Z",
  "area_id": 1,
  "scenario_id": null,
  "level": "High",
  "user_id": 5,
  "UserAccount": {
    "user_id": 5,
    "username": "admin_officer_1",
    "email": "officer1@admin.com"
  },
  "AdminArea": {
    "area_id": 1,
    "name": "District 1 - Central Area",
    "address": "Downtown District"
  },
  "ResponseScenario": null
}
```

---

### Create Alert Event

Create a new alert event. Only authenticated admins and admin officers can create alerts.

**Endpoint:** `POST /admin/alerts`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "name": "Heavy Flooding in District 1",
  "type": "Flood",
  "description": "Water level rising rapidly in downtown area",
  "level": "High",
  "area_id": 1,
  "scenario_id": null,
  "issue_at": "2024-01-15T09:30:00Z"
}
```

**Field Descriptions:**

- `name` (required): Name/title of the alert
- `type` (required): Type of alert: `Flood`, `Rain`, `Storm`, `Traffic`, `Ngập`, `Mưa`, `Bão`, or `Giao thông`
- `description` (optional): Detailed description of the alert
- `level` (required): Severity level: `High`, `Medium`, `Low`, `Cao`, `Trung bình`, or `Thấp`
- `area_id` (required): ID of the affected area (must exist)
- `scenario_id` (optional): ID of associated response scenario (null means unprocessed)
- `issue_at` (optional): Event timestamp (defaults to current time if not provided)

**Response:** `201 Created`

```json
{
  "alert_event_id": 1,
  "name": "Heavy Flooding in District 1",
  "type": "Flood",
  "description": "Water level rising rapidly in downtown area",
  "issue_at": "2024-01-15T09:30:00Z",
  "area_id": 1,
  "area_name": "District 1 - Central Area",
  "scenario_id": null,
  "level": "High",
  "user_id": 5,
  "UserAccount": {
    "user_id": 5,
    "username": "admin_officer_1",
    "email": "officer1@admin.com"
  },
  "ResponseScenario": null
}
```

**Error Responses:**

- `400 Bad Request`: Invalid data or missing required fields
- `404 Not Found`: Referenced area or scenario not found
- `401 Unauthorized`: Invalid or missing JWT token

---

### Update Alert Event

Update an existing alert event. Only the creator or an admin can update an alert.

**Endpoint:** `PUT /admin/alerts/:id`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body (all fields optional):**

```json
{
  "name": "Updated Alert Name",
  "type": "Storm",
  "description": "Updated description",
  "level": "Medium",
  "scenario_id": 5
}
```

**Field Descriptions:**

- `name` (optional): Updated alert name
- `type` (optional): Updated alert type
- `description` (optional): Updated description
- `level` (optional): Updated severity level
- `scenario_id` (optional): Assign response scenario (null to mark as unprocessed)

**Response:** `200 OK`

```json
{
  "alert_event_id": 1,
  "name": "Updated Alert Name",
  "type": "Storm",
  "description": "Updated description",
  "issue_at": "2024-01-15T09:30:00Z",
  "area_id": 1,
  "area_name": "District 1 - Central Area",
  "scenario_id": 5,
  "level": "Medium",
  "user_id": 5,
  "UserAccount": {
    "user_id": 5,
    "username": "admin_officer_1",
    "email": "officer1@admin.com"
  },
  "ResponseScenario": {
    "scenario_id": 5,
    "name": "Traffic Accident Response",
    "applicable_event_type": "Traffic"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid data
- `401 Unauthorized`: User is not the creator or an admin
- `404 Not Found`: Alert event or referenced scenario not found

---

### Delete Alert Event

Delete an alert event. Only the creator or an admin can delete an alert.

**Endpoint:** `DELETE /admin/alerts/:id`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "message": "Alert event deleted successfully"
}
```

**Error Responses:**

- `401 Unauthorized`: User is not the creator or an admin
- `404 Not Found`: Alert event not found

---

## Error Handling

### Standard Error Response

```json
{
  "message": "Error description"
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Role-based Access Error

```json
{
  "message": "Forbidden: Insufficient permissions",
  "required_role": ["business"],
  "your_role": "individual"
}
```

---

## Testing with cURL

### Business Endpoints

**Get Policies:**

```bash
curl http://localhost:3000/api/business/policies \
  -H "Authorization: Bearer YOUR_BUSINESS_TOKEN"
```

**Create Policy:**

```bash
curl -X POST http://localhost:3000/api/business/policies \
  -H "Authorization: Bearer YOUR_BUSINESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Wind Alert","wind_threshold":60,"start_hour":"08:00","end_hour":"17:00","week_day":"Mon,Tue,Wed,Thu,Fri"}'
```

**Get Dashboard:**

```bash
curl http://localhost:3000/api/business/dashboard \
  -H "Authorization: Bearer YOUR_BUSINESS_TOKEN"
```

**Get Weekly Report:**

```bash
curl http://localhost:3000/api/business/reports/weekly \
  -H "Authorization: Bearer YOUR_BUSINESS_TOKEN"
```

### Admin Endpoints

#### Area Management (CRUD)

**Get All Areas:**

Returns all admin areas. Officers see only their own areas, super admins see all.

**Endpoint:** `GET /api/admin/areas`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Response:** `200 OK`
```json
[
  {
    "area_id": 1,
    "officer_id": 1,
    "name": "Quận 5",
    "area_type": "Quận",
    "address": "Quận 5, TP. Hồ Chí Minh",
    "boundary_polygon": null,
    "management_area": {
      "center": {
        "lat": 10.7770,
        "lng": 106.6765
      },
      "radius_km": 5.5
    },
    "hot_points": 0,
    "AdministrativeOfficer": {
      "officer_id": 1,
      "user_id": 5,
      "department": "Emergency Management"
    }
  }
]
```

**cURL Example:**
```bash
curl http://localhost:3000/api/admin/areas \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

**Get Single Area:**

Retrieve details of a specific admin area.

**Endpoint:** `GET /api/admin/areas/:id`

**Parameters:**
- `id` (path): Area ID

**Response:** `200 OK`
```json
{
  "area_id": 1,
  "officer_id": 1,
  "name": "Quận 5",
  "area_type": "Quận",
  "address": "Quận 5, TP. Hồ Chí Minh",
  "management_area": {
    "center": {
      "lat": 10.7770,
      "lng": 106.6765
    },
    "radius_km": 5.5
  },
  "hot_points": 0
}
```

**cURL Example:**
```bash
curl http://localhost:3000/api/admin/areas/1 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

**Create Area:**

Create a new admin area with full details.

**Endpoint:** `POST /api/admin/areas`

**Request Body:**
```json
{
  "name": "Phường 1, Quận 1",
  "area_type": "Phường",
  "address": "Phường 1, Quận 1, TP. Hồ Chí Minh",
  "management_area": {
    "center": {
      "lat": 10.7800,
      "lng": 106.7000
    },
    "radius_km": 3.2
  }
}
```

**Field Descriptions:**
- `name` (required): Area name
- `area_type` (required): Type of area - "Phường" or "Quận"
- `address` (required): Text address for the area
- `management_area` (required): Geographic circle for the managed area
  - `center` (required): Central coordinates
    - `lat` (required): Latitude
    - `lng` (required): Longitude
  - `radius_km` (required): Radius in kilometers (must be > 0)

**Response:** `201 Created`
```json
{
  "area_id": 5,
  "officer_id": 1,
  "name": "Phường 1, Quận 1",
  "area_type": "Phường",
  "address": "Phường 1, Quận 1, TP. Hồ Chí Minh",
  "management_area": {
    "center": {
      "lat": 10.7800,
      "lng": 106.7000
    },
    "radius_km": 3.2
  },
  "hot_points": 0
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/admin/areas \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Phường 1, Quận 1",
    "area_type": "Phường",
    "address": "Phường 1, Quận 1, TP. Hồ Chí Minh",
    "management_area": {
      "center": {"lat": 10.7800, "lng": 106.7000},
      "radius_km": 3.2
    }
  }'
```

---

**Update Area:**

Update an existing admin area.

**Endpoint:** `PUT /api/admin/areas/:id`

**Parameters:**
- `id` (path): Area ID

**Request Body (all fields optional):**
```json
{
  "name": "Phường 2, Quận 1",
  "area_type": "Phường",
  "address": "Phường 2, Quận 1, TP. Hồ Chí Minh",
  "management_area": {
    "center": {
      "lat": 10.7850,
      "lng": 106.7050
    },
    "radius_km": 3.5
  }
}
```

**Response:** `200 OK`
```json
{
  "area_id": 5,
  "officer_id": 1,
  "name": "Phường 2, Quận 1",
  "area_type": "Phường",
  "address": "Phường 2, Quận 1, TP. Hồ Chí Minh",
  "management_area": {
    "center": {
      "lat": 10.7850,
      "lng": 106.7050
    },
    "radius_km": 3.5
  },
  "hot_points": 0
}
```

**cURL Example:**
```bash
curl -X PUT http://localhost:3000/api/admin/areas/5 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Phường 2, Quận 1",
    "management_area": {
      "center": {"lat": 10.7850, "lng": 106.7050},
      "radius_km": 3.5
    }
  }'
```

---

**Delete Area:**

Delete an admin area.

**Endpoint:** `DELETE /api/admin/areas/:id`

**Parameters:**
- `id` (path): Area ID

**Response:** `200 OK`
```json
{
  "message": "Area deleted successfully"
}
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:3000/api/admin/areas/5 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

#### Response Scenario Management

**Get Scenarios:**

```bash
curl http://localhost:3000/api/admin/scenarios \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Create Scenario:**

```bash
curl -X POST http://localhost:3000/api/admin/scenarios \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"area_id":1,"name":"Flood Response","applicable_event_type":"Flood"}'
```

**Add Checklist Item:**

```bash
curl -X POST http://localhost:3000/api/admin/scenarios/1/items \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Evacuate residents","description":"Coordinate evacuation","item_order":1}'
```

**Get Admin Dashboard:**

```bash
curl http://localhost:3000/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Map Endpoints

### Standard Error Response

```json
{
  "message": "Error description"
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Missing/invalid token
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Testing with cURL

### Map Endpoints

**Get Traffic Data:**

```bash
curl http://localhost:3000/api/map/traffic
```

**Get Weather Areas:**

```bash
curl http://localhost:3000/api/map/weather-areas
```

**Get Incidents:**

```bash
curl http://localhost:3000/api/map/incidents
```

### Auth Endpoints

**Register:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","role":"individual","fullName":"Test User"}'
```

**Login:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'
```

### User Endpoints

**Get Profile:**

```bash
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Update Profile:**

```bash
curl -X PUT http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Updated Name"}'
```

---

## Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=4567
DB_NAME=weather_traffic
DB_DIALECT=postgres
DB_USER=postgres
DB_PASS=admin

# App
PORT=3000
JWT_SECRET=super_secret_key
JWT_EXPIRE=1d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

## Database Schema

### User Tables

- `user_account` - Main user table
- `individual_user` - Individual user profiles
- `business_user` - Business user profiles
- `refresh_token` - Refresh token storage

### Notification Tables

- `notification_preference` - User notification settings
- `noti_event` - User notifications

### Map Tables

- `route_segment` - Road segments with geometry
- `traffic_reading` - Real-time traffic data
- `weather_area` - Weather zones
- `time_slot` - Time-based weather slots
- `weather_reading` - Weather measurements
- `weather_forecast` - Future weather predictions
- `alert_event` - Incidents (floods, accidents)

### Route Tables

- `saved_location` - User favorite locations
- `saved_route` - User saved routes with waypoints
- `trip` - Planned trips
- `risk_assessment` - Trip risk analysis results

### Business Tables

- `business_user` - Business user profiles
- `alert_policy` - Business alert policies
- `alert_event` - Triggered alerts

### Admin Tables

**administrative_officer** - Administrative officers managing areas
- `officer_id` (INTEGER, PK, auto-increment)
- `user_id` (INTEGER, FK → user_account)
- `department` (STRING)

**admin_area** - Geographical areas managed by officers
- `area_id` (INTEGER, PK, auto-increment)
- `officer_id` (INTEGER, FK → administrative_officer)
- `name` (STRING) - Area name
- `area_type` (STRING) - "Phường" or "Quận"
- `address` (TEXT) - Text address entered by user
- `management_area` (JSON) - Circle geometry: `{center: {lat, lng}, radius_km}`
- `hot_points` (INTEGER) - Number of hot spots/incidents in the area (default: 0)
- `boundary_polygon` (TEXT) - Legacy GeoJSON/Polygon field

**response_scenario** - Emergency response plans
- `scenario_id` (INTEGER, PK, auto-increment)
- `area_id` (INTEGER, FK → admin_area)
- `name` (STRING)
- `applicable_event_type` (STRING) - Flood, Traffic Jam, Accident, etc.

**checklist_item** - Action items in scenarios
- `item_id` (INTEGER, PK, auto-increment)
- `scenario_id` (INTEGER, FK → response_scenario)
- `name` (STRING)
- `description` (TEXT)
- `item_order` (INTEGER)

---

## Notes

1. **Authentication:** All route and analysis endpoints require authentication. Map endpoints are public.
2. **Route Analysis:** The `/routes/:id/analysis` endpoint aggregates weather and traffic data along an entire route - perfect for trip planning.
3. **Risk Assessment:** The `/analysis/assess-risk` endpoint provides intelligent trip risk scoring based on weather forecasts and traffic conditions.
4. **Business Endpoints:** Require authentication AND `business` role. Returns 403 if user is not a business account.
5. **Admin Endpoints:** Require authentication AND `admin` or `admin_officer` role. Returns 403 if insufficient permissions.
6. **GeoJSON Format:** Traffic and incidents are returned in GeoJSON format for easy map integration.
7. **Color Coding:** Traffic segments and incidents include color codes for visual representation.
8. **Real-time Data:** Map endpoints return the latest available data from the database.
9. **Role-based Access:** The system enforces strict role-based access control for business and admin features.
10. **PostGIS:** The system uses PostgreSQL with PostGIS extension for geometric data types.
11. **Risk Scoring:** Risk assessments use a weighted algorithm (weather 60%, traffic 40%) to calculate overall trip safety.
12. **Forecast Range:** Weather forecasts cover the next 7 days (168 hours) with hourly granularity.
