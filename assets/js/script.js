mapboxgl.accessToken =
  "pk.eyJ1IjoibmdoaWFja3R2IiwiYSI6ImNsZ2o1c2U5ZzA0aXozZHBxNWR2Mm4yMXEifQ.n117GpgAKjdkhWlZj39ECg";

var map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v11",
  center: [0, 0],
  zoom: 13,
});

// Khởi tạo Geocoder
var geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl,
  marker: false,
  placeholder: "Tìm kiếm địa điểm",
  country: "vn",
  language: "vi",
  bbox: [102.144858, 8.499986, 109.468082, 23.393395],
  autocomplete: false,
});

map.addControl(geocoder, "top-right");

var marker = new mapboxgl.Marker({ color: "red" });
geocoder.on("result", function (e) {
  const coordinates = e.result.center;
  marker.setLngLat(coordinates).addTo(map);
});

// Style chỉnh lại geocoder
var geocoderCon = document.querySelector(".mapboxgl-ctrl-top-right");
geocoderCon.style.top = "80px";
var geotext = document.querySelector(".mapboxgl-ctrl-geocoder input");
geotext.style.padding = "10px 40px 10px 30px";
var geowidth = document.querySelector(".mapboxgl-ctrl-geocoder");
geowidth.style.minWidth = "280px";

// Hàm lấy vị trí thông minh (ưu tiên GPS, fallback IP)
function getCurrentLocation(callback) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const location = [position.coords.longitude, position.coords.latitude];
        console.log("📍 Vị trí lấy từ GPS:", location);
        callback(location);
      },
      function (error) {
        console.warn("⚠️ Không lấy được GPS, thử bằng IP:", error.message);
        fetch("https://ipinfo.io/json?token=d2220ee89dee35")
          .then((res) => res.json())
          .then((data) => {
            const loc = data.loc.split(",");
            const location = [parseFloat(loc[1]), parseFloat(loc[0])];
            console.log(
              "🌐 Vị trí lấy từ IP:",
              location,
              `(thành phố: ${data.city})`
            );
            callback(location);
          })
          .catch((err) => {
            console.error("❌ Lỗi lấy vị trí qua IP:", err.message);
          });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }
}

// Khi load trang → lấy vị trí người dùng
getCurrentLocation((location) => {
  new mapboxgl.Marker({ color: "green" }).setLngLat(location).addTo(map);
  map.flyTo({ center: location, zoom: 14 });
});

// Popup thời tiết và địa chỉ khi click
var popups = [];
map.on("click", function (e) {
  const OPEN_CAGE_API_KEY = "ebcf567d3fd5487fabdb09b5c0294c7c";
  const OPEN_WEATHER_API_KEY = "796f491edaa3a413905e99c999c7ccb2";
  const lat = e.lngLat.lat;
  const lon = e.lngLat.lng;

  fetch(
    `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${OPEN_CAGE_API_KEY}`
  )
    .then((response) => response.json())
    .then((data) => {
      const address = data.results[0].formatted;

      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPEN_WEATHER_API_KEY}&units=metric`
      )
        .then((response) => response.json())
        .then((weatherData) => {
          const temperature = weatherData.main.temp;
          const weatherDesc = weatherData.weather[0].description;
          let vietnameseDesc;

          switch (weatherDesc) {
            case "clear sky":
              vietnameseDesc = "trời quang đãng";
              break;
            case "few clouds":
              vietnameseDesc = "trời ít mây";
              break;
            case "scattered clouds":
              vietnameseDesc = "trời rải rác mây";
              break;
            case "broken clouds":
              vietnameseDesc = "trời nhiều mây";
              break;
            case "shower rain":
              vietnameseDesc = "mưa rào";
              break;
            case "rain":
              vietnameseDesc = "mưa";
              break;
            case "thunderstorm":
              vietnameseDesc = "giông bão";
              break;
            case "snow":
              vietnameseDesc = "tuyết";
              break;
            case "mist":
              vietnameseDesc = "sương mù";
              break;
            case "overcast clouds":
              vietnameseDesc = "trời đầy mây";
              break;
            default:
              vietnameseDesc = weatherDesc;
          }

          if (popups.length > 0) popups.pop().remove();

          const popup = new mapboxgl.Popup({ closeButton: true })
            .setLngLat(e.lngLat)
            .setHTML(
              `
              <h2>${address}</h2>
              <h3>${lon}, ${lat}</h3>
              <p>Thời tiết: ${vietnameseDesc}</p>
              <p>Nhiệt độ: ${Math.round(temperature)}°C</p>
            `
            )
            .addTo(map);

          popups.push(popup);

          popup.on("close", () => {
            const index = popups.indexOf(popup);
            if (index > -1) popups.splice(index, 1);
          });
        });
    });
});

// Hiển thị tình trạng giao thông
let isTrafficVisible = false;
function toggleTraffic() {
  if (isTrafficVisible) {
    map.removeLayer("traffic");
    map.removeSource("traffic");
    isTrafficVisible = false;
  } else {
    map.addLayer({
      id: "traffic",
      type: "line",
      source: {
        type: "vector",
        url: "mapbox://mapbox.mapbox-traffic-v1",
      },
      "source-layer": "traffic",
      paint: {
        "line-color": {
          property: "congestion",
          type: "categorical",
          stops: [
            ["unknown", "#cccccc"],
            ["low", "#00ff00"],
            ["moderate", "#ffff00"],
            ["heavy", "#ff6600"],
            ["severe", "#ff0000"],
          ],
        },
        "line-width": 2,
      },
      minzoom: 6,
    });
    isTrafficVisible = true;
  }
}

document
  .getElementById("status-traffic")
  .addEventListener("click", toggleTraffic);

// Nút trở lại vị trí hiện tại
var backToMarkerButton = document.getElementById("marker-reset-button");
backToMarkerButton.addEventListener("click", () => {
  getCurrentLocation((location) => {
    map.flyTo({ center: location, zoom: 14 });
  });
});

// // Tìm đường đi giữa hai điểm
// directions.setOrigin(start);
// directions.setDestination(end);

// Chức năng tìm đường giữa hai điểm
const searchButton = document.getElementById("search-button");
const directionsControls = document.querySelector(
  ".mapboxgl-control-container"
);

function showBuyTicket() {
  directionsControls.classList.add("open");
}
if (searchButton) {
  searchButton.addEventListener("click", showBuyTicket);
}
