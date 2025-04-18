var mapSection = document.getElementById("map-section");
var timduongSection = document.getElementById("timduong-section");

// Hiển thị phần map
function showMap() {
  mapSection.style.display = "block";
  timduongSection.style.display = "none";
  contactSection.style.display = "none";
}
var isDirectionControlVisible = false;
var directions = null;
// Hiển thị phần tìm đường
function showTimduong() {
  if (isDirectionControlVisible) {
    // Nếu control direction đang hiển thị thì ẩn nó đi
    map.removeControl(directions);
    directions = null;
    isDirectionControlVisible = false;
  } else {
    // Nếu control direction chưa hiển thị thì tạo mới nó và hiển thị lên map
    directions = new MapboxDirections({
      accessToken: mapboxgl.accessToken,
      language: "vi",
      unit: "metric",
      profile: "mapbox/driving-traffic",
      controls: {
        inputs: true,
        instructions: true,
        profileSwitcher: true,
      },
      alternatives: true,
    });

    map.addControl(directions, "top-left");
    var directionsContainer = document.querySelector(".mapboxgl-ctrl-top-left");
    directionsContainer.style.top = "90px";
    // var direciput = document.querySelector('.mapbox-directions-controls button.directions-icon-reverse');
    // direciput.style.width ='260px';

    isDirectionControlVisible = true;
  }
  timduongSection.style.display = "block";
}

// Hiển thị phần liên hệ
function showContact() {
  mapSection.style.display = "none";
  timduongSection.style.display = "none";
  contactSection.style.display = "block";
}
