

const searchForm       = document.getElementById('search-form');
const cityInput        = document.getElementById('city-input');
const errorMessage     = document.getElementById('error-message');
const loadingState     = document.getElementById('loading-state');
const currentCard      = document.getElementById('current-card');
const forecastCard     = document.getElementById('forecast-card');
const locationName     = document.getElementById('location-name');
const weatherDesc      = document.getElementById('weather-description');
const currentTemp      = document.getElementById('current-temperature');
const feelsLike        = document.getElementById('feels-like');
const humidity         = document.getElementById('humidity');
const windSpeed        = document.getElementById('wind-speed');
const tempHigh         = document.getElementById('temp-high');
const tempLow          = document.getElementById('temp-low');
const updatedText      = document.getElementById('updated-text');
const forecastGrid     = document.getElementById('forecast-grid');
const weatherIconEl    = document.getElementById('current-icon');
const uvValue          = document.getElementById('uv-value');
const uvDesc           = document.getElementById('uv-desc');
const locateBtn        = document.getElementById('locate-btn');

const weatherCodes = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Foggy',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  56: 'Freezing drizzle', 57: 'Freezing drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  66: 'Freezing rain', 67: 'Freezing rain',
  71: 'Light snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Rain showers', 81: 'Heavy showers', 82: 'Violent showers',
  85: 'Snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm + hail', 99: 'Thunderstorm + hail'
};

const weatherIconMap = {
  clear:         'wb_sunny',
  partly_cloudy: 'partly_cloudy_day',
  cloudy:        'cloud',
  fog:           'foggy',
  drizzle:       'rainy_light',
  rain:          'rainy',
  freezing_rain: 'weather_mix',
  snow:          'ac_unit',
  showers:       'rainy',
  storm:         'thunderstorm'
};

function getIconName(code) {
  if (code === 0)                              return weatherIconMap.clear;
  if (code === 1 || code === 2)                return weatherIconMap.partly_cloudy;
  if (code === 3)                              return weatherIconMap.cloudy;
  if (code === 45 || code === 48)              return weatherIconMap.fog;
  if (code >= 51 && code <= 55)               return weatherIconMap.drizzle;
  if (code === 56 || code === 57)              return weatherIconMap.freezing_rain;
  if (code >= 61 && code <= 67)               return weatherIconMap.rain;
  if (code >= 71 && code <= 77)               return weatherIconMap.snow;
  if (code >= 80 && code <= 82)               return weatherIconMap.showers;
  if (code === 85 || code === 86)             return weatherIconMap.snow;
  if (code >= 95)                             return weatherIconMap.storm;
  return weatherIconMap.cloudy;
}

function getIconFill(code) {
  if (code === 0 || code === 1) return "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 48";
  return "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 48";
}

function uvLabel(idx) {
  if (idx === null || idx === undefined) return { text: '--', desc: 'No data' };
  if (idx <= 2)  return { text: idx + ' Low',      desc: 'No protection needed.' };
  if (idx <= 5)  return { text: idx + ' Moderate', desc: 'Some protection recommended.' };
  if (idx <= 7)  return { text: idx + ' High',     desc: 'Protection essential.' };
  if (idx <= 10) return { text: idx + ' Very High', desc: 'Extra protection needed.' };
  return             { text: idx + ' Extreme',  desc: 'Stay indoors midday.' };
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.classList.remove('hidden');
}
function hideError() {
  errorMessage.textContent = '';
  errorMessage.classList.add('hidden');
}
function setLoading(on) {
  loadingState.classList.toggle('hidden', !on);
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
function todayLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}

async function fetchCityCoordinates(city) {
  const url = 'https://geocoding-api.open-meteo.com/v1/search?name=' +
              encodeURIComponent(city) + '&count=1';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Unable to fetch city coordinates.');
  const data = await res.json();
  if (!data.results || !data.results.length) throw new Error('City not found. Please try another name.');
  return data.results[0];
}

async function fetchWeather(lat, lon, tz) {
  const url = 'https://api.open-meteo.com/v1/forecast' +
    '?latitude=' + lat + '&longitude=' + lon +
    '&timezone=' + encodeURIComponent(tz) +
    '&current_weather=true' +
    '&hourly=relativehumidity_2m,apparent_temperature,visibility,uv_index' +
    '&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
    '&forecast_days=6';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Unable to fetch weather data.');
  return res.json();
}

