
function meteoData(latitude, longitude) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=apparent_temperature,is_day,temperature_2m,relative_humidity_2m,weather_code,precipitation&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum&timezone=auto`;
    
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            getLocationName(latitude, longitude, data);
        } else {
            console.error('Erreur lors de la récupération des données:', xhr.status);
        }
    };
    
    xhr.onerror = function() {
        console.error('Erreur réseau');
    };
    
    xhr.send();
}

// Verifier si le navigateur accepte la geolocalisation
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        meteoData(lat, lon);
    }, error => {
        console.error('Erreur de géolocalisation:', error);
        alert("Erreur de geolocation!!")
    });
} else {
    alert( "Autorisation refuse, geolocalisation impossible")
}

// Fonction pour récupérer le nom de la ville (API de géocodage inversé)
function getLocationName(latitude, longitude, weatherData) {
    const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
    
    const xhr = new XMLHttpRequest();
    xhr.open('GET', geoUrl);
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            const geoData = JSON.parse(xhr.responseText);
            const cityName = geoData.address.city || geoData.address.town || geoData.address.village || 'Localisation inconnue';
            displayWeather(weatherData, cityName);
        } else {
            // Si la géolocalisation échoue, afficher les données sans nom de ville
            displayWeather(weatherData, 'Localisation', 'Inconnue');
        }
    };
    
    xhr.onerror = function() {
        console.error('Erreur lors de la récupération du nom de la ville');
        displayWeather(weatherData, 'Localisation', 'Inconnue');
    };
    
    xhr.send();
}

// afficher les données météo
function displayWeather(data, cityName) {
    const current = data.current;
    const hourly = data.hourly;
    const daily = data.daily;
    
    // header
    document.getElementById('temp_actuel').innerHTML = `${Math.round(current.temperature_2m)} °C`;
    document.getElementById('nomVille').textContent = cityName ;
    
    const today = new Date();
    document.getElementById('todayInfo').textContent = today.toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    document.getElementById('humidity').innerHTML = `<i class="bi bi-moisture humidityIcon"></i>${current.relative_humidity_2m }%`;
    document.getElementById('rain').innerHTML = `<i class="fa-solid fa-cloud-rain rainIcon"></i> ${(current.precipitation || 0)}mm`;
    document.getElementById('feels').innerHTML = `<b>Ressentie comme ${(current.apparent_temperature || 0)} °C</b> `;
    
    // heures
    displayHours(hourly);
    
    // jours
    displayDays(daily);
    
    // sunrise/sunset
    displaySunTimes(daily.sunrise[0], daily.sunset[0]);
}

// function heures
function displayHours(hourlyData) {
    const container = document.getElementById('heursContainer');
    container.innerHTML = '';
    
    // Afficher les 24 prochaines heures
    for (let i = 0; i < 24; i++) { 
        const time = new Date();
        time.setHours(time.getHours() + i);
        
        const hourDiv = document.createElement('div');
        hourDiv.className = 'hour-item';
        const weatherCode = hourlyData.weather_code[i];
        const iconClass = getWeatherIcon(weatherCode);
        const iconColor = getWeatherColor(weatherCode);
        
        hourDiv.innerHTML = `
            <p>${time.getHours().toString().padStart(2, '0')}:00</p>
            <i class="fa-solid ${iconClass}" style="color: ${iconColor};"></i>
            <p>${Math.round(hourlyData.temperature_2m[i])}°C</p>
        `;
        container.appendChild(hourDiv);
    }
}

// Fonction jours
function displayDays(dailyData) {
    const container = document.getElementById('joursContainer');
    container.innerHTML = '';
    
    // Afficher les 7 prochains jours
    for (let i = 0; i < dailyData.time.length; i++) {
        const date = new Date(dailyData.time[i]);
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day-item';
        const weatherCode = dailyData.weather_code[i];
        const iconClass = getWeatherIcon(weatherCode);
        const iconColor = getWeatherColor(weatherCode);
        
        dayDiv.innerHTML = `
            <p class="day-name">${date.toLocaleDateString('fr-FR', {month: 'numeric', day: 'numeric' })}</p>
            <i class="fa-solid ${iconClass}" style="color: ${iconColor};"></i>
            <p><strong>${Math.round(dailyData.temperature_2m_max[i])}°C</strong> / ${Math.round(dailyData.temperature_2m_min[i])}°C</p>
            <p>${getWeatherDescription(dailyData.weather_code[i])}</p>
        `;
        container.appendChild(dayDiv);
    }
}

// Fonction pour afficher sunrise/sunset
function displaySunTimes(sunrise, sunset) {
    const sunriseTime = new Date(sunrise);
    const sunsetTime = new Date(sunset);
    
    const sunriseElements = document.querySelectorAll('.sunTime');
    sunriseElements.forEach((element, index) => {
        if (index === 0) {
            element.innerHTML = `<p><b>Lever du soleil</b></p><br> ${sunriseTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} `;
        } else {
            element.innerHTML = `<p><b>Coucher du soleil</b></p><br> ${sunsetTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
        }
    });
}

