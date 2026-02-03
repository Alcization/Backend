# API Documentation - Weather Traffic Backend

Base URL: `http://localhost:3000/api`

## Table of Contents
- [Authentication](#authentication)
- [User Profile](#user-profile)
- [User Preferences](#user-preferences)
- [Notifications](#notifications)
- [Route & Location Management](#route--location-management)
- [Prediction & Risk Assessment](#prediction--risk-assessment)
- [Map & Real-time Data](#map--real-time-data)
- [Business Features](#business-features)
- [Admin & Response Scenarios](#admin--response-scenarios)
- [Error Handling](#error-handling)

---

## Authentication

### Register User
Create a new user account (Individual or Business).

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "role": "individual",
  "fullName": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "role": "individual",
  "status": "active",
  "created_at": "2025-11-27T10:00:00.000Z"
}
```

---

### Login with Email/Password
**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "role": "individual"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6..."
}
```

---

### Login with Google
**Endpoint:** `POST /auth/login/google`

**Request Body:**
```json
{
  "idToken": "google_id_token_from_frontend"
}
```

---

### Refresh Access Token
**Endpoint:** `POST /auth/refresh-token`

**Request Body:**
```json
{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## User Profile

### Get Current User Profile
**Endpoint:** `GET /users/me`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "role": "individual",
  "phone_number": "+84901234567",
  "language": "vi",
  "IndividualUser": {
    "full_name": "John Doe"
  }
}
```

---

### Update User Profile
**Endpoint:** `PUT /users/me`

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
**Endpoint:** `GET /users/me/preferences`

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
**Endpoint:** `PUT /users/me/preferences`

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
**Endpoint:** `GET /users/notifications`

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
    "noti_event_id": 1,
    "name": "Heavy Traffic Alert",
    "description": "Heavy traffic detected",
    "type": "Traffic",
    "is_read": false,
    "issue_at": "2025-11-27T10:00:00.000Z"
  }
]
```

---

### Mark Notification as Read
**Endpoint:** `PUT /users/notifications/:id/read`

**Headers:**
```
Authorization: Bearer <access_token>
```

---

## Route & Location Management

### Get Saved Locations
Get all saved locations for the authenticated user.

**Endpoint:** `GET /routes/locations`

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

**Endpoint:** `POST /routes/locations`

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

### Get Saved Routes
Get all saved routes for the authenticated user.

**Endpoint:** `GET /routes`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "route_id": 1,
      "user_id": 1,
      "name": "Daily Commute",
      "distance": 12.5,
      "waypoints": [
        {"lat": 10.7850, "lng": 106.7100},
        {"lat": 10.7950, "lng": 106.7150}
      ],
      "created_at": "2025-11-27T09:00:00.000Z"
    }
  ]
}
```

---

### Create Route
Create and save a new route with start, end, and optional waypoints.

**Endpoint:** `POST /routes`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Home to Office",
  "start": {
    "lat": 10.7769,
    "lng": 106.7009
  },
  "end": {
    "lat": 10.8050,
    "lng": 106.7200
  },
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
    "name": "Home to Office",
    "distance": 12.5,
    "created_at": "2025-11-27T13:00:00.000Z"
  }
}
```

---

### Get Route Details
Get detailed information about a specific route including segments.

**Endpoint:** `GET /routes/:id`

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

### Get Route Analysis
Get comprehensive weather and traffic analysis along a specific route. **This is the key endpoint for trip planning.**

**Endpoint:** `GET /routes/:id/analysis`

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

**Endpoint:** `GET /analysis/forecast?lat={lat}&lng={lng}`

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
    "total_users": 1523,
    "active_users_7d": 342,
    "alerts_24h": 156
  },
  "users_by_role": [
    { "role": "individual", "count": 1200 },
    { "role": "business", "count": 300 },
    { "role": "admin", "count": 23 }
  ],
  "admin_areas": 15,
  "response_scenarios": 45,
  "scenarios_by_type": [
    { "applicable_event_type": "Flood", "count": 20 },
    { "applicable_event_type": "Accident", "count": 15 },
    { "applicable_event_type": "Traffic Jam", "count": 10 }
  ],
  "timestamp": "2025-11-27T15:30:00.000Z"
}
```

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

**Get Areas:**
```bash
curl http://localhost:3000/api/admin/areas \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Create Area:**
```bash
curl -X POST http://localhost:3000/api/admin/areas \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"District 5","area_type":"urban"}'
```

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
- `administrative_officer` - Admin officers
- `admin_area` - Managed geographical areas
- `response_scenario` - Emergency response plans
- `checklist_item` - Action items in scenarios

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
