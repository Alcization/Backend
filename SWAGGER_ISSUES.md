# Swagger.yaml Validation Issues - Full Report

**Generated:** May 19, 2026  
**Status:** ⚠️ Multiple discrepancies found between swagger.yaml and actual API implementations

---

## 🔴 CRITICAL ISSUES (High Priority)

### 1. **Response Wrapping Not Documented**
Several controllers wrap responses with `{ success: true, data: {...} }` but swagger doesn't reflect this.

**Affected Endpoints:**
- Route Controller (19 endpoints): GET/POST /api/routes*, DELETE operations
- Scenario Controller (5 endpoints): GET/POST /api/response-scenarios*
- Analysis Controller: GET /api/analysis*
- Prediction Controller: POST /api/predictions*

**Current Swagger:** Shows bare data objects
```yaml
responses:
  '200':
    schema:
      type: array
      items:
        $ref: '#/components/schemas/Route'
```

**Actual Response:**
```json
{
  "success": true,
  "data": [
    { /* route object */ }
  ]
}
```

**Fix Required:** Add wrapper schema to all affected responses

---

### 2. **User Test Endpoints - Wrong Response Format**
Swagger documents these as JSON, but code returns plain text.

**Endpoints:**
- GET /api/users/test/all → Returns "Public Content." (plain text)
- GET /api/users/test/user → Returns "User Content." (plain text)
- GET /api/users/test/mod → Returns "Moderator Content." (plain text)
- GET /api/users/test/admin → Returns "Admin Content." (plain text)

**Current Swagger:**
```yaml
responses:
  '200':
    description: Success
```

**Fix Required:** Either:
- Change controller to return JSON: `res.json({ message: "..." })`
- Update swagger to reflect text/plain response

---

### 3. **Report Schedule Request Schema - Wrong Field Names**
POST /api/users/me/report-schedules request body doesn't match code.

**Current Swagger:**
```yaml
properties:
  frequency:
    enum: [daily, weekly, monthly]
  email: string
```

**Actual Code Requires:**
```javascript
{
  type: "weekly" | "monthly",    // NOT "frequency", and NO "daily"
  day: 2-8 (weekly) or 1-31 (monthly),  // NEW - required
  email: "user@example.com",     // required
  name: "weather,alerts,incidents"     // optional
}
```

**Fix Required:** Update swagger request schema

---

### 4. **Missing Response Wrappers in Route/Scenario Controllers**
All DELETE operations return wrapped responses but swagger shows bare objects.

**Example - DELETE /api/routes/locations/{id}:**
**Actual Response:**
```json
{
  "success": true,
  "message": "Location deleted successfully"
}
```

**Current Swagger:** Not documented

**Fix Required:** Add proper response schema for all delete operations

---

## 🟠 MAJOR ISSUES (Medium Priority)

### 5. **Auth Endpoints Missing Message Field**
All auth endpoints return extra `message` field not documented in swagger.

**Example - POST /api/auth/signup:**

**Current Swagger:** Only shows user object
**Actual Response:**
```json
{
  "message": "User registered successfully!",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "user123"
  }
}
```

**Affected:** 
- POST /api/auth/signup
- POST /api/auth/send-otp
- POST /api/auth/verify-otp
- POST /api/auth/reset-password
- POST /api/auth/logout

**Fix Required:** Add message field to response schemas

---

### 6. **OpenWeather Endpoints - Incomplete Documentation**
6 endpoints exist in code but are either missing from swagger or poorly documented.

**Endpoints:**
- POST /api/weather/geo - Missing schema
- POST /api/weather/data/weather - Missing schema
- POST /api/weather/data/forecast - Missing schema
- POST /api/weather/data/forecast/hourly - Missing schema
- POST /api/weather/data/forecast/daily - Missing schema
- POST /api/weather/data/history/city - Missing schema

**Current Swagger:** Generic descriptions only
**Fix Required:** Add proper request/response schemas for all weather endpoints

---

### 7. **Admin Scenarios Endpoint Has Wrong Field Names**
GET /api/admin/scenarios returns different structure than GET /api/response-scenarios.

**Admin Scenarios Response:**
```json
{
  "scenario_id": "integer",
  "area_id": "integer | null",
  "name": "string",
  "checklist_items": [{ "item_id", "task", "completed" }]
}
```

**Response Scenarios Response:**
```json
{
  "success": true,
  "data": [{
    "scenario_id": "integer",
    "response_steps": ["array of strings"],
    "trigger_conditions": "json object"
  }]
}
```

**Current Swagger:** Treats them similarly
**Fix Required:** Define separate schemas for Admin vs Response Scenarios

---

### 8. **Report History Response Structure Wrong**
GET /api/users/me/report-history returns wrapped response not documented in swagger.

**Current Swagger:**
```yaml
schema:
  $ref: '#/components/schemas/ReportHistoryList'
```

**Actual Response:**
```json
{
  "items": [
    {
      "report_history_id": "integer",
      "user_id": "integer",
      "type": "string",
      "format": "string",
      "file_path": "string | null",
      "description": "string | null",
      "time": "datetime",
      "created_at": "datetime"
    }
  ]
}
```

