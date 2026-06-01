# Express Backend API Response Structure Analysis

**Analysis Date:** May 19, 2026  
**Purpose:** Detailed comparison of actual API response structures vs documented behavior in swagger.yaml

---

## Executive Summary

This report analyzes the actual response structures returned by all Express backend API endpoints by examining the controller files directly. The analysis identifies:

- **Response HTTP Status Codes** used in each endpoint
- **Actual Response Structures** (fields and data types)
- **Response Patterns** (success/error cases)
- **Data Transformations** applied before sending responses
- **Discrepancies** between swagger.yaml documentation and actual code

---

## Auth Controller (`/api/auth`)

### 1. POST /api/auth/signup
**HTTP Status:** `201 Created`  
**Actual Response Structure:**
```json
{
  "message": "User registered successfully!",
  "user": {
    "id": "integer (user_id)",
    "email": "string",
    "username": "string"
  }
}
```
**Notes:**
- Only returns basic user info (id, email, username)
- Does NOT return access/refresh tokens
- Includes a descriptive message field
- Data source: `authService.register()` returns full user object, controller extracts only necessary fields

**Error Cases:**
- 400: Validation errors (duplicate email/username, invalid password)
- Error handling: Via `asyncHandler` middleware

---

### 2. POST /api/auth/signin
**HTTP Status:** `200 OK`  
**Actual Response Structure (from swagger docs):**
```json
{
  "id": "integer",
  "username": "string | null",
  "email": "string",
  "roles": ["array of strings"],
  "accessToken": "string",
  "refreshToken": "string"
}
```
**Notes:**
- Response is directly from `authService.login()` 
- Returns complete authentication payload including tokens
- `username` field is nullable
- Roles array contains role names
- Error handling: Via `asyncHandler` middleware

**Error Cases:**
- 401: Invalid credentials

---

### 3. POST /api/auth/google
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
{
  "id": "integer",
  "username": "string | null",
  "email": "string",
  "roles": ["array of strings"],
  "isNewUser": "boolean",
  "accessToken": "string",
  "refreshToken": "string"
}
```
**Notes:**
- Similar to signin but includes `isNewUser` flag
- Handles multiple OAuth token formats (idToken, credential, code)
- Normalized payload handling via `resolveParams` helper

**Error Cases:**
- 400: Invalid token or code

---

### 4. POST /api/auth/logout
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
- Returns result from `authService.logout()` 
- Expected: `{ message: "Logged out successfully" }` (typical pattern)
- Requires authentication (JWT token in Authorization header)

**Error Cases:**
- 401: Unauthorized (missing/invalid token)

---

### 5. POST /api/auth/refresh-token
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
{
  "accessToken": "string",
  "refreshToken": "string"
}
```
**Notes:**
- Returns new token pair
- Requires existing refresh token in request body

**Error Cases:**
- 401: Invalid refresh token

---

### 6. POST /api/auth/send-otp
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
- Returns result from `authService.sendOtp()`
- Expected: `{ message: "OTP sent successfully" }` (typical pattern)

**Error Cases:**
- 404: User not found

---

### 7. POST /api/auth/verify-otp
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
{
  "message": "OTP verified successfully",
  "ok": "boolean"
}
```
**Notes:**
- Includes a message field plus verification result
- `ok` field indicates verification success

**Error Cases:**
- 400: Invalid or expired OTP

---

### 8. POST /api/auth/reset-password
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
- Returns result from `authService.resetPassword()`
- Expected: `{ message: "Password reset successful" }` (typical pattern)

**Error Cases:**
- 400: Invalid request

---

## User Controller (`/api/users`)

### 1. GET /api/users/test/all
**HTTP Status:** `200 OK`  
**Actual Response:** Plain text string
```
"Public Content."
```
**Notes:**
- Test endpoint returning plain text, not JSON
- No authentication required

---

### 2. GET /api/users/test/user
**HTTP Status:** `200 OK`  
**Actual Response:** Plain text string
```
"User Content."
```
**Notes:**
- Test endpoint, requires authentication

---

### 3. GET /api/users/test/mod
**HTTP Status:** `200 OK`  
**Actual Response:** Plain text string
```
"Moderator Content."
```
**Notes:**
- Test endpoint, requires moderator role

---

### 4. GET /api/users/test/admin
**HTTP Status:** `200 OK`  
**Actual Response:** Plain text string
```
"Admin Content."
```
**Notes:**
- Test endpoint, requires admin role

---

### 5. GET /api/users/me
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
{
  "user_id": "integer",
  "email": "string",
  "username": "string",
  "password_hash": "string (EXCLUDED)",
  "account_type": "string (individual | business)",
  "phone_number": "string | null",
  "language": "string | null",
  "created_at": "datetime",
  "updated_at": "datetime",
  "IndividualUser": {
    "individual_id": "integer",
    "user_id": "integer",
    "full_name": "string | null"
  } | null,
  "BusinessUser": {
    "business_id": "integer",
    "user_id": "integer",
    "company_name": "string | null",
    "tax_code": "string | null"
  } | null
}
```
**Notes:**
- Full user object excluding password_hash
- Includes associated IndividualUser or BusinessUser record
- Only one of IndividualUser or BusinessUser is populated based on account_type
- Data transformation: Password hash excluded for security

