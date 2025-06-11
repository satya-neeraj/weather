localStorage.removeItem("recentCities");

const API_KEY = "xhXAKSGguu9GQ5opZKDMUjb2NsZhiCOX"; 

const form = document.getElementById("weatherForm");
const cityInput = document.getElementById("cityInput");
const info = document.getElementById("info");
const weatherCard = document.getElementById("weatherCard");
const toggleUnitBtn = document.getElementById("toggleUnit");
const toggleThemeBtn = document.getElementById("toggleTheme");
const geoBtn = document.getElementById("geoBtn");
const recentDiv = document.getElementById("recent");

let unit = localStorage.getItem("unit") || "metric";
let theme = localStorage.getItem("theme") || "light";
let recent = JSON.parse(localStorage.getItem("recentCities") || "[]");

setTheme(theme);
toggleUnitBtn.textContent = unit === "metric" ? "°F" : "°C";
renderRecent();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;
  fetchWeatherByCity(city);
});

geoBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    info.textContent = "Geolocation not supported.";
    return;
  }
  info.textContent = "Fetching location...";
  weatherCard.classList.add("hidden");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
    },
    () => {
      info.textContent = "Unable to get location.";
    }
  );
});

toggleUnitBtn.addEventListener("click", () => {
  unit = unit === "metric" ? "imperial" : "metric";
  localStorage.setItem("unit", unit);
  toggleUnitBtn.textContent = unit === "metric" ? "°F" : "°C";
  weatherCard.classList.add("hidden");
  info.textContent = "";
});

toggleThemeBtn.addEventListener("click", () => {
  theme = theme === "light" ? "dark" : "light";
  setTheme(theme);
  localStorage.setItem("theme", theme);
});

recentDiv.addEventListener("click", (e) => {
  if (e.target.tagName === "SPAN") {
    cityInput.value = e.target.textContent;
    fetchWeatherByCity(e.target.textContent);
  }
});

function setTheme(mode) {
  document.body.classList.toggle("dark", mode === "dark");
  toggleThemeBtn.textContent = mode === "dark" ? "☀️" : "🌙";
}

async function fetchWeatherByCity(city) {
  info.textContent = "Loading...";
  weatherCard.classList.add("hidden");
  try {
    // Step 1: Get Location Key
    const locRes = await fetch(
      `https://dataservice.accuweather.com/locations/v1/cities/search?apikey=${API_KEY}&q=${encodeURIComponent(city)}`
    );
    const locData = await locRes.json();
    if (!locData.length) throw new Error("City not found");
    const location = locData[0];
    // Step 2: Get Weather by Location Key
    await fetchWeatherByLocationKey(location.Key, location.LocalizedName, location.Country.ID);
    saveRecent(city);
    info.textContent = "";
  } catch (err) {
    info.textContent = err.message;
  }
}

async function fetchWeatherByCoords(lat, lon) {
  info.textContent = "Loading...";
  weatherCard.classList.add("hidden");
  try {
    // Step 1: Get Location Key by geocoordinates
    const locRes = await fetch(
      `https://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${API_KEY}&q=${lat},${lon}`
    );
    const location = await locRes.json();
    if (!location.Key) throw new Error("Location not found");
    // Step 2: Get Weather by Location Key
    await fetchWeatherByLocationKey(location.Key, location.LocalizedName, location.Country.ID);
    saveRecent(location.LocalizedName);
    info.textContent = "";
  } catch (err) {
    info.textContent = err.message;
  }
}

async function fetchWeatherByLocationKey(locationKey, cityName, countryCode) {
  // Step 2: Get Current Conditions
  const weatherRes = await fetch(
    `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${API_KEY}&details=true`
  );
  const weatherArr = await weatherRes.json();
  if (!weatherArr.length) throw new Error("Weather data not found");
  const weather = weatherArr[0];
  renderWeather(weather, cityName, countryCode);
}

function renderWeather(weather, cityName, countryCode) {
  const temp = unit === "metric" ? weather.Temperature.Metric.Value : weather.Temperature.Imperial.Value;
  const feelsLike = unit === "metric" ? weather.RealFeelTemperature.Metric.Value : weather.RealFeelTemperature.Imperial.Value;
  const unitSymbol = unit === "metric" ? "°C" : "°F";
  const windSpeed = unit === "metric" ? weather.Wind.Speed.Metric.Value : weather.Wind.Speed.Imperial.Value;
  const windUnit = unit === "metric" ? weather.Wind.Speed.Metric.Unit : weather.Wind.Speed.Imperial.Unit;
  weatherCard.innerHTML = `
    <h2>${cityName}, ${countryCode}</h2>
    <div class="weather-main">
      <img src="https://developer.accuweather.com/sites/default/files/${String(weather.WeatherIcon).padStart(2, '0')}-s.png"
           alt="${weather.WeatherText}" />
      <div>
        <h1>${Math.round(temp)}${unitSymbol}</h1>
        <p>${weather.WeatherText}</p>
      </div>
    </div>
    <div class="weather-details">
      <div>Humidity: ${weather.RelativeHumidity}%</div>
      <div>Wind: ${windSpeed} ${windUnit}</div>
      <div>Feels like: ${Math.round(feelsLike)}${unitSymbol}</div>
      <div>Pressure: ${weather.Pressure.Metric.Value} ${weather.Pressure.Metric.Unit}</div>
    </div>
  `;
  weatherCard.classList.remove("hidden");
}

function saveRecent(city) {
  city = city[0].toUpperCase() + city.slice(1).toLowerCase();
  recent = recent.filter(c => c.toLowerCase() !== city.toLowerCase());
  recent.unshift(city);
  if (recent.length > 5) recent = recent.slice(0, 5);
  localStorage.setItem("recentCities", JSON.stringify(recent));
  renderRecent();
}

function renderRecent() {
  if (!recent.length) {
    recentDiv.innerHTML = "";
    return;
  }
  recentDiv.innerHTML = `
    <div id="recent-label">Recent Searches</div>
    <div class="recent-list">
      ${recent.map(c => `<button class="recent-tag" tabindex="0">${c}</button>`).join("")}
    </div>
  `;
}
