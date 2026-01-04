import { useState, useEffect } from 'react';
import { Wind, Droplets, Eye, Menu, ChevronRight, ChevronDown, Search, Clock, MapPin, Heart } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from './components/ui/drawer';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface WeatherData {
  temp: number;
  description: string;
  wind: number;
  humidity: number;
  visibility: number;
  city: string;
  date: string;
  time: string;
  feels_like: number;
  temp_min: number;
  temp_max: number;
}

interface ForecastDay {
  date: string;
  day: string;
  temp: number;
}

export default function App() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('Paris');
  const [searchInput, setSearchInput] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [bgColor, setBgColor] = useState('bg-yellow-400');
  const [cardBgColor, setCardBgColor] = useState('bg-yellow-300');
  const [hoverColor, setHoverColor] = useState('hover:bg-yellow-500');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [savedCities, setSavedCities] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>('');

  const API_KEY = '515baf0860975c22479605b733774607';
  const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-95efc439`;

  // Weather-based color schemes inspired by design references
  const getWeatherColorScheme = (weatherCondition: string, temperature: number) => {
    const condition = weatherCondition.toLowerCase();
    const hour = new Date().getHours();
    const isNight = hour >= 20 || hour < 6;
    
    // Helper function to randomly select from an array of color schemes
    const getRandomScheme = (schemes: Array<{bg: string, card: string, hover: string}>) => {
      return schemes[Math.floor(Math.random() * schemes.length)];
    };
    
    // Rainy - Dark gray/black for night, blue tones for day
    if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('thunderstorm')) {
      if (isNight) {
        return getRandomScheme([
          { bg: 'bg-gray-800', card: 'bg-gray-700', hover: 'hover:bg-gray-900' },
          { bg: 'bg-slate-800', card: 'bg-slate-700', hover: 'hover:bg-slate-900' },
          { bg: 'bg-zinc-800', card: 'bg-zinc-700', hover: 'hover:bg-zinc-900' },
        ]);
      }
      return getRandomScheme([
        { bg: 'bg-blue-400', card: 'bg-blue-300', hover: 'hover:bg-blue-500' },
        { bg: 'bg-sky-400', card: 'bg-sky-300', hover: 'hover:bg-sky-500' },
        { bg: 'bg-indigo-400', card: 'bg-indigo-300', hover: 'hover:bg-indigo-500' },
      ]);
    }
    
    // Sunny/Clear - Orange for hot, light gray-green for pleasant, dark for night
    if (condition.includes('clear') || condition.includes('sun')) {
      if (isNight) {
        return getRandomScheme([
          { bg: 'bg-gray-800', card: 'bg-gray-700', hover: 'hover:bg-gray-900' },
          { bg: 'bg-slate-800', card: 'bg-slate-700', hover: 'hover:bg-slate-900' },
          { bg: 'bg-zinc-800', card: 'bg-zinc-700', hover: 'hover:bg-zinc-900' },
        ]);
      }
      if (temperature > 25) {
        // Hot & Sunny - Light orange (Phoenix style)
        return getRandomScheme([
          { bg: 'bg-orange-300', card: 'bg-orange-200', hover: 'hover:bg-orange-400' },
          { bg: 'bg-orange-400', card: 'bg-orange-300', hover: 'hover:bg-orange-500' },
          { bg: 'bg-amber-300', card: 'bg-amber-200', hover: 'hover:bg-amber-400' },
        ]);
      } else {
        // Pleasant & Sunny - Light gray-green (London style)
        return getRandomScheme([
          { bg: 'bg-lime-200', card: 'bg-lime-100', hover: 'hover:bg-lime-300' },
          { bg: 'bg-emerald-200', card: 'bg-emerald-100', hover: 'hover:bg-emerald-300' },
          { bg: 'bg-teal-200', card: 'bg-teal-100', hover: 'hover:bg-teal-300' },
          { bg: 'bg-green-200', card: 'bg-green-100', hover: 'hover:bg-green-300' },
        ]);
      }
    }
    
    // Cloudy - Light beige/brown (Beijing style) or light green (Paris style)
    if (condition.includes('cloud')) {
      if (temperature > 25) {
        // Hot but cloudy - Warm beige/brown
        return getRandomScheme([
          { bg: 'bg-amber-200', card: 'bg-amber-100', hover: 'hover:bg-amber-300' },
          { bg: 'bg-stone-200', card: 'bg-stone-100', hover: 'hover:bg-stone-300' },
          { bg: 'bg-orange-200', card: 'bg-orange-100', hover: 'hover:bg-orange-300' },
        ]);
      } else if (temperature < 10) {
        // Cold & Cloudy - Cool gray
        return getRandomScheme([
          { bg: 'bg-slate-400', card: 'bg-slate-300', hover: 'hover:bg-slate-500' },
          { bg: 'bg-gray-400', card: 'bg-gray-300', hover: 'hover:bg-gray-500' },
          { bg: 'bg-blue-300', card: 'bg-blue-200', hover: 'hover:bg-blue-400' },
        ]);
      } else {
        // Pleasant & Cloudy - Light beige/brown (Beijing) or light green (Paris)
        return getRandomScheme([
          { bg: 'bg-stone-200', card: 'bg-stone-100', hover: 'hover:bg-stone-300' },
          { bg: 'bg-amber-100', card: 'bg-amber-50', hover: 'hover:bg-amber-200' },
          { bg: 'bg-green-200', card: 'bg-green-100', hover: 'hover:bg-green-300' },
          { bg: 'bg-lime-200', card: 'bg-lime-100', hover: 'hover:bg-lime-300' },
        ]);
      }
    }
    
    // Snow - Light blue/cyan
    if (condition.includes('snow')) {
      return getRandomScheme([
        { bg: 'bg-cyan-300', card: 'bg-cyan-200', hover: 'hover:bg-cyan-400' },
        { bg: 'bg-sky-300', card: 'bg-sky-200', hover: 'hover:bg-sky-400' },
        { bg: 'bg-blue-300', card: 'bg-blue-200', hover: 'hover:bg-blue-400' },
      ]);
    }
    
    // Fog/Mist/Haze - Light gray
    if (condition.includes('mist') || condition.includes('fog') || condition.includes('haze')) {
      return getRandomScheme([
        { bg: 'bg-gray-300', card: 'bg-gray-200', hover: 'hover:bg-gray-400' },
        { bg: 'bg-slate-300', card: 'bg-slate-200', hover: 'hover:bg-slate-400' },
        { bg: 'bg-zinc-300', card: 'bg-zinc-200', hover: 'hover:bg-zinc-400' },
      ]);
    }
    
    // Temperature-based fallback
    if (temperature > 30) {
      // Very Hot - Light orange
      return getRandomScheme([
        { bg: 'bg-orange-300', card: 'bg-orange-200', hover: 'hover:bg-orange-400' },
        { bg: 'bg-amber-300', card: 'bg-amber-200', hover: 'hover:bg-amber-400' },
      ]);
    } else if (temperature > 25) {
      // Hot - Light orange
      return getRandomScheme([
        { bg: 'bg-orange-300', card: 'bg-orange-200', hover: 'hover:bg-orange-400' },
        { bg: 'bg-amber-300', card: 'bg-amber-200', hover: 'hover:bg-amber-400' },
      ]);
    } else if (temperature < 5) {
      // Very Cold - Light blue
      return getRandomScheme([
        { bg: 'bg-cyan-300', card: 'bg-cyan-200', hover: 'hover:bg-cyan-400' },
        { bg: 'bg-blue-300', card: 'bg-blue-200', hover: 'hover:bg-blue-400' },
      ]);
    } else if (temperature < 15) {
      // Cold - Light blue
      return getRandomScheme([
        { bg: 'bg-blue-300', card: 'bg-blue-200', hover: 'hover:bg-blue-400' },
        { bg: 'bg-sky-300', card: 'bg-sky-200', hover: 'hover:bg-sky-400' },
      ]);
    } else {
      // Pleasant - Light green or light gray-green
      return getRandomScheme([
        { bg: 'bg-green-200', card: 'bg-green-100', hover: 'hover:bg-green-300' },
        { bg: 'bg-lime-200', card: 'bg-lime-100', hover: 'hover:bg-lime-300' },
        { bg: 'bg-emerald-200', card: 'bg-emerald-100', hover: 'hover:bg-emerald-300' },
        { bg: 'bg-teal-200', card: 'bg-teal-100', hover: 'hover:bg-teal-300' },
      ]);
    }
  };

  // Fallback color schemes for random selection (when needed)
  const colorSchemes = [
    { bg: 'bg-yellow-400', card: 'bg-yellow-300', hover: 'hover:bg-yellow-500' },
    { bg: 'bg-blue-400', card: 'bg-blue-300', hover: 'hover:bg-blue-500' },
    { bg: 'bg-green-400', card: 'bg-green-300', hover: 'hover:bg-green-500' },
    { bg: 'bg-orange-400', card: 'bg-orange-300', hover: 'hover:bg-orange-500' },
    { bg: 'bg-cyan-400', card: 'bg-cyan-300', hover: 'hover:bg-cyan-500' },
  ];

  const popularCities = [
    'Paris', 'London', 'New York', 'Tokyo', 'Sydney', 'Dubai', 
    'Singapore', 'Hong Kong', 'Los Angeles', 'Barcelona', 'Rome',
    'Amsterdam', 'Berlin', 'Madrid', 'Istanbul', 'Bangkok',
    'Mumbai', 'Toronto', 'Chicago', 'San Francisco', 'Miami'
  ];

  // Comprehensive city list for autocomplete
  const allCities = [
    'Paris', 'London', 'New York', 'Tokyo', 'Sydney', 'Dubai', 
    'Singapore', 'Hong Kong', 'Los Angeles', 'Barcelona', 'Rome',
    'Amsterdam', 'Berlin', 'Madrid', 'Istanbul', 'Bangkok',
    'Mumbai', 'Toronto', 'Chicago', 'San Francisco', 'Miami',
    'Kolkata', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad',
    'Seattle', 'Boston', 'Austin', 'Denver', 'Atlanta',
    'Melbourne', 'Brisbane', 'Perth', 'Auckland', 'Wellington',
    'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Quebec City',
    'Mexico City', 'Guadalajara', 'Monterrey', 'Cancun',
    'Sao Paulo', 'Rio de Janeiro', 'Buenos Aires', 'Santiago',
    'Lisbon', 'Porto', 'Vienna', 'Prague', 'Budapest', 'Warsaw',
    'Stockholm', 'Oslo', 'Copenhagen', 'Helsinki', 'Reykjavik',
    'Athens', 'Dublin', 'Brussels', 'Zurich', 'Geneva',
    'Milan', 'Venice', 'Florence', 'Naples', 'Munich',
    'Frankfurt', 'Hamburg', 'Cologne', 'Stuttgart',
    'Manchester', 'Liverpool', 'Edinburgh', 'Glasgow', 'Birmingham',
    'Shanghai', 'Beijing', 'Shenzhen', 'Guangzhou', 'Chengdu',
    'Seoul', 'Busan', 'Osaka', 'Kyoto', 'Nagoya',
    'Taipei', 'Kuala Lumpur', 'Jakarta', 'Manila', 'Hanoi',
    'Ho Chi Minh City', 'Phnom Penh', 'Yangon', 'Dhaka',
    'Karachi', 'Lahore', 'Islamabad', 'Kathmandu',
    'Cairo', 'Lagos', 'Nairobi', 'Cape Town', 'Johannesburg',
    'Tel Aviv', 'Jerusalem', 'Beirut', 'Doha', 'Abu Dhabi',
    'Riyadh', 'Jeddah', 'Kuwait City', 'Muscat', 'Amman'
  ];

  useEffect(() => {
    fetchWeatherData(city);
  }, [city]);

  // Initialize or get userId
  useEffect(() => {
    let id = localStorage.getItem('weatherAppUserId');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('weatherAppUserId', id);
    }
    setUserId(id);
    fetchSavedCities(id);
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save to recent searches
  const saveRecentSearch = (cityName: string) => {
    const updated = [cityName, ...recentSearches.filter(c => c !== cityName)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Fetch saved cities from Supabase
  const fetchSavedCities = async (uid: string) => {
    if (!uid) return;
    try {
      const response = await fetch(`${SERVER_URL}/saved-cities/${uid}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched saved cities:', data);
      if (data.cities) {
        setSavedCities(data.cities);
      }
    } catch (error) {
      console.error('Error fetching saved cities:', error);
    }
  };

  // Save a city to Supabase
  const saveCity = async (cityName: string) => {
    if (!userId) return;
    try {
      console.log('Attempting to save city:', cityName, 'for user:', userId);
      const response = await fetch(`${SERVER_URL}/saved-cities/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ city: cityName }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Save city response:', data);
      if (data.cities) {
        console.log('Updating saved cities state to:', data.cities);
        setSavedCities(data.cities);
      }
    } catch (error) {
      console.error('Error saving city:', error);
    }
  };

  // Remove a saved city from Supabase
  const removeSavedCity = async (cityName: string) => {
    if (!userId) return;
    try {
      console.log('Attempting to remove city:', cityName, 'for user:', userId);
      const response = await fetch(`${SERVER_URL}/saved-cities/${userId}/${cityName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Remove city response:', data);
      if (data.cities) {
        console.log('Updating saved cities state to:', data.cities);
        setSavedCities(data.cities);
      }
    } catch (error) {
      console.error('Error removing saved city:', error);
    }
  };

  // Toggle save/unsave city
  const toggleSaveCity = async (cityName: string) => {
    console.log('Toggle save city:', cityName, 'Current saved cities:', savedCities);
    if (savedCities.includes(cityName)) {
      console.log('City is already saved, removing...');
      await removeSavedCity(cityName);
    } else {
      console.log('City is not saved, adding...');
      await saveCity(cityName);
    }
  };

  const fetchWeatherData = async (location: string) => {
    setLoading(true);
    try {
      // Fetch current weather
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${API_KEY}&units=metric`
      );
      const weatherData = await weatherResponse.json();

      console.log('Weather API Response:', weatherData);

      if (weatherData.cod === 200) {
        const now = new Date();
        const temperature = Math.round(weatherData.main.temp);
        const weatherCondition = weatherData.weather[0].main;
        
        // Set colors based on weather condition and temperature
        const colorScheme = getWeatherColorScheme(weatherCondition, temperature);
        setBgColor(colorScheme.bg);
        setCardBgColor(colorScheme.card);
        setHoverColor(colorScheme.hover);
        
        setWeather({
          temp: temperature,
          description: weatherCondition,
          wind: Math.round(weatherData.wind.speed * 3.6), // Convert m/s to km/h
          humidity: weatherData.main.humidity,
          visibility: Math.round(weatherData.visibility / 1000), // Convert m to km
          city: weatherData.name,
          date: now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' }),
          time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          feels_like: Math.round(weatherData.main.feels_like),
          temp_min: Math.round(weatherData.main.temp_min),
          temp_max: Math.round(weatherData.main.temp_max),
        });

        // Fetch 5-day forecast
        const forecastResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${API_KEY}&units=metric`
        );
        const forecastData = await forecastResponse.json();

        console.log('Forecast API Response:', forecastData);

        if (forecastData.cod === '200') {
          // Get one forecast per day at noon
          const dailyForecasts: ForecastDay[] = [];
          const seenDates = new Set();

          forecastData.list.forEach((item: any) => {
            const date = new Date(item.dt * 1000);
            const dateStr = date.toISOString().split('T')[0];
            
            if (!seenDates.has(dateStr) && dailyForecasts.length < 4) {
              seenDates.add(dateStr);
              dailyForecasts.push({
                date: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                temp: Math.round(item.main.temp),
              });
            }
          });

          setForecast(dailyForecasts);
        }
      } else {
        console.error('Weather API Error:', weatherData.message);
        alert(`Error: ${weatherData.message || 'Unable to fetch weather data'}`);
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      alert(`Network Error: ${error}`);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      // Colors will be set automatically based on weather when fetchWeatherData is called
      setCity(searchInput.trim());
      saveRecentSearch(searchInput.trim());
      setShowSearch(false);
      setSearchInput('');
    }
  };

  const handleCityClick = (city: string) => {
    setCity(city);
    setDrawerOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    if (value) {
      const filtered = allCities.filter(city => city.toLowerCase().includes(value.toLowerCase()));
      setFilteredCities(filtered);
    } else {
      setFilteredCities([]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-400 flex items-center justify-center px-4">
        <div className="text-black text-sm sm:text-base">Loading...</div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="min-h-screen bg-yellow-400 flex items-center justify-center px-4">
        <div className="text-black text-sm sm:text-base text-center">Unable to load weather data</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgColor} flex justify-center px-2 sm:px-4`}>
      <div className="w-full max-w-md relative">
        {/* Status Bar */}
        <div className={`${bgColor} px-4 sm:px-6 pt-3 pb-2 flex justify-between items-center`}>
          <span className="text-black text-xs sm:text-sm">{weather.time}</span>
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5">
              <div className="w-0.5 h-3 bg-black rounded"></div>
              <div className="w-0.5 h-3 bg-black rounded"></div>
              <div className="w-0.5 h-3 bg-black rounded"></div>
              <div className="w-0.5 h-3 bg-black rounded"></div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-3 sm:px-4 pb-6 sm:pb-8">
          {/* Weather Condition - First */}
          <div className="text-center mb-4">
            <h2 className="text-black text-xl sm:text-2xl">{weather.description}</h2>
          </div>

          {/* Temperature - Second */}
          <div className="text-center mb-4">
            <div className="text-black text-[60px] sm:text-[80px] md:text-[120px] font-thin leading-none tracking-tight">
              {weather.temp}°
            </div>
          </div>

          {/* Date Badge - Third */}
          <div className="flex justify-center mb-4">
            <div className="bg-black text-white px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm">
              {weather.date}
            </div>
          </div>

          {/* Header with Menu and City - Fourth */}
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <div className="w-8 sm:w-10"></div>
            <button 
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-1 hover:opacity-70 transition"
            >
              <h1 className="text-black text-lg sm:text-xl">{weather.city}</h1>
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
            </button>
            <button
              onClick={() => toggleSaveCity(weather.city)}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:opacity-70 transition"
            >
              <Heart
                className={`w-5 h-5 sm:w-6 sm:h-6 ${savedCities.includes(weather.city) ? 'fill-black text-black' : 'text-black'}`}
              />
            </button>
          </div>

          {/* Daily Summary - Centered */}
          <div className="mb-4 sm:mb-6">
            <h3 className="text-black text-base sm:text-lg mb-2 text-center">Daily Summary</h3>
            <p className="text-black text-xs sm:text-sm leading-relaxed text-center">
              Now it feels like +{weather.feels_like}°; actually it's +{weather.temp}°. 
              It feels hot because of the direct sun. Today the temperature is in the range from +{weather.temp_min}° to +{weather.temp_max}°.
            </p>
          </div>

          {/* Weather Stats Card */}
          <div className="bg-black rounded-2xl sm:rounded-3xl px-4 sm:px-6 py-4 sm:py-6 mb-4 sm:mb-6">
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="flex flex-col items-center">
                <Wind className="w-6 h-6 sm:w-8 sm:h-8 text-white mb-1 sm:mb-2" />
                <div className="text-white text-base sm:text-xl">{weather.wind}km/h</div>
                <div className="text-white/70 text-xs sm:text-sm">Wind</div>
              </div>
              <div className="flex flex-col items-center">
                <Droplets className="w-6 h-6 sm:w-8 sm:h-8 text-white mb-1 sm:mb-2" />
                <div className="text-white text-base sm:text-xl">{weather.humidity}%</div>
                <div className="text-white/70 text-xs sm:text-sm">Humidity</div>
              </div>
              <div className="flex flex-col items-center">
                <Eye className="w-6 h-6 sm:w-8 sm:h-8 text-white mb-1 sm:mb-2" />
                <div className="text-white text-base sm:text-xl">{weather.visibility}km</div>
                <div className="text-white/70 text-xs sm:text-sm">Visibility</div>
              </div>
            </div>
          </div>

          {/* Weekly Forecast */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="text-black text-base sm:text-lg">Weekly forecast</h3>
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
            </div>
            
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {forecast.map((day, index) => (
                <div
                  key={index}
                  className={`${cardBgColor} border-2 border-black rounded-xl sm:rounded-2xl p-2 sm:p-3 flex flex-col items-center`}
                >
                  <div className="text-black text-base sm:text-xl mb-1">{day.temp}°</div>
                  <div className="text-black text-[10px] sm:text-xs mb-1">{day.day}</div>
                  <div className="text-black text-[10px] sm:text-xs">{day.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sheet Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="bg-white/80 backdrop-blur-xl border-t border-white/20 shadow-2xl">
          <DrawerHeader>
            <DrawerTitle className="text-center">Select Location</DrawerTitle>
            <DrawerDescription className="text-center text-gray-500">
              Choose a city to get the latest weather updates.
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="px-3 sm:px-4 pb-6 sm:pb-8 max-h-[70vh] overflow-y-auto">
            {/* Search Bar */}
            <div className="mb-4 sm:mb-6 relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={handleInputChange}
                  placeholder="Search for a city..."
                  className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 rounded-full bg-white/60 backdrop-blur-md border border-white/40 text-black text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 focus:bg-white/70 transition"
                />
                
                {/* Autocomplete Results */}
                {searchInput && filteredCities.length > 0 && (
                  <div className="absolute z-20 w-full mt-2 bg-white/70 backdrop-blur-xl border border-white/30 rounded-xl sm:rounded-2xl shadow-2xl max-h-48 overflow-y-auto">
                    {filteredCities.map((cityName) => (
                      <button
                        key={cityName}
                        onClick={() => {
                          // Colors will be set automatically based on weather when fetchWeatherData is called
                          setCity(cityName);
                          saveRecentSearch(cityName);
                          setDrawerOpen(false);
                          setSearchInput('');
                          setFilteredCities([]);
                        }}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left hover:bg-white/40 flex items-center gap-2 sm:gap-3 transition first:rounded-t-xl sm:first:rounded-t-2xl last:rounded-b-xl sm:last:rounded-b-2xl"
                      >
                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                        <span className="text-black text-sm sm:text-base">{cityName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recently Searched */}
            {recentSearches.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                  <h3 className="text-gray-500 text-xs sm:text-sm uppercase tracking-wide">Recently Searched</h3>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {recentSearches.map((cityName) => (
                    <button
                      key={cityName}
                      onClick={() => {
                        // Colors will be set automatically based on weather when fetchWeatherData is called
                        setCity(cityName);
                        saveRecentSearch(cityName);
                        setDrawerOpen(false);
                      }}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-50 hover:bg-gray-100 rounded-full transition text-black text-xs sm:text-sm"
                    >
                      {cityName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Saved Cities */}
            {savedCities.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                  <h3 className="text-gray-500 text-xs sm:text-sm uppercase tracking-wide">Saved Cities</h3>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {savedCities.map((cityName) => (
                    <div key={cityName} className="relative group">
                      <button
                        onClick={() => {
                          // Colors will be set automatically based on weather when fetchWeatherData is called
                          setCity(cityName);
                          saveRecentSearch(cityName);
                          setDrawerOpen(false);
                        }}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-50 hover:bg-red-100 rounded-full transition text-black text-xs sm:text-sm pr-8 sm:pr-10"
                      >
                        {cityName}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSavedCity(cityName);
                        }}
                        className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700 transition"
                      >
                        <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Cities */}
            <div>
              <h3 className="text-gray-500 text-xs sm:text-sm uppercase tracking-wide mb-2 sm:mb-3">Popular Cities</h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {popularCities.map((cityName) => (
                  <button
                    key={cityName}
                    onClick={() => {
                      // Colors will be set automatically based on weather when fetchWeatherData is called
                      setCity(cityName);
                      saveRecentSearch(cityName);
                      setDrawerOpen(false);
                    }}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-50 hover:bg-gray-100 rounded-full transition text-black text-xs sm:text-sm"
                  >
                    {cityName}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}