**Fix Required:** Correct field names and response structure in swagger

---

## 🟡 MINOR ISSUES (Low Priority)

### 9. **Missing Error Response Schemas**
No error response schemas defined for validation errors, auth errors, etc.

**Fix Required:** Add components/responses section with standard error schemas:
```yaml
responses:
  UnauthorizedError:
    description: Missing or invalid authentication token
    schema:
      $ref: '#/components/schemas/Error'
  ValidationError:
    description: Invalid request parameters
```

---

### 10. **Pagination Not Documented**
Several endpoints support pagination but it's not in swagger.

**Endpoints with Pagination:**
- GET /api/users/notifications (limit query param)
- GET /api/users/me/report-history (limit, page query params)
- GET /api/admin/alerts (limit, offset)
- POST /api/weather/data/forecast (limit)

**Fix Required:** Add query parameters to swagger:
```yaml
parameters:
  - name: limit
    in: query
    type: integer
    default: 20
  - name: page
    in: query
    type: integer
    default: 1
```

---

### 11. **Data Filtering Not Documented**
Several endpoints support filtering but it's not documented.

**Examples:**
- GET /api/users/me/report-schedules - Supports type filter
- GET /api/admin/scenarios - Supports area_id filter
- GET /api/admin/alerts - Supports type, level, area_id, start_date, end_date filters
- GET /api/response-scenarios - Supports filtering

**Fix Required:** Add query parameter documentation

---

### 12. **Incorrect Enum Values**
Several enums in swagger don't match code.

**Report Schedule Type:**
- Swagger: `[daily, weekly, monthly]`
- Code: `[weekly, monthly]` - NO daily!

**Alert Level:**
- Swagger: `[low, medium, high, critical]`
- Code: Same ✓

**Schedule Day:**
- Swagger: Not documented (crucial info missing!)
- Code: 2-8 for weekly (Monday=2, Sunday=8), 1-31 for monthly

---

## 📋 ENDPOINTS STATUS CHECKLIST

### ✅ CORRECT (13 endpoints)
- POST /api/auth/signin
- POST /api/auth/google  
- POST /api/auth/logout
- POST /api/auth/refresh-token
- GET /api/users/me
- PUT /api/users/me
- GET /api/users/me/preferences
- PUT /api/users/me/preferences
- GET /api/users/notifications
- PUT /api/users/notifications/{id}/read
- GET /api/admin/areas
- GET /api/admin/areas/{id}
- GET /api/admin/areas/{id}/thresholds

### ⚠️ NEEDS FIX (60+ endpoints)
- **Response wrapping issues:** Route (19), Scenario (5), Analysis (2), Prediction (1)
- **Wrong request schema:** POST /api/users/me/report-schedules
- **Missing documentation:** OpenWeather (6), Pagination, Filtering
- **Text vs JSON:** User test endpoints (4)
- **Missing message field:** Auth endpoints (5)
- **Incorrect enums:** Report schedule type
- **Wrong field names:** Report history, Admin scenarios
- **Missing error schemas:** All error cases

---

## 🔧 RECOMMENDED FIXES (Priority Order)

### Phase 1 - CRITICAL (Fix immediately)
1. ❌ Fix POST /api/users/me/report-schedules request schema (type/day/email)
2. ❌ Add response wrapping to Route controller endpoints
3. ❌ Add response wrapping to Scenario controller endpoints
4. ❌ Fix user test endpoints (return JSON instead of text)

### Phase 2 - HIGH (Fix soon)
5. ❌ Add message fields to auth response schemas
6. ❌ Document OpenWeather endpoint schemas
7. ❌ Add pagination parameters to affected endpoints
8. ❌ Fix enum values (remove "daily" from report schedules)

### Phase 3 - MEDIUM (Fix during next review)
9. ⚠️ Add error response schemas
10. ⚠️ Document query filters
11. ⚠️ Fix field names in report history response
12. ⚠️ Add response wrapping schemas for admin operations

### Phase 4 - OPTIONAL (Improvements)
13. ℹ️ Standardize response format across all controllers
14. ℹ️ Add data transformation documentation
15. ℹ️ Add examples to swagger for clarity

---

## Impact Analysis

**High Impact Issues:** 4
- Breaks client implementation if not fixed
- Causes integration failures

**Medium Impact Issues:** 4  
- Causes confusion and misintegration
- Requires workarounds

**Low Impact Issues:** 4
- Documentation clarity only
- No functional impact

**Total Issues:** 12 categories, 60+ individual endpoints affected

---

## Testing Recommendations

1. **Manual API Testing:**
   - Test POST /api/users/me/report-schedules with correct fields
   - Test Route DELETE operations to confirm wrapped response
   - Test user test endpoints to see actual response format

2. **Swagger Validation:**
   - Use Swagger Editor to validate updated swagger.yaml
   - Ensure no schema reference errors

3. **Integration Testing:**
   - Update client code to expect wrapped responses where applicable
   - Test error handling with proper status codes

---

**Next Step:** Proceed with fixing issues in Phase 1 order
