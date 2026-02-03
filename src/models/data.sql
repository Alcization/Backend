DROP DATABASE IF EXISTS weather_traffic;
CREATE DATABASE weather_traffic;

CREATE TABLE user_account (
    user_id          SERIAL PRIMARY KEY,
    email            VARCHAR(255) UNIQUE NOT NULL,
    password_hash    TEXT NOT NULL,
    google_id        VARCHAR(255) UNIQUE,
    phone_number     VARCHAR(50),
    language         VARCHAR(50) DEFAULT 'vi',
    created_at       TIMESTAMP DEFAULT NOW(),
    status           VARCHAR(50) DEFAULT 'active',
    account_type     VARCHAR(50) NOT NULL -- 'individual', 'business', 'admin_officer'
);

-- Subtype: INDIVIDUAL USER
CREATE TABLE individual_user (
    individual_id SERIAL PRIMARY KEY,
    user_id       INT UNIQUE REFERENCES user_account(user_id) ON DELETE CASCADE,
    full_name     VARCHAR(255)
);

-- Subtype: BUSINESS USER
CREATE TABLE business_user (
    business_id   SERIAL PRIMARY KEY,
    user_id       INT UNIQUE REFERENCES user_account(user_id) ON DELETE CASCADE,
    company_name  VARCHAR(255),
    tax_code      VARCHAR(50)
);

CREATE TABLE alert_policy (
    policy_id     SERIAL PRIMARY KEY,
    business_id   INT REFERENCES business_user(business_id) ON DELETE CASCADE,
    name          VARCHAR(255),
    description   TEXT,
    start_hour    TIME,
    end_hour      TIME,
    week_day      VARCHAR(20), -- 'Mon,Tue,Wed...'
    status        BOOLEAN DEFAULT TRUE
);

CREATE TABLE alert_event (
    alert_event_id SERIAL PRIMARY KEY,
    policy_id      INT REFERENCES alert_policy(policy_id) ON DELETE CASCADE,
    name           VARCHAR(255),
    type           VARCHAR(50),
    description    TEXT,
    issue_at       TIMESTAMP DEFAULT NOW()
);

-- Subtype: ADMINISTRATIVE OFFICER
CREATE TABLE administrative_officer (
    officer_id    SERIAL PRIMARY KEY,
    user_id       INT UNIQUE REFERENCES user_account(user_id) ON DELETE CASCADE,
    department    VARCHAR(255)
);

CREATE TABLE admin_area (
    area_id        SERIAL PRIMARY KEY,
    officer_id     INT REFERENCES administrative_officer(officer_id),
    name           VARCHAR(255),
    area_type      VARCHAR(50),
    boundary_polygon TEXT -- GeoJSON or Polygon data
);

CREATE TABLE response_scenario (
    scenario_id    SERIAL PRIMARY KEY,
    area_id        INT REFERENCES admin_area(area_id) ON DELETE CASCADE,
    name           VARCHAR(255),
    applicable_event_type VARCHAR(100) -- Flood, Traffic Jam, Accident
);

CREATE TABLE checklist_item (
    item_id        SERIAL PRIMARY KEY,
    scenario_id    INT REFERENCES response_scenario(scenario_id) ON DELETE CASCADE,
    name           VARCHAR(255),
    description    TEXT,
    item_order     INT
);

-- SAVED LOCATION
CREATE TABLE saved_location (
    location_id   SERIAL PRIMARY KEY,
    user_id       INT REFERENCES user_account(user_id) ON DELETE CASCADE,
    custom_name   VARCHAR(255),
    address       TEXT,
    coordinate    POINT, -- PostgreSQL geometric type (x,y) -> (lat, long)
    latitude      DECIMAL(10,6),
    longitude     DECIMAL(10,6)
);

-- NOTIFICATION PREFERENCE
CREATE TABLE notification_preference (
    pref_id       SERIAL PRIMARY KEY,
    user_id       INT REFERENCES user_account(user_id) ON DELETE CASCADE,
    noti_type     VARCHAR(50), -- Traffic, Flood, System
    threshold     INT,         -- Mức độ kích hoạt
    issue_at      TIMESTAMP DEFAULT NOW()
);