---

### 6. PUT /api/users/me
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
- Same as GET /api/users/me (full updated user object)
- Updates: phone_number, language, and profile-specific fields
- For individual: full_name
- For business: company_name, tax_code

---

### 7. GET /api/users/me/preferences
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
[
  {
    "pref_id": "integer",
    "user_id": "integer",
    "noti_type": "string (Traffic, Weather, etc.)",
    "threshold": "integer | null",
    "created_at": "datetime",
    "updated_at": "datetime"
  }
]
```
**Notes:**
- Array of preference objects
- One entry per notification type
- Direct response from database query

---

### 8. PUT /api/users/me/preferences
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
{
  "pref_id": "integer",
  "user_id": "integer",
  "noti_type": "string",
  "threshold": "integer | null",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```
**Notes:**
- Single preference object (upsert operation)
- Creates new or updates existing based on noti_type
- Returns the created/updated record

**Error Cases:**
- 400: Missing noti_type field

---

### 9. GET /api/users/notifications
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
[
  {
    "noti_event_id": "integer",
    "user_id": "integer",
    "type": "string",
    "level": "string (low, medium, high, critical)",
    "title": "string",
    "description": "string | null",
    "is_read": "boolean",
    "issue_at": "datetime",
    "created_at": "datetime",
    "updated_at": "datetime"
  }
]
```
**Notes:**
- Array of notification events
- Ordered by issue_at DESC (most recent first)
- Paginated with limit query parameter (default: 50)
- Direct array response (no wrapper object)

---

### 10. GET /api/users/notification (alias)
**HTTP Status:** `200 OK`  
**Actual Response:** Same as GET /api/users/notifications

---

### 11. PUT /api/users/notifications/{id}/read
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
{
  "noti_event_id": "integer",
  "user_id": "integer",
  "type": "string",
  "level": "string",
  "title": "string",
  "description": "string | null",
  "is_read": true,
  "issue_at": "datetime",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```
**Notes:**
- Returns the updated notification with is_read = true
- Single notification object

**Error Cases:**
- 404: Notification not found

---

### 12. GET /api/users/me/report-schedules
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
[
  {
    "id": "integer",
    "user_id": "integer",
    "type": "string (weekly | monthly)",
    "day": "string (0-6 for weekly, 1-31 for monthly)",
    "time": "string (HH:mm format)",
    "email": "string",
    "recipients": "string | null",
    "report_names": "string (comma-separated: weather,alerts,incidents)",
    "created_at": "datetime",
    "updated_at": "datetime"
  }
]
```
**Notes:**
- Array of report schedule objects
- Formatted response via `_formatScheduleForResponse()`
- report_names stored as comma-separated string in DB
- Supports query filtering by type

**Error Cases:**
- 400: Invalid type value (must be weekly or monthly)

---

### 13. POST /api/users/me/report-schedules
**HTTP Status:** `201 Created` (new) or `200 OK` (updated)  
**Actual Response Structure:**
- Same as GET response item (single schedule object)
- Returns created or updated schedule
- Status code depends on whether it's a create (201) or update (200)

**Error Cases:**
- 400: Validation error (invalid type, day, or email)

---

### 14. GET /api/users/me/report-history
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
{
  "items": [
    {
      "report_history_id": "integer",
      "user_id": "integer",
      "type": "string",
      "format": "string (pdf, csv, etc.)",
      "file_path": "string | null",
      "description": "string | null",
      "time": "datetime",
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  ]
}
```
**Notes:**
- Wrapped in items array
- Paginated (limit, page query params)
- Ordered by time DESC, then id DESC
- Default limit: 20, default page: 1

