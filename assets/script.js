// grab dom elements
var searchForm = document.querySelector('#search-form');
var searchInput = document.querySelector('#search-input');
var todayDiv = document.querySelector('#today');
var forecastDiv = document.querySelector('#forecast');
var searchHistoryDiv = document.querySelector('#history');
// Global variables
var searchHistory = [];
var apiURL = 'https://api.openweathermap.org';
var apiKey = '2dc18646a341fb4a90e14ab98eb507c6';
// timezone plugins for day.js
dayjs.extend(window.dayjs_plugin_utc);
dayjs.extend(window.dayjs_plugin_timezone);

// grab search history from local storage
function initSearchHistory() {
  var storedHistory = localStorage.getItem('weather-cities');
  if (storedHistory) {
    searchHistory = JSON.parse(storedHistory);
  }
  renderSearchHistory();
}

// renders search history list.
function renderSearchHistory() {
  searchHistoryDiv.innerHTML = '';

  // loop through history array backwards to get most recent at top
  for (var i = searchHistory.length - 1; i >= 0; i--) {
    var btn = document.createElement('button');
    btn.setAttribute('type', 'button');

    // data-search will grab the city name when from the elements data
    btn.setAttribute('data-search', searchHistory[i]);
    btn.textContent = searchHistory[i];
    searchHistoryDiv.append(btn);
  }
}

// update the local storage and search history list
function updateHistory(search) {
  // If there is no search term return the function
  if (searchHistory.indexOf(search) !== -1) {
    return;
  }
  searchHistory.push(search);

  localStorage.setItem('weather-cities', JSON.stringify(searchHistory));
  renderSearchHistory();
}

function handleSearch(e) {
  // Don't continue if there is nothing in the search form
  if (!searchInput.value) {
    return;
  }

  e.preventDefault();
  let search = searchInput.value.trim();
  getCoordinates(search);
  searchInput.value = '';
}

function handleSearchHistoryClick(e) {

  let btn = e.target;
  let search = btn.getAttribute('data-search');
  getCoordinates(search);
}

function getCoordinates(search) {
  var apiUrl = `${apiURL}/geo/1.0/direct?q=${search}&limit=5&appid=${apiKey}`;

  //check if location works and get weather for it and update the history
  fetch(apiUrl)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (!data[0]) {
        alert('Location not found');
      } else {
        updateHistory(search);
        getWeather(data[0]);
      }
    })
    .catch(function (err) {
      console.error(err);
    });
}

function getWeather(location) {
  var { lat, lon } = location;
  var city = location.name;
  var apiUrl = `${apiURL}/data/2.5/onecall?lat=${lat}&lon=${lon}&units=imperial&exclude=minutely,hourly&appid=${apiKey}`;
  //get weather data
  fetch(apiUrl)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      //render the data
      renderItems(city, data);
    })
    .catch(function (err) {
      console.error(err);
    });
}


// Display weather of current day
function renderCurrentWeather(city, weather, timezone) {
  var date = dayjs().tz(timezone).format('M/D/YYYY');

  // store data in usable variables
  var temp = weather.temp;
  var windSpeed = weather.wind_speed;
  var humidity = weather.humidity;
  var uvi = weather.uvi;
  var iconUrl = `https://openweathermap.org/img/w/${weather.weather[0].icon}.png`;
  var iconDescription = weather.weather[0].description || weather[0].main;

  var card = document.createElement('div');
  var cardBody = document.createElement('div');
  var heading = document.createElement('h2');
  var weatherIcon = document.createElement('img');
  var tempEl = document.createElement('p');
  var windEl = document.createElement('p');
  var humidityEl = document.createElement('p');
  var uvEl = document.createElement('p');
  card.append(cardBody);

  heading.textContent = `${city} (${date})`;
  weatherIcon.setAttribute('src', iconUrl);
  weatherIcon.setAttribute('alt', iconDescription);
  heading.append(weatherIcon);

  tempEl.textContent = `Temp: ${temp}°F`;
  windEl.textContent = `Wind: ${windSpeed} MPH`;
  humidityEl.textContent = `Humidity: ${humidity} %`;
  cardBody.append(heading, tempEl, windEl, humidityEl);

  uvEl.textContent = 'UV Index: ' + uvi;
  cardBody.append(uvEl);

  todayDiv.innerHTML = '';
  todayDiv.append(card);
}

// Function to render 5 day forecast
function renderForecast(dailyForecast, timezone) {
  // Create timestamps for beginning and end of the 5 day forecast
  var startDt = dayjs().tz(timezone).add(1, 'day').startOf('day').unix();
  var endDt = dayjs().tz(timezone).add(6, 'day').startOf('day').unix();

  var headingCol = document.createElement('div');
  var heading = document.createElement('h4');

  heading.textContent = '5-Day Forecast:';
  headingCol.append(heading);

  forecastDiv.innerHTML = '';
  forecastDiv.append(headingCol);
  //loop through and render forcasts
  for (var i = 0; i < dailyForecast.length; i++) {
    if (dailyForecast[i].dt >= startDt && dailyForecast[i].dt < endDt) {
      renderForecastCard(dailyForecast[i], timezone);
    }
  }
}

// renders data for each day in forcast
function renderForecastCard(forecast, timezone) {
  // variables for data from api
  var unixTs = forecast.dt;
  var iconUrl = `https://openweathermap.org/img/w/${forecast.weather[0].icon}.png`;
  var iconDescription = forecast.weather[0].description;
  var temp = forecast.temp.day;
  var { humidity } = forecast;
  var windSpeed = forecast.wind_speed;

  // Create elements for the card
  var card = document.createElement('div');
  var cardBody = document.createElement('div');
  var cardTitle = document.createElement('h4');
  var weatherIcon = document.createElement('img');
  var tempEl = document.createElement('p');
  var windEl = document.createElement('p');
  var humidityEl = document.createElement('p');

  card.append(cardBody);
  cardBody.append(cardTitle, weatherIcon, tempEl, windEl, humidityEl);

  cardTitle.textContent = dayjs.unix(unixTs).tz(timezone).format('M/D/YYYY');
  weatherIcon.setAttribute('src', iconUrl);
  weatherIcon.setAttribute('alt', iconDescription);
  tempEl.textContent = `Temp: ${temp} °F`;
  windEl.textContent = `Wind: ${windSpeed} MPH`;
  humidityEl.textContent = `Humidity: ${humidity} %`;

  forecastDiv.append(card);
}

function renderItems(city, data) {
  renderCurrentWeather(city, data.current, data.timezone);
  renderForecast(data.daily, data.timezone);
}

initSearchHistory();
searchForm.addEventListener('submit', handleSearch);
searchHistoryDiv.addEventListener('click', handleSearchHistoryClick);