-- NOTI EVENT
CREATE TABLE noti_event (
    noti_event_id SERIAL PRIMARY KEY,
    user_id       INT REFERENCES user_account(user_id) ON DELETE CASCADE,
    name          VARCHAR(255),
    description   TEXT,
    type          VARCHAR(50),
    issue_at      TIMESTAMP DEFAULT NOW(),
    is_read       BOOLEAN DEFAULT FALSE
);

-- SAVED ROUTE
CREATE TABLE saved_route (
    route_id      SERIAL PRIMARY KEY,
    user_id       INT REFERENCES individual_user(user_id) ON DELETE CASCADE,
    name          VARCHAR(255),
    start_point   POINT,
    end_point     POINT,
    waypoints     TEXT, -- JSON or String representation of path
    distance      FLOAT
);

-- ROUTE SEGMENT
CREATE TABLE route_segment (
    segment_id    SERIAL PRIMARY KEY,
    saved_route_id INT REFERENCES saved_route(route_id) ON DELETE SET NULL, -- Optional link
    start_point   POINT,
    end_point     POINT,
    coordinate    path,
    order_in_route INT
);

-- TRAFFIC READING
CREATE TABLE traffic_reading (
    reading_id    SERIAL PRIMARY KEY,
    segment_id    INT REFERENCES route_segment(segment_id) ON DELETE CASCADE,
    velocity      FLOAT,
    traffic_state VARCHAR(50), -- LOS: Level of Service (A, B, C, D, E, F)
    time_reading  TIMESTAMP DEFAULT NOW()
);

-- WEATHER AREA
CREATE TABLE weather_area (
    area_id       SERIAL PRIMARY KEY,
    center_point  POINT,
    name          VARCHAR(255)
);

-- Link Route Segment to Weather Area
CREATE TABLE segment_weather_area (
    segment_id    INT REFERENCES route_segment(segment_id),
    area_id       INT REFERENCES weather_area(area_id),
    PRIMARY KEY (segment_id, area_id)
);

-- TIME SLOT
CREATE TABLE time_slot (
    timeslot_id   SERIAL PRIMARY KEY,
    area_id       INT REFERENCES weather_area(area_id) ON DELETE CASCADE,
    time_value    TIMESTAMP NOT NULL
);

-- WEATHER FORECAST
CREATE TABLE weather_forecast (
    forecast_id   SERIAL PRIMARY KEY,
    timeslot_id   INT REFERENCES time_slot(timeslot_id) ON DELETE CASCADE,
    issue_time    TIMESTAMP,
    accuracy      FLOAT,
    precip        FLOAT,
    uv_index      FLOAT,
    feels_like    FLOAT
);

-- WEATHER READING
CREATE TABLE weather_reading (
    reading_id    SERIAL PRIMARY KEY,
    timeslot_id   INT REFERENCES time_slot(timeslot_id) ON DELETE CASCADE,
    temp          FLOAT,
    feelslike     FLOAT,
    dew           FLOAT,
    humidity      FLOAT,
    precip        FLOAT,
    precipprob    FLOAT,
    preciptype    VARCHAR(100),
    windgust      FLOAT,
    windspeed     FLOAT,
    winddir       FLOAT,
    cloudcover    FLOAT,
    visibility    FLOAT,
    solarradiation FLOAT,
    solarenergy   FLOAT,
    uvindex       FLOAT,
    conditions    VARCHAR(255),
    icon          VARCHAR(100),
    stations      VARCHAR(100)
);

-- TRIP
CREATE TABLE trip (
    trip_id        SERIAL PRIMARY KEY,
    user_id        INT REFERENCES user_account(user_id) ON DELETE CASCADE,
    origin         POINT,
    destination    POINT,
    time_departure TIMESTAMP,
    status         VARCHAR(50) -- Scheduled, Ongoing, Completed
);

-- RISK ASSESSMENT
CREATE TABLE risk_assessment (
    assessment_id  SERIAL PRIMARY KEY,
    trip_id        INT UNIQUE REFERENCES trip(trip_id) ON DELETE CASCADE,
    risk_level     VARCHAR(50), -- Low, Medium, High, Critical
    suggest_action TEXT,
    advisor_note   TEXT
);