---

### 15. POST /api/users/me/report-history
**HTTP Status:** `201 Created`  
**Actual Response Structure:**
- Same as GET item (single report history object)
- Returns the created record

**Error Cases:**
- 400: Validation error

---

## Admin Controller (`/api/admin`)

### 1. GET /api/admin/areas
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
[
  {
    "area_id": "integer",
    "user_id": "integer (who created)",
    "name": "string",
    "description": "string | null",
    "coordinates": "geometry object | null",
    "temp_threshold": "integer | null",
    "rain_threshold": "integer | null",
    "created_at": "datetime",
    "updated_at": "datetime"
  }
]
```
**Notes:**
- Array of area objects
- Filtered by current user's areas (user_id)
- Direct database query result

---

### 2. GET /api/admin/areas/{id}
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
- Same as single item from GET /api/admin/areas

**Error Cases:**
- 404: Area not found

---

### 3. POST /api/admin/areas
**HTTP Status:** `201 Created`  
**Actual Response Structure:**
- Same as area object structure
- Returns created area record

---

### 4. PUT /api/admin/areas/{id}
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
- Same as area object structure
- Returns updated area record

---

### 5. DELETE /api/admin/areas/{id}
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
- Expected: `{ message: "Area deleted successfully" }` (typical pattern)
- Returns deletion confirmation

---

### 6. GET /api/admin/areas/{id}/thresholds
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
{
  "temp_threshold": "integer | null",
  "rain_threshold": "integer | null"
}
```
**Notes:**
- Extracted from area object

---

### 7. PUT /api/admin/areas/{id}/thresholds
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
- Same as GET /api/admin/areas/{id}/thresholds

---

### 8. GET /api/admin/scenarios
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
[
  {
    "scenario_id": "integer",
    "area_id": "integer | null",
    "name": "string",
    "description": "string | null",
    "checklist_items": [
      {
        "item_id": "integer",
        "scenario_id": "integer",
        "task": "string",
        "completed": "boolean | null"
      }
    ],
    "created_at": "datetime",
    "updated_at": "datetime"
  }
]
```
**Notes:**
- Array of scenario objects
- Each scenario includes nested checklist_items
- Optional filtering by area_id query parameter

---

### 9. GET /api/admin/scenarios/{id}
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
- Same as scenario object from GET /api/admin/scenarios

---

### 10. POST /api/admin/scenarios
**HTTP Status:** `201 Created`  
**Actual Response Structure:**
- Same as scenario object structure

---

### 11. POST /api/admin/scenarios/{id}/items
**HTTP Status:** `201 Created`  
**Actual Response Structure:**
```json
{
  "item_id": "integer",
  "scenario_id": "integer",
  "task": "string",
  "completed": "boolean | null"
}
```
**Notes:**
- Single checklist item object
- Nested within scenarios but can be created separately

---

### 12. GET /api/admin/dashboard
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
- Complex dashboard object
- Expected fields: summary statistics, alerts, areas, scenarios
- Exact structure from `adminService.getDashboard()`

---

### 13. GET /api/admin/alerts
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
[
  {
    "alert_id": "integer",
    "user_id": "integer",
    "type": "string",
    "level": "string (low, medium, high, critical)",
    "area_id": "integer | null",
    "title": "string",
    "description": "string | null",
    "data": "json object | null",
    "created_by": "integer",
    "updated_by": "integer | null",
    "created_at": "datetime",
    "updated_at": "datetime"
  }
]
```
**Notes:**
- Array of alert event objects
- Supports filtering: type, level, area_id, start_date, end_date
- Supports pagination: limit, offset
- Direct database query result

---

### 14. GET /api/admin/alerts/{id}
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
- Same as alert object from GET /api/admin/alerts

---

### 15. POST /api/admin/alerts
**HTTP Status:** `201 Created`  
**Actual Response Structure:**
- Same as alert object structure

---

### 16. PUT /api/admin/alerts/{id}
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
- Same as alert object structure
- Returns updated alert

