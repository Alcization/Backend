# Weather Proxy API Documentation

Tai lieu nay mo ta cac endpoint backend proxy den OpenWeather de frontend khong can gui API key ra ngoai.

## Tong quan

- Base URL local: `http://localhost:3000`
- API prefix: `/api/weather`
- Method: tat ca la `POST`
- Authentication: khong yeu cau JWT
- API key OpenWeather duoc backend tu dong chen qua bien moi truong:
  - `OPENWEATHER_API_KEY`
  - hoac `OWM_API_KEY`
  - hoac `OPEN_WEATHER_API_KEY`

## Luu y quan trong

- Frontend gui tham so qua JSON body (vi du `lat`, `lon`, `q`, `units`).
- Frontend khong gui `appid`.
- Neu frontend co gui `appid`, backend se bo qua va dung key noi bo.
- Backend giu nguyen du lieu tra ve tu OpenWeather de frontend de thay the endpoint cu.

---

## 1) Direct Geocoding

Backend endpoint:

`POST /api/weather/geo/1.0/direct`

External endpoint duoc proxy:

`GET https://api.openweathermap.org/geo/1.0/direct`

### Body params thong dung

- `q` (required): ten thanh pho, dia diem hoac dinh danh khu vuc.
- `limit` (optional): so ket qua toi da (vi du: `5`).

### Vi du request

```http
POST /api/weather/geo/1.0/direct
Content-Type: application/json

{
  "q": "Ho Chi Minh",
  "limit": 5
}
```

### Vi du response (rut gon)

```json
[
  {
    "name": "Ho Chi Minh City",
    "lat": 10.8231,
    "lon": 106.6297,
    "country": "VN",
    "state": "Ho Chi Minh"
  }
]
```

---

## 2) 5 day / 3 hour Forecast

Backend endpoint:

`POST /api/weather/data/2.5/forecast`

External endpoint duoc proxy:

`GET https://api.openweathermap.org/data/2.5/forecast`

### Body params thong dung

- `lat` + `lon` (required neu khong dung `q`): toa do.
- `q` (optional): ten dia diem.
- `units` (optional): `standard` | `metric` | `imperial`.
- `lang` (optional): ngon ngu mo ta thoi tiet.

### Vi du request

```http
POST /api/weather/data/2.5/forecast
Content-Type: application/json

{
  "lat": 10.8231,
  "lon": 106.6297,
  "units": "metric",
  "lang": "vi"
}
```

### Vi du response (rut gon)

```json
{
  "cod": "200",
  "list": [
    {
      "dt": 1714021200,
      "main": {
        "temp": 30.1,
        "humidity": 72
      },
      "weather": [
        {
          "main": "Clouds",
          "description": "may rai rac"
        }
      ]
    }
  ],
  "city": {
    "name": "Ho Chi Minh City"
  }
}
```

---

## 3) Current Weather

Backend endpoint:

`POST /api/weather/data/2.5/weather`

External endpoint duoc proxy:

`GET https://api.openweathermap.org/data/2.5/weather`

### Body params thong dung

- `lat` + `lon` (required neu khong dung `q`): toa do.
- `q` (optional): ten dia diem.
- `units` (optional): `standard` | `metric` | `imperial`.
- `lang` (optional): ngon ngu mo ta thoi tiet.

### Vi du request

```http
POST /api/weather/data/2.5/weather
Content-Type: application/json

{
  "lat": 10.8231,
  "lon": 106.6297,
  "units": "metric",
  "lang": "vi"
}
```

### Vi du response (rut gon)

```json
{
  "weather": [
    {
      "main": "Rain",
      "description": "mua nhe"
    }
  ],
  "main": {
    "temp": 29.2,
    "feels_like": 34.1,
    "humidity": 78
  },
  "wind": {
    "speed": 3.4
  },
  "name": "Ho Chi Minh City"
}
```

---

## 4) City History

Backend endpoint:

`POST /api/weather/data/2.5/history/city`

External endpoint duoc proxy:

`GET https://history.openweathermap.org/data/2.5/history/city`

### Body params thong dung

- `id` (required): city id theo OpenWeather.
- `type` (optional): loai du lieu lich su.
- `start` (optional): unix timestamp bat dau.
- `end` (optional): unix timestamp ket thuc.
- `cnt` (optional): so ban ghi.
- `units` (optional): `standard` | `metric` | `imperial`.

### Vi du request

```http
POST /api/weather/data/2.5/history/city
Content-Type: application/json

{
  "id": 1566083,
  "type": "hour",
  "start": 1713830400,
  "end": 1713916800,
  "units": "metric"
}
```

### Vi du response (rut gon)

```json
{
  "message": "",
  "cod": "200",
  "city_id": 1566083,
  "list": [
    {
      "dt": 1713834000,
      "main": {
        "temp": 30.4,
        "humidity": 70
      }
    }
  ]
}
```

---

## Loi va status code

Backend se tra ma loi phu hop theo ket qua tu OpenWeather:

- `400`: query khong hop le.
- `401`: key khong hop le/khong du quyen.
- `404`: khong tim thay du lieu.
- `429`: vuot rate limit.
- `500`: backend chua cau hinh API key.
- `504`: backend goi OpenWeather bi timeout.

### Vi du error response

```json
{
  "message": "city not found"
}
```

## Kiem tra nhanh bang curl

```bash
curl -X POST "http://localhost:3000/api/weather/geo/1.0/direct" -H "Content-Type: application/json" -d "{\"q\":\"Da Nang\",\"limit\":3}"
curl -X POST "http://localhost:3000/api/weather/data/2.5/weather" -H "Content-Type: application/json" -d "{\"lat\":16.0544,\"lon\":108.2022,\"units\":\"metric\"}"
curl -X POST "http://localhost:3000/api/weather/data/2.5/forecast" -H "Content-Type: application/json" -d "{\"lat\":16.0544,\"lon\":108.2022,\"units\":\"metric\"}"
```