// Fonction pour obtenir l'icône météo basée sur le code WMO (World Meteoligical Organization)
function getWeatherIcon(code) {
    if (code === 0 || code === 1) return 'fa-sun'; // Clair
    if (code === 2) return 'fa-cloud-sun'; // Partiellement nuageux
    if (code === 3) return 'fa-cloud'; // Nuageux
    if (code === 45 || code === 48) return 'fa-cloud'; // Brouillard
    if (code >= 51 && code <= 67) return 'fa-cloud-rain'; // Pluie légère/modérée
    if (code >= 71 && code <= 77) return 'fa-snowflake'; // Neige
    if (code >= 80 && code <= 82) return 'fa-cloud-rain'; // Pluie forte
    if (code >= 85 && code <= 86) return 'fa-snowflake'; // Averse de neige
    if (code >= 80 && code <= 99) return 'fa-bolt'; // Orage
    return 'fa-cloud'; // Par défaut
}

// Fonction pour obtenir la couleur de l'icône basée sur le code WMO
function getWeatherColor(code) {
    if (code === 0 || code === 1) return '#FFD700'; // Soleil = Jaune/Or
    if (code === 2) return '#FFD700'; // Partiellement nuageux = Jaune
    if (code === 3) return '#A9A9A9'; // Nuageux = Gris
    if (code === 45 || code === 48) return '#D3D3D3'; // Brouillard = Gris clair
    if (code >= 51 && code <= 67) return '#4169E1'; // Pluie = Bleu
    if (code >= 71 && code <= 77) return '#87CEEB'; // Neige = Bleu ciel
    if (code >= 80 && code <= 82) return '#1E90FF'; // Pluie forte = Bleu foncé
    if (code >= 85 && code <= 86) return '#87CEEB'; // Averse de neige = Bleu ciel
    if (code >= 80 && code <= 99) return '#FF6347'; // Orage = Rouge/Orange
    return '#A9A9A9'; // Par défaut = Gris
}

// Fonction pour obtenir la description du code météo WMO
function getWeatherDescription(code) {
    const descriptions = {
        0: 'Ciel dégagé',
        1: 'Dégagé',
        2: 'Partiellement nuageux',
        3: 'Couvert',
        45: 'Brouillard',
        48: 'Brouillard verglaçant',
        51: 'Pluie légère',
        53: 'Pluie modérée',
        55: 'Pluie forte',
        61: 'Pluie légère',
        63: 'Pluie modérée',
        65: 'Pluie forte',
        71: 'Neige légère',
        73: 'Neige modérée',
        75: 'Neige forte',
        77: 'Grains de neige',
        80: 'Pluie légère',
        81: 'Pluie modérée',
        82: 'Pluie forte',
        85: 'Averse de neige',
        86: 'Forte averse de neige',
        95: 'Orage',
        96: 'Orage avec grésil',
        99: 'Orage avec fortes précipitations'
    };
    return descriptions[code] || 'Météo';
}

 //verifier is day or not
if(data.current.is_day==0){
    document.querySelector("body").style.background="linear-gradient(to top, #0f2027, #203a43, #2c5364)";
    var star=document.querySelectorAll("i")[0]
    var star1=document.querySelectorAll("i")[1]
    star.className="fa-solid fa-star"
    star.style.color="white"
    star.style.textShadow="3px 3px 10px black"
    star1.className="fa-solid fa-star"
    star1.style.color="white"
    star1.style.textShadow="3px 3px 10px black"
}