---

### 17. DELETE /api/admin/alerts/{id}
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
- Expected: `{ message: "Alert deleted successfully" }`

---

## Business Controller (`/api/business`)

### 1. GET /api/business/policies
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
[
  {
    "policy_id": "integer",
    "user_id": "integer",
    "name": "string",
    "description": "string | null",
    "triggers": "array of strings | null",
    "actions": "array of strings | null",
    "created_at": "datetime",
    "updated_at": "datetime"
  }
]
```
**Notes:**
- Array of policy objects
- Filtered by current user
- For both individual and business accounts

---

### 2. POST /api/business/policies
**HTTP Status:** `201 Created` (new) or `200 OK` (updated)  
**Actual Response Structure:**
- Single policy object (from result.policy)
- Status depends on whether created or updated
- Request body validation: returns 400 if body is empty

---

### 3. GET /api/business/dashboard
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
- Complex dashboard object
- Filtered by user_id
- Exact structure from `businessService.getDashboard()`

---

### 4. GET /api/business/reports/weekly
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
- Weekly report object
- Filtered by user_id
- Exact structure from `businessService.getWeeklyReport()`

---

## Analysis Controller (`/api/analysis`)

### 1. GET /api/analysis/forecast
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
{
  "success": true,
  "data": {
    "forecast": "weather forecast data object"
  }
}
```
**Notes:**
- Wrapped response with success flag and data envelope
- lat and lng query parameters required

**Error Cases:**
- 400: Missing lat or lng parameters
- Response: `{ success: false, message: "Latitude and longitude are required" }`

---

### 2. POST /api/analysis/assess-risk
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
{
  "success": true,
  "data": {
    "risk_assessment": "risk analysis object"
  }
}
```
**Notes:**
- Wrapped response with success flag and data envelope
- Request body: route_id, origin, destination, start_time, trip_id
- Requires authentication

---

## Map Controller (`/api/map`)

### 1. GET /api/map/traffic
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
- GeoJSON format object
- Exact structure from `mapService.getTrafficData()`
- Example: `{ "type": "FeatureCollection", "features": [...] }`

---

### 2. GET /api/map/weather-areas
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
[
  {
    "area_id": "integer",
    "name": "string",
    "coordinates": "geometry object",
    "current_weather": {
      "temperature": "number",
      "condition": "string",
      "humidity": "number | null"
    },
    "created_at": "datetime"
  }
]
```
**Notes:**
- Array of weather area objects
- Each area includes current weather data
- No authentication required

---

### 3. GET /api/map/incidents
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
[
  {
    "incident_id": "integer",
    "type": "string (flood, accident, etc.)",
    "location": "geometry object",
    "severity": "string (low, medium, high)",
    "description": "string",
    "reported_at": "datetime",
    "resolved_at": "datetime | null"
  }
]
```
**Notes:**
- Array of incident objects
- Includes location as geometry
- No authentication required

---

## OpenWeather Controller (`/api/weather`)

### 1. POST /api/weather/geo
**HTTP Status:** `200 OK`  
**Actual Response:**
- Direct OpenWeather API response (passthrough proxy)
- Parameters resolved from request body or query parameters

---

### 2. POST /api/weather/data/forecast
**HTTP Status:** `200 OK`  
**Actual Response:**
- Direct OpenWeather hourly forecast API response (passthrough)

---

### 3. POST /api/weather/data/forecast/hourly
**HTTP Status:** `200 OK`  
**Actual Response:**
- Direct OpenWeather hourly forecast API response (passthrough)

---

### 4. POST /api/weather/data/forecast/daily
**HTTP Status:** `200 OK`  
**Actual Response:**
- Direct OpenWeather daily forecast API response (passthrough)

---

### 5. POST /api/weather/data/weather
**HTTP Status:** `200 OK`  
**Actual Response:**
- Direct OpenWeather current weather API response (passthrough)

---

### 6. POST /api/weather/data/history/city
**HTTP Status:** `200 OK`  
**Actual Response:**
- Direct OpenWeather historical city data API response (passthrough)

---

## Prediction Controller (`/api/predictions`)

### 1. POST /api/predictions/risk-evaluate
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
{
  "success": true,
  "data": {
    "routeId": "integer",
    "riskAnalysis": "risk analysis object"
  }
}
```
**Notes:**
- Wrapped response with success flag
- Request body: routeId, startTime
- Route must exist, returns 404 if not found
- Requires authentication

