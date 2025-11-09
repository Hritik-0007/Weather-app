const API_KEY = "c055f0596fe64de6ac0160804253009"; 
let target = "Delhi";

async function fetchWeather(location) {
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${location}&days=5&aqi=no&alerts=no`;
  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      alert("City not found!");
      return;
    }

    updateMain(data);
    updateHourly(data.forecast.forecastday[0].hour);
    updateDays(data.forecast.forecastday);
  } catch (error) {
    console.error("Error fetching weather:", error);
  }
  


}
// ui update
function updateMain(data) {
 
  const condition = data.current.condition.text.toLowerCase();
 
  document.getElementById("location").innerText = `${data.location.name}, ${data.location.country}`;
  document.getElementById("temperature").innerText = `${data.current.temp_c}°C`;
  document.getElementById("condition").innerText = data.current.condition.text;
  document.getElementById("dateTime").innerText = data.location.localtime;

 let bgImage = "default.jpg"; // fallback
 let theme = {};

  if (condition.includes("sunny") || condition.includes("clear")) {
   
    bgImage = "sunny.jpg"; 
  } else if (condition.includes("rain") || condition.includes("shower") || condition.includes("mist")|| condition.includes("light rain")) {
    bgImage = "rainy 2.avif";
    
    
  } else if (condition.includes("snow") || condition.includes("ice") || condition.includes("sleet")|| condition.includes("Fog")) {
    bgImage = "winter.jpg";
  } else if (condition.includes("cloud")) {
    bgImage = "cloudy.jpg";
  }

  document.body.style.background = `url('${bgImage}') no-repeat center center / cover`;
}

function updateHourly(hourData) {
  const container = document.getElementById("hourlyContainer");
  container.innerHTML = "";

  const now = new Date();
  const currentHour=now.getHours();

  const nextHours = hourData.filter(hourObj => {
    const forecastTime = new Date(hourObj.time);
    return forecastTime >= now;
  });

  const displayHours = nextHours.length >= 10 
    ? nextHours.slice(0, 10) 
    : nextHours.concat(hourData.slice(0, 10 - nextHours.length));
  
  
   displayHours.forEach(hour => {
    let div = document.createElement("div");
    div.classList.add("hour_card");
    let time = hour.time.split(" ")[1];
    div.innerHTML = `
      <p>${time}</p>
      <img src="${hour.condition.icon}" alt="icon">
      <p>${hour.temp_c}°C</p>
    `;
    container.appendChild(div);
  });
}

function updateDays(days) {
  const container = document.getElementById("daysContainer");
  container.innerHTML = "";
 
   let extendedDays = [...days];
  while (extendedDays.length < 5) {
    extendedDays.push(days[days.length - 1]);
  }

  extendedDays.slice(0, 5).forEach(day => {
    let div = document.createElement("div");
    div.classList.add("day_card");
    div.innerHTML = `
      <span>${day.date}</span>
      <img src="${day.day.condition.icon}" alt="icon">
      <span>${day.day.mintemp_c}° / ${day.day.maxtemp_c}°C</span>
    `;
    container.appendChild(div);
  });
}



//srch auto comple 
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const suggestionBox = document.getElementById("suggestions");


searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const city = searchInput.value.trim();
  if (city !== "") {
    fetchWeather(city);
    suggestionBox.innerHTML="";
    suggestionBox.style.display="none"
    searchInput.value = "";
  }
});


function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// ⏱️ Timeout utility (to cancel slow API calls)
function fetchWithTimeout(resource, options = {}) {
  const { timeout = 3000 } = options; // 3 seconds default
  return Promise.race([
    fetch(resource, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), timeout)
    ),
  ]);
}


//ind suggestionsfetcher
async function fetchSuggestions(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${encodeURIComponent(query)}&addressdetails=1&limit=10`;

try{
  const res = await fetchWithTimeout(url,{timeout:3000});
  const data = await res.json();
 


//(filter only cty,twn,vill,state in ind)
const filtered =data.filter(item =>
  item.type==="city"||
  item.type==="town"||
  item.type==="village"||
  item.type==="state"||
  item.type==="administrative"
);

//(kep oly top4 )
return filtered.slice(0,4).map(item => {
  const parts= item.display_name.split(",");
  return parts.slice(0,3).join(",");
});

}catch (error) {
    console.error("Error fetching suggestions:", error.message);
    return [];
}
}

async function handleInput () {
  const query = searchInput.value.trim();
  suggestionBox.innerHTML = "";

  if (query.length < 2) { 
    suggestionBox.style.display = "none";
    return;
  }

  
    const suggestions = await fetchSuggestions(query);

           suggestionBox.innerHTML = "";

    if (suggestions.length === 0) {
      suggestionBox.style.display = "none";
      return;
    }

    //(top 4 sugg)
        suggestions.forEach(name => {
      const li = document.createElement("li");
      li.textContent = name;
     
      li.addEventListener("click", () => {
        searchInput.value = name;
        suggestionBox.innerHTML = "";
        suggestionBox.style.display = "none";
        fetchWeather(name);
      });
    
      suggestionBox.appendChild(li);
    
    });
      
    suggestionBox.style.display = "block";
  } 

searchInput.addEventListener("input", debounce(handleInput, 500));

//(hide sugg whn click outsde )

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search_box")) {
    suggestionBox.style.display = "none";
  }
});

fetchWeather(target);