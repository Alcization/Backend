// Giả lập gọi Python Service
class AIService {
    async calculateRisk(routePoints, startTime) {
        // Logic thực tế: 
        // 1. Lấy tọa độ từ routePoints
        // 2. Query DB lấy WeatherForecast tại tọa độ đó vào startTime
        // 3. Query TrafficReading gần nhất
        // 4. Chạy thuật toán đánh giá
        
        // Mock response
        const mockWeather = "Heavy Rain";
        const trafficStatus = "Congested";
        
        let riskLevel = "Low";
        if (mockWeather === "Heavy Rain" || trafficStatus === "Congested") {
            riskLevel = "High";
        }

        return {
            risk_level: riskLevel,
            factors: { weather: mockWeather, traffic: trafficStatus },
            suggestion: riskLevel === "High" ? "Cân nhắc dời lịch trình hoặc đổi tuyến đường" : "Lộ trình an toàn"
        };
    }
}

module.exports = new AIService();