**Error Cases:**
- 404: Route not found
- Response: `{ msg: "Route not found" }`

---

## Route Controller (`/api/routes`)

### 1. GET /api/routes/locations
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
{
  "success": true,
  "data": [
    {
      "location_id": "integer",
      "user_id": "integer",
      "name": "string",
      "address": "string | null",
      "coordinates": "geometry object",
      "type": "string (home, work, etc.)",
      "created_at": "datetime"
    }
  ]
}
```
**Notes:**
- Wrapped response with success flag and data envelope
- Array of location objects
- Filtered by current user

---

### 2. POST /api/routes/locations
**HTTP Status:** `201 Created`  
**Actual Response Structure:**
- Same as location object, wrapped in `{ success: true, data: {...} }`

---

### 3. PUT /api/routes/locations/{id}
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
- Same as location object, wrapped in `{ success: true, data: {...} }`

---

### 4. DELETE /api/routes/locations/{id}
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
{
  "success": true,
  "message": "Location deleted successfully"
}
```

---

### 5. GET /api/routes
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
{
  "success": true,
  "data": [
    {
      "route_id": "integer",
      "user_id": "integer",
      "name": "string",
      "description": "string | null",
      "origin": "geometry object",
      "destination": "geometry object",
      "waypoints": "geometry array | null",
      "distance": "number (km) | null",
      "duration": "number (minutes) | null",
      "is_favorite": "boolean",
      "created_at": "datetime"
    }
  ]
}
```
**Notes:**
- Wrapped response with success flag and data envelope
- Array of route objects
- Filtered by current user

---

### 6. POST /api/routes
**HTTP Status:** `201 Created`  
**Actual Response Structure:**
- Same as route object, wrapped in `{ success: true, data: {...} }`

---

### 7. GET /api/routes/favorites
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
- Same as GET /api/routes
- Alias endpoint, calls same getRoutes function

---

### 8. POST /api/routes/favorites
**HTTP Status:** `201 Created`  
**Actual Response Structure:**
- Same as POST /api/routes
- Alias endpoint, calls same createRoute function

---

### 9. GET /api/routes/favorites/{id}
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
{
  "success": true,
  "data": {
    "route_id": "integer",
    ...
  }
}
```
**Notes:**
- Single route object, wrapped in `{ success: true, data: {...} }`

---

### 10. PUT /api/routes/favorites/{id}
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
- Same as route object, wrapped in `{ success: true, data: {...} }`

---

### 11. DELETE /api/routes/favorites/{id}
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
{
  "success": true,
  "message": "Route deleted successfully"
}
```

---

### 12. GET /api/routes/{id}
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
- Same as GET /api/routes/favorites/{id}

---

### 13. PUT /api/routes/{id}
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
- Same as PUT /api/routes/favorites/{id}

---

### 14. DELETE /api/routes/{id}
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
- Same as DELETE /api/routes/favorites/{id}

---

### 15. GET /api/routes/history
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
{
  "success": true,
  "data": [
    {
      "search_id": "integer",
      "user_id": "integer",
      "origin": "geometry object",
      "destination": "geometry object",
      "route_count": "integer",
      "searched_at": "datetime"
    }
  ]
}
```
**Notes:**
- Array of search history objects
- Wrapped response with success flag

---

### 16. POST /api/routes/history
**HTTP Status:** `201 Created`  
**Actual Response Structure:**
- Same as history item, wrapped in `{ success: true, data: {...} }`

---

### 17. GET /api/routes/weather-history
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
{
  "success": true,
  "data": [
    {
      "search_id": "integer",
      "user_id": "integer",
      "location": "geometry object",
      "searched_at": "datetime"
    }
  ]
}
```
**Notes:**
- Array of weather search history objects

---

### 18. POST /api/routes/weather-history
**HTTP Status:** `201 Created`  
**Actual Response Structure:**
- Same as history item, wrapped in `{ success: true, data: {...} }`

---

### 19. GET /api/routes/{id}/analysis
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
{
  "success": true,
  "data": {
    "route_id": "integer",
    "weather_analysis": {
      "temperature": "number",
      "conditions": "string",
      "alerts": ["array of strings"]
    },
    "traffic_analysis": {
      "congestion": "number (0-100)",
      "estimated_delay": "number (minutes)",
      "incidents": ["array of incident objects"]
    }
  }
}
```
**Notes:**
- Complex analysis combining weather and traffic data
- Wrapped response with success flag

