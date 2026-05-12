const API_BASE_URL = 'https://api.openweathermap.org';
const PRO_API_BASE_URL = 'https://pro.openweathermap.org';
const HISTORY_BASE_URL = 'https://history.openweathermap.org';
const REQUEST_TIMEOUT_MS = 15000;

class OpenWeatherService {
    _getApiKey() {
        return process.env.OPENWEATHER_API_KEY || process.env.OWM_API_KEY || process.env.OPEN_WEATHER_API_KEY;
    }

    _buildQueryString(query = {}) {
        const params = new URLSearchParams();

        for (const [key, value] of Object.entries(query)) {
            if (key === 'appid') {
                continue;
            }

            if (value === undefined || value === null || value === '') {
                continue;
            }

            if (Array.isArray(value)) {
                value.forEach((item) => params.append(key, String(item)));
                continue;
            }

            params.append(key, String(value));
        }

        const apiKey = this._getApiKey();
        if (!apiKey) {
            const err = new Error('OpenWeather API key is not configured');
            err.status = 500;
            throw err;
        }

        params.set('appid', apiKey);
        return params.toString();
    }

    async _request(baseUrl, path, query = {}) {
        const queryString = this._buildQueryString(query);
        const url = `${baseUrl}${path}?${queryString}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        try {
            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal
            });

            const contentType = response.headers.get('content-type') || '';
            const isJson = contentType.includes('application/json');
            const payload = isJson ? await response.json() : await response.text();

            if (!response.ok) {
                const err = new Error(
                    payload && typeof payload === 'object' && payload.message
                        ? payload.message
                        : `OpenWeather request failed with status ${response.status}`
                );
                err.status = response.status;
                err.details = payload;
                throw err;
            }

            return payload;
        } catch (error) {
            if (error.name === 'AbortError') {
                const timeoutError = new Error('OpenWeather request timed out');
                timeoutError.status = 504;
                throw timeoutError;
            }

            throw error;
        } finally {
            clearTimeout(timeout);
        }
    }

    async getDirectGeocoding(query) {
        return this._request(API_BASE_URL, '/geo/1.0/direct', query);
    }

    async _resolveCoordinates(query = {}) {
        const lat = query.lat !== undefined ? Number(query.lat) : NaN;
        const lon = query.lon !== undefined ? Number(query.lon) : NaN;

        if (Number.isFinite(lat) && Number.isFinite(lon)) {
            return { lat, lon, name: query.name || query.q || null };
        }

        if (query.q) {
            const locations = await this.getDirectGeocoding({
                q: query.q,
                limit: query.limit || 1
            });

            const location = Array.isArray(locations) ? locations[0] : null;
            if (!location) {
                const err = new Error('Location not found');
                err.status = 404;
                throw err;
            }

            return {
                lat: location.lat,
                lon: location.lon,
                name: location.name || query.q
            };
        }

        const err = new Error('lat/lon or q is required');
        err.status = 400;
        throw err;
    }

    async _getHourlyForecast(query) {
        const coords = await this._resolveCoordinates(query);
        const data = await this._request(PRO_API_BASE_URL, '/data/2.5/forecast/hourly', {
            lat: coords.lat,
            lon: coords.lon,
            units: query.units || 'metric',
            lang: query.lang || 'vi'
        });

        return { coords, data };
    }

    async getHourlyForecast(query) {
        const { coords, data } = await this._getHourlyForecast(query);

        const hourlyList = Array.isArray(data.list) ? data.list.slice(0, 24) : [];

        return {
            location: coords,
            city: data.city || null,
            cnt: hourlyList.length,
            hourly: hourlyList.map((item) => ({
                dt: item.dt,
                temp: item.main?.temp,
                feels_like: item.main?.feels_like,
                pressure: item.main?.pressure,
                humidity: item.main?.humidity,
                clouds: item.clouds?.all,
                wind_speed: item.wind?.speed,
                wind_deg: item.wind?.deg,
                weather: item.weather,
                rain: item.rain,
                pop: item.pop
            }))
        };
    }

    async getDailyForecast(query) {
        const coords = await this._resolveCoordinates(query);
        const data = await this._request(API_BASE_URL, '/data/2.5/forecast/daily', {
            lat: coords.lat,
            lon: coords.lon,
            cnt: query.cnt || 7,
            units: query.units || 'metric',
            lang: query.lang || 'vi'
        });

        const dailyList = Array.isArray(data.list) ? data.list.slice(0, 7) : [];

        return {
            location: coords,
            city: data.city || null,
            cnt: dailyList.length,
            daily: dailyList.map((item) => ({
                dt: item.dt,
                sunrise: item.sunrise,
                sunset: item.sunset,
                temp: item.temp,
                pressure: item.pressure,
                humidity: item.humidity,
                wind_speed: item.speed,
                wind_deg: item.deg,
                weather: item.weather,
                clouds: item.clouds,
                rain: item.rain,
                pop : item.pop

            }))
        };
    }

    async getForecast(query) {
        return this.getHourlyForecast(query);
    }

    async getCurrentWeather(query) {
        return this._request(API_BASE_URL, '/data/2.5/weather', query);
    }

    async getCityHistory(query) {
        return this._request(HISTORY_BASE_URL, '/data/2.5/history/city', query);
    }
}

module.exports = new OpenWeatherService();
