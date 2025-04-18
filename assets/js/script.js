mapboxgl.accessToken =
  "pk.eyJ1IjoibmdoaWFja3R2IiwiYSI6ImNsZ2o1c2U5ZzA0aXozZHBxNWR2Mm4yMXEifQ.n117GpgAKjdkhWlZj39ECg";
var map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v12",
  center: [0, 0],
  zoom: 13,
});

// Khởi tạo một đối tượng geocoder
var geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl,
  marker: false,
  placeholder: "Tìm kiếm địa điểm",
  country: "vn", // Đổi 'countries' thành 'country'
  language: "vi",
  bbox: [102.144858, 8.499986, 109.468082, 23.393395],
  autocomplete: false,
  type: "nominatim",
});

// Thêm đối tượng geocoder vào map
map.addControl(geocoder, "top-right");
// Thêm event listener cho sự kiện "result" của geocoder
geocoder.on("result", function (ev) {
  // Lấy loại kết quả trả về (geocoding hay reverse geocoding)
  var resultType = ev.result.geometry.type;

  // Nếu kết quả là reverse geocoding (tìm kiếm theo tọa độ)
  if (resultType === "Point") {
    // Lấy tọa độ của địa chỉ
    var lngLat = ev.result.geometry.coordinates;

    // Tạo một marker tại tọa độ đó
    var marker = new mapboxgl.Marker().setLngLat(lngLat).addTo(map);
  }
});
// Tạo một marker màu đỏ
var marker = new mapboxgl.Marker({
  color: "red",
});
geocoder.on("result", function (e) {
  var coordinates = e.result.center;

  // Cập nhật vị trí của marker
  marker.setLngLat(coordinates).addTo(map);
});

var geocoderCon = document.querySelector(".mapboxgl-ctrl-top-right");
geocoderCon.style.top = "80px";
var geotext = document.querySelector(".mapboxgl-ctrl-geocoder input");
geotext.style.padding = "10px 40px 10px 30px";
var geowidth = document.querySelector(".mapboxgl-ctrl-geocoder");
geowidth.style.minWitdh = "280px";
// Lấy vị trí hiện tại của máy tính
navigator.geolocation.getCurrentPosition(function (position) {
  // Lấy vị trí hiện tại của máy tính
  const currentLocation = [position.coords.longitude, position.coords.latitude];

  // Thêm marker tại vị trí hiện tại
  new mapboxgl.Marker().setLngLat(currentLocation).addTo(map);

  // Di chuyển tới vị trí hiện tại
  map.flyTo({
    center: currentLocation,
    zoom: 14,
  });
});

// Lấy vị trí hiện tại của máy tính
// navigator.geolocation.getCurrentPosition(
//   function (position) {
//     // Lấy vị trí hiện tại của máy tính
//     const currentLocation = [
//       position.coords.longitude,
//       position.coords.latitude,
//     ];
//     // Thêm marker tại vị trí hiện tại
//     new mapboxgl.Marker({ color: "green" })
//       .setLngLat(currentLocation)
//       .addTo(map);
//     // Di chuyển tới vị trí hiện tại
//     map.flyTo({
//       center: currentLocation,
//       zoom: 14,
//     });
//   },
//   function (error) {
//     console.error("Không thể lấy vị trí:", error.message);
//   },
//   {
//     enableHighAccuracy: true,
//     timeout: 10000,
//     maximumAge: 0,
//   }
// );

var popups = [];

map.on("click", function (e) {
  const OPEN_CAGE_API_KEY = "ebcf567d3fd5487fabdb09b5c0294c7c";
  const OPEN_WEATHER_API_KEY = "796f491edaa3a413905e99c999c7ccb2";
  const lat = e.lngLat.lat;
  const lon = e.lngLat.lng;

  // Sử dụng API Geocoding của OpenCage để lấy thông tin địa chỉ từ tọa độ
  fetch(
    `https://api.opencagedata.com/geocode/v1/json?q=${e.lngLat.lat}+${e.lngLat.lng}&key=${OPEN_CAGE_API_KEY}`
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
          let weatherDesc = weatherData.weather[0].description;
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
              vietnameseDesc = "trời đầy mây, có thể là mây đen";
              break;
            default:
              vietnameseDesc = weatherDesc;
          }

          // Đóng popup cũ nếu có
          if (popups.length > 0) {
            var currentPopup = popups.pop();
            currentPopup.remove();
          }

          // Tạo popup mới
          const popup = new mapboxgl.Popup({ closeButton: true })
            .setLngLat(e.lngLat)
            .setHTML(
              `<h2>${address}</h2><h3>${lon},${lat}</h3><p>Thời tiết: ${vietnameseDesc}</p><p>Nhiệt độ: ${Math.round(
                temperature
              )}°C</p>`
            )
            .addTo(map);

          // Lưu vào danh sách popup
          popups.push(popup);

          // Khi popup đóng thì xoá khỏi danh sách
          popup.on("close", function () {
            const index = popups.indexOf(popup);
            if (index > -1) {
              popups.splice(index, 1);
            }
          });
        });
    });
});
// Hiển thị tình trạng giao thông
// Khai báo biến lưu trạng thái hiển thị của layer traffic
let isTrafficVisible = false;

// Định nghĩa hàm myFunction
function myFunction() {
  if (isTrafficVisible) {
    // Xóa layer traffic khỏi bản đồ
    map.removeLayer("traffic");
    map.removeSource("traffic");
    isTrafficVisible = false;
  } else {
    // Thêm layer traffic vào bản đồ
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

// Thêm sự kiện click vào button và thực hiện hàm myFunction khi button được nhấn
const myButton = document.getElementById("status-traffic");
myButton.addEventListener("click", myFunction);

// Nút trở lại vị trí của local
var backToMarkerButton = document.getElementById("marker-reset-button");
backToMarkerButton.addEventListener("click", () => {
  // Lấy vị trí hiện tại của máy tính
  navigator.geolocation.getCurrentPosition(function (position) {
    // Lấy vị trí hiện tại của máy tính
    const currentLocation = [
      position.coords.longitude,
      position.coords.latitude,
    ];

    map.flyTo({
      center: currentLocation,
      zoom: 14,
    });
  });
});

// // Tìm đường đi giữa hai điểm
// directions.setOrigin(start);
// directions.setDestination(end);

// Chức năng tìm đường giữa hai điểm
// Lấy đối tượng button và đối tượng directions
// Lấy đối tượng button và đối tượng directions
const searchButton = document.getElementById("search-button");
const directionsControls = document.querySelector(
  ".mapboxgl-control-container"
);

function showBuyTicket() {
  directionsControls.classList.add("open");
}
for (const searchButton of searchButton) {
  searchButton.addEventListener("click", showBuyTicket);
}