function showWeather(cityData, data) {
  const cw    = data.current_weather;
  const idx   = data.hourly.time.findIndex(t => t === cw.time.substring(0, 13) + ':00') ;
  const hIdx  = idx >= 0 ? idx : 0;

  const humidityVal = data.hourly.relativehumidity_2m[hIdx] ?? '--';
  const feelsVal    = data.hourly.apparent_temperature[hIdx] ?? cw.temperature;
  const visVal      = data.hourly.visibility?.[hIdx];
  const uvIdx       = data.hourly.uv_index?.[hIdx];

  locationName.textContent = cityData.name + (cityData.admin1 ? ', ' + cityData.admin1 : '') + ', ' + cityData.country;
  updatedText.textContent  = todayLabel();

  currentTemp.textContent = Math.round(cw.temperature) + '\u00b0';
  feelsLike.textContent   = Math.round(feelsVal) + '\u00b0C';
  humidity.textContent    = humidityVal + '%';
  windSpeed.textContent   = Math.round(cw.windspeed) + ' km/h';

  if (data.daily && data.daily.temperature_2m_max) {
    tempHigh.textContent = 'H: ' + Math.round(data.daily.temperature_2m_max[0]) + '\u00b0';
    tempLow.textContent  = 'L: ' + Math.round(data.daily.temperature_2m_min[0]) + '\u00b0';
  }

  const visEl = document.getElementById('visibility');
  if (visEl) {
    visEl.textContent = visVal != null ? (visVal / 1000).toFixed(1) + ' km' : '--';
  }

  const iconName = getIconName(cw.weathercode);
  weatherIconEl.textContent = iconName;
  weatherIconEl.style.fontVariationSettings = getIconFill(cw.weathercode);
  weatherDesc.textContent   = weatherCodes[cw.weathercode] || 'Weather data';

  const condEl = document.getElementById('conditions-short');
  if (condEl) condEl.textContent = weatherCodes[cw.weathercode] || '--';

  const uv = uvLabel(uvIdx);
  uvValue.textContent = uv.text;
  uvDesc.textContent  = uv.desc;

  forecastGrid.innerHTML = '';
  for (let i = 1; i <= 5 && i < data.daily.time.length; i++) {
    const code     = data.daily.weathercode[i];
    const dayLabel = formatDate(data.daily.time[i]);
    const icon     = getIconName(code);
    const precip   = data.daily.precipitation_probability_max?.[i] ?? 0;
    const desc     = precip > 0 ? precip + '% rain' : (weatherCodes[code] || '');
    const card     = document.createElement('div');
    card.className = 'forecast-day';
    card.innerHTML =
      '<div class="day-info">' +
        '<span class="material-symbols-outlined day-icon" style="color:var(--blue)">' + icon + '</span>' +
        '<div>' +
          '<p class="day-name">' + dayLabel + '</p>' +
          '<p class="day-desc">' + desc + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="day-temps">' +
        '<p class="max">' + Math.round(data.daily.temperature_2m_max[i]) + '\u00b0C</p>' +
        '<p class="min">' + Math.round(data.daily.temperature_2m_min[i]) + '\u00b0C</p>' +
      '</div>';
    forecastGrid.appendChild(card);
  }

  currentCard.style.display  = '';
  forecastCard.style.display = '';
}

async function displayWeather(city) {
  hideError();
  setLoading(true);
  try {
    const cityData    = await fetchCityCoordinates(city);
    const weatherData = await fetchWeather(cityData.latitude, cityData.longitude, cityData.timezone);
    showWeather(cityData, weatherData);
  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
}

async function fetchCityFromCoords(lat, lon) {
  const url = 'https://geocoding-api.open-meteo.com/v1/reverse?latitude=' + lat + '&longitude=' + lon + '&count=1';

  return { name: 'My Location', country: '', admin1: '', latitude: lat, longitude: lon, timezone: 'auto' };
}

locateBtn && locateBtn.addEventListener('click', () => {
  if (!navigator.geolocation) { showError('Geolocation is not supported by your browser.'); return; }
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      hideError();
      setLoading(true);
      try {
        const cityData = await fetchCityFromCoords(pos.coords.latitude, pos.coords.longitude);
        const weatherData = await fetchWeather(pos.coords.latitude, pos.coords.longitude, 'auto');
        cityData.latitude  = pos.coords.latitude;
        cityData.longitude = pos.coords.longitude;
        showWeather(cityData, weatherData);
      } catch (err) {
        showError(err.message);
      } finally {
        setLoading(false);
      }
    },
    () => showError('Unable to retrieve your location.')
  );
});

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (city) displayWeather(city);
});

window.addEventListener('DOMContentLoaded', () => {
  displayWeather('Attock');
});
