```
import { useState, useEffect } from 'react';
import { Card, Typography, Box, Skeleton, Divider } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import WaterDropIcon from '@mui/icons-material/WaterDrop';

interface WeatherData {
    temperature: number;
    weatherCode: number;
    city: string;
}

// Weather codes mapping to icons/text
const getWeatherIcon = (code: number) => {
    if (code === 0 || code === 1) return <WbSunnyIcon sx={{ color: '#FFD700' }} />;
    if (code === 2 || code === 3) return <CloudIcon sx={{ color: '#90CAF9' }} />;
    if (code >= 45 && code <= 48) return <CloudIcon sx={{ color: '#B0BEC5' }} />; // Fog
    if (code >= 51 && code <= 67) return <WaterDropIcon sx={{ color: '#64B5F6' }} />; // Rain/Drizzle
    if (code >= 71 && code <= 77) return <AcUnitIcon sx={{ color: '#E0F7FA' }} />; // Snow
    if (code >= 80 && code <= 82) return <WaterDropIcon sx={{ color: '#42A5F5' }} />; // Rain showers
    if (code >= 85 && code <= 86) return <AcUnitIcon sx={{ color: '#B2EBF2' }} />; // Snow showers
    if (code >= 95 && code <= 99) return <ThunderstormIcon sx={{ color: '#5C6BC0' }} />; // Thunderstorm
    return <WbSunnyIcon />;
};

const getWeatherDescription = (code: number) => {
    const codes: Record<number, string> = {
        0: '晴朗', 1: '主晴', 2: '多云', 3: '阴天',
        45: '有雾', 48: '白霜',
        51: '小毛毛雨', 53: '毛毛雨', 55: '密毛毛雨',
        56: '冻毛毛雨', 57: '密冻毛毛雨',
        61: '小雨', 63: '中雨', 65: '大雨',
        66: '冷冻雨', 67: '强冷冻雨',
        71: '小雪', 73: '中雪', 75: '大雪',
        77: '雪粒',
        80: '小阵雨', 81: '中阵雨', 82: '大阵雨',
        85: '小阵雪', 86: '大阵雪',
        95: '雷雨', 96: '雷雨伴有冰雹', 99: '强雷雨伴有冰雹'
    };
    return codes[code] || '未知天气';
};

export default function WeatherWidget() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateStr, setDateStr] = useState('');
    const [timeStr, setTimeStr] = useState('');

    // Update time
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setDateStr(now.toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
            setTimeStr(now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
        };

        updateTime();
        const timer = setInterval(updateTime, 60000);
        return () => clearInterval(timer);
    }, []);

    // Fetch weather
    useEffect(() => {
        const fetchWeather = async () => {
            try {
                setLoading(true);
                // Default to Beijing if geolocation fails or not available
                let lat = 39.9042;
                let lon = 116.4074;
                let cityName = '北京';

                // Try to get location from IP API or simple IP check (simplified here to use fixed or browser API)
                // Note: In a real app we might use a dedicated IP location service.
                // For now, we try browser geolocation, if not, fallback.

                if (navigator.geolocation) {
                    try {
                        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                        });
                        lat = position.coords.latitude;
                        lon = position.coords.longitude;
                        cityName = '本地'; // Cannot reverse geocode easily without API key
                    } catch (e) {
                        // Permission denied or timeout, use default
                        console.log('Location access denied, using default');
                    }
                }

                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`
                );
const data = await response.json();

if (data.current_weather) {
    setWeather({
        temperature: data.current_weather.temperature,
        weatherCode: data.current_weather.weathercode,
        city: cityName
    });
}
            } catch (error) {
    console.error('Failed to fetch weather', error);
} finally {
    setLoading(false);
}
        };

fetchWeather();
// Refresh weather every 30 mins
const timer = setInterval(fetchWeather, 30 * 60 * 1000);
return () => clearInterval(timer);
    }, []);

return (
    <Card
        elevation={0}
        sx={{
            borderRadius: 50, // Pill shape
            px: 2,
            py: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            userSelect: 'none',
            border: '1px solid',
            borderColor: 'divider',
            width: 'fit-content',
            mx: 'auto', // Centered if needed, or remove if placed in header flex
        }}
    >
        {/* Date & Time */}
        <Box sx={{ textAlign: 'right' }}>
            <Typography variant='body2' fontWeight='600' lineHeight={1.2}>
                {formatTime(currentTime)}
            </Typography>
            <Typography variant='caption' color='text.secondary' sx={{ display: 'block', fontSize: '0.7rem' }}>
                {formatDate(currentTime)}
            </Typography>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ height: 24, my: 'auto' }} />

        {/* Weather */}
        {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Skeleton variant="circular" width={24} height={24} />
                <Skeleton variant="text" width={40} />
            </Box>
        ) : weather ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title={getWeatherDescription(weather.weathercode)}>
                    {getWeatherIcon(weather.weathercode)}
                </Tooltip>
                <Box>
                    <Typography variant='body2' fontWeight='600' lineHeight={1.2}>
                        {weather.temperature}°C
                    </Typography>
                    <Typography variant='caption' color='text.secondary' sx={{ display: 'block', fontSize: '0.7rem' }}>
                        {getWeatherDescription(weather.weathercode)}
                    </Typography>
                </Box>
            </Box>
        ) : (
            <Typography variant="caption" color="error">
                N/A
            </Typography>
        )}
    </Card>
);
}
