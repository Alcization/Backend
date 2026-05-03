const API_BASE_URL = 'https://api.openweathermap.org';
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

    async getForecast(query) {
        return this._request(API_BASE_URL, '/data/2.5/forecast', query);
    }

    async getCurrentWeather(query) {
        return this._request(API_BASE_URL, '/data/2.5/weather', query);
    }

    async getCityHistory(query) {
        return this._request(HISTORY_BASE_URL, '/data/2.5/history/city', query);
    }
}

module.exports = new OpenWeatherService();