---

## Scenario Controller (`/api/response-scenarios`)

### 1. GET /api/response-scenarios
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
{
  "success": true,
  "data": [
    {
      "scenario_id": "integer",
      "user_id": "integer",
      "name": "string",
      "description": "string | null",
      "trigger_conditions": "json object",
      "response_steps": ["array of strings"],
      "created_at": "datetime"
    }
  ]
}
```
**Notes:**
- Array of scenario objects
- Filtered by current user
- Supports query filtering
- Wrapped response with success flag

---

### 2. POST /api/response-scenarios
**HTTP Status:** `201 Created`  
**Actual Response Structure:**
- Same as scenario object, wrapped in `{ success: true, data: {...} }`

---

### 3. GET /api/response-scenarios/{id}
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
- Same as scenario object, wrapped in `{ success: true, data: {...} }`

---

### 4. PUT /api/response-scenarios/{id}
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
- Same as scenario object, wrapped in `{ success: true, data: {...} }`

---

### 5. DELETE /api/response-scenarios/{id}
**HTTP Status:** `200 OK`  
**Actual Response Structure:**
```json
{
  "success": true,
  "message": "Scenario deleted successfully"
}
```

---

## Response Pattern Summary

### Common Response Patterns

**Pattern 1: Direct Data Response** (Most User/Admin/Business endpoints)
```json
{
  "field1": "value1",
  "field2": "value2"
}
```
- No wrapper object
- Direct Sequelize model response
- Controllers: user, admin, business

**Pattern 2: Wrapped Success Response** (Route, Analysis, Prediction, Scenario controllers)
```json
{
  "success": true,
  "data": { /* actual data */ }
}
```
- Includes success flag
- Data wrapped in envelope
- Standardized error handling

**Pattern 3: Wrapped Success Response with Message**
```json
{
  "success": true,
  "message": "Action completed",
  "data": { /* optional data */ }
}
```

**Pattern 4: Passthrough Proxy** (OpenWeather endpoints)
- Direct API response from OpenWeather
- No additional wrapping

**Pattern 5: Text Response** (Test endpoints)
- Plain text response, not JSON

---

## Error Handling Patterns

### Standard Error Pattern
- Errors handled via `asyncHandler` middleware
- Status codes: 400, 401, 403, 404, 500
- Error structure: Depends on middleware configuration
- Typical: `{ message: "Error description" }`

### Validation Errors
- 400 Bad Request
- Examples: Invalid enum values, missing required fields
- Response includes: `{ message: "validation error details" }`

### Authentication Errors
- 401 Unauthorized
- Missing or invalid JWT token

### Authorization Errors
- 403 Forbidden
- Insufficient role/permissions

### Not Found Errors
- 404 Not Found
- Resource doesn't exist

---

## Data Transformations & Processing

### 1. Password Hash Exclusion
- **Location:** userService.getProfile()
- **Applied to:** GET /api/users/me, PUT /api/users/me
- **Transformation:** Exclude password_hash from response
- **Reason:** Security

### 2. Token Generation
- **Location:** authService.login(), authService.refreshToken()
- **Applied to:** POST /api/auth/signin, /refresh-token
- **Transformation:** JWT token creation with claims (id, roles, account_type)
- **Reason:** Stateless authentication

### 3. Role Mapping
- **Location:** authService.login()
- **Applied to:** POST /api/auth/signin, /google
- **Transformation:** Extract role names from User->Roles association
- **Reason:** RBAC implementation

### 4. Schedule Formatting
- **Location:** userService._formatScheduleForResponse()
- **Applied to:** GET/POST /api/users/me/report-schedules
- **Transformation:** Format report_names and date handling
- **Reason:** Consistent date/time formatting

### 5. Threshold Extraction
- **Location:** adminService.getAreaThresholds()
- **Applied to:** GET /api/admin/areas/{id}/thresholds
- **Transformation:** Extract only temp_threshold and rain_threshold
- **Reason:** Simplified response for specific endpoint

### 6. Nested Relationship Loading
- **Location:** Sequelize include clauses
- **Applied to:** Multiple endpoints
- **Transformation:** Loading related models (IndividualUser, BusinessUser, Roles, etc.)
- **Reason:** Provide complete object graph

---

## Key Discrepancies Between Code and Swagger

### 1. Auth Signup Response
- **Swagger:** Shows user object with id, email, username
- **Code:** Matches swagger, includes message field (not documented)
- **Discrepancy:** message field not documented

### 2. User Test Endpoints
- **Swagger:** JSON responses expected
- **Code:** Plain text responses
- **Discrepancy:** Response format mismatch

### 3. Response Wrapping
- **Swagger:** Some endpoints documented without success flag
- **Code:** Route, Analysis, Prediction, Scenario endpoints use `{ success, data }` wrapper
- **Discrepancy:** Documentation incomplete

### 4. Error Responses
- **Swagger:** Generic status codes without detailed response structure
- **Code:** Error structure depends on asyncHandler and error middleware configuration
- **Discrepancy:** Error response format not documented in swagger

### 5. OpenWeather Endpoints
- **Swagger:** Documentation incomplete
- **Code:** Direct passthrough proxy to OpenWeather API
- **Discrepancy:** No schema definitions in swagger

### 6. Pagination
- **Swagger:** Not well documented
- **Code:** Implemented in report-history (limit, page params), forecasts (limit)
- **Discrepancy:** Pagination behavior not in swagger

---

## Authentication & Authorization

### Authentication Methods
1. **JWT Bearer Token**
   - Sent in Authorization header: `Bearer <token>`
   - Applied to: Most protected endpoints
   - Middleware: `authJwt.verifyToken`

2. **Public Endpoints** (No auth required)
   - GET /api/users/test/all
   - GET /api/map/traffic
   - GET /api/map/weather-areas
   - GET /api/map/incidents
   - POST /api/weather/* (proxy endpoints)

### Authorization Methods
1. **Role-Based Access Control (RBAC)**
   - Roles: user, moderator, admin, admin_officer, business
   - Middleware: `requireRole('role1', 'role2')`
   - Applied to: Admin routes, business-specific routes

2. **User-Specific Access**
   - Data filtered by req.user.id
   - Applied to: User profiles, preferences, notifications, routes, scenarios

---

## Summary Table

| Controller | Endpoints | Auth Required | Response Pattern | Status Codes |
|-----------|-----------|---------------|-----------------|--------------|
| Auth | 8 | Varies | Direct data + Message | 200, 201, 400, 401, 404 |
| User | 15 | Yes (except tests) | Direct data | 200, 201, 400, 404 |
| Admin | 17 | Yes (admin role) | Direct data | 200, 201, 400, 403, 404 |
| Business | 4 | Yes (business role) | Direct data | 200, 201, 400, 403 |
| Analysis | 2 | Yes | Wrapped (success + data) | 200, 400 |
| Map | 3 | No | Direct data (GeoJSON/array) | 200 |
| OpenWeather | 6 | No | Passthrough API | 200, 400+ |
| Prediction | 1 | Yes | Wrapped (success + data) | 200, 404 |
| Route | 19 | Yes | Wrapped (success + data) | 200, 201, 400, 404 |
| Scenario | 5 | Yes | Wrapped (success + data) | 200, 201, 400, 404 |

---

## Recommendations

1. **Standardize Response Format**
   - Consider wrapping all responses with consistent success/data/error structure
   - Apply to: Auth, User, Admin, Business controllers

2. **Complete Swagger Documentation**
   - Add missing error response schemas
   - Document response wrappers for Route/Analysis/Scenario controllers
   - Define OpenWeather endpoint responses
   - Document pagination parameters

3. **Fix Response Format Inconsistencies**
   - User test endpoints should return JSON, not plain text
   - Consistent message field naming across controllers

4. **Document Data Transformations**
   - Add notes about excluded fields (password_hash)
   - Document sorting/ordering behavior
   - Document filtering and pagination defaults

5. **Add Response Envelopes**
   - Consider wrapping deletion responses with standard format
   - Make error handling consistent across all controllers

6. **Type Documentation**
   - Add detailed type information for nested objects
   - Document enum values (levels, types, etc.)
   - Document geometry object format

---

**End of Report**
