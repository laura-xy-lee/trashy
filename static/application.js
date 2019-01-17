mapboxgl.accessToken =
  "pk.eyJ1IjoibGF1cmFsZWUiLCJhIjoiY2pxaHQzYjlsMmowMzQzcXAyYmZ6MnhjNiJ9.T-_5OQrzP6XMd15BZ59Qyg";

function extractContent(value) {
  var div = document.createElement("div");
  div.innerHTML = value;
  var text = div.textContent;
  return text;
}

function getAddress(str) {
  rawStr = extractContent(str);
  var block = rawStr
    .split("ADDRESSBLOCKHOUSENUMBER")[1]
    .split("ADDRESSBUILDINGNAME")[0];
  var buildingName = rawStr
    .split("ADDRESSBUILDINGNAME")[1]
    .split("ADDRESSFLOORNUMBER")[0];
  // var floor = rawStr
  //   .split("ADDRESSFLOORNUMBER")[1]
  //   .split("ADDRESSPOSTALCODE")[0];
  // var postalCode = rawStr
  //   .split("ADDRESSPOSTALCODE")[1]
  //   .split("ADDRESSSTREETNAME")[0];
  var streetName = rawStr
    .split("ADDRESSSTREETNAME")[1]
    .split("ADDRESS TYPE")[0];
  // var fullAddress = [block, buildingName, floor, postalCode, streetName];
  var fullAddress = [block, buildingName, streetName];
  return fullAddress.join(" ");
}

function getDescription(str) {
  var description = str.split("<td>NAME</td>")[1].split("<td>PHOTOURL</td>")[0];
  return extractContent(description);
}

// iterate through locations and add each one to the sidebar listing
function buildLocationList(data) {
  // Iterate through the list of stores
  for (i = 0; i < data.features.length; i++) {
    var currentFeature = data.features[i];

    var prop = currentFeature.properties;

    // Select the listing container in the HTML and append a div
    // with the class 'item' for each store
    var listings = document.getElementById("listings");
    var listing = listings.appendChild(document.createElement("div"));
    listing.className = "item";
    listing.id = "listing-" + i;

    // Create a new link with the class 'title' for each store
    // and fill it with the store address
    var link = listing.appendChild(document.createElement("a"));
    link.href = "#";
    link.className = "title";
    link.dataPosition = i;
    link.innerHTML = getAddress(prop.description);

    // Create a new div with the class 'details' for each store
    // and fill it with the city and phone number
    var details = listing.appendChild(document.createElement("div"));
    details.innerHTML = getDescription(prop.description);

    // Add distance information if present
    if (prop.distance) {
      var roundedDistance = Math.round(prop.distance * 100) / 100;
      details.innerHTML += '<p><strong>' + roundedDistance + ' km away</strong></p>';
    }
    
    // Add an event listener for the links in the sidebar listing
    link.addEventListener("click", function(e) {
      // Update the currentFeature to the store associated with the clicked link
      var clickedListing = data.features[this.dataPosition];
      // 1. Fly to the point associated with the clicked link
      flyToStore(clickedListing);
      // 2. Close all other popups and display popup for clicked store
      createPopUp(clickedListing);
      // 3. Highlight listing in sidebar (and remove highlight for all other listings)
      var activeItem = document.getElementsByClassName("active");
      if (activeItem[0]) {
        activeItem[0].classList.remove("active");
      }
      this.parentNode.classList.add("active");
    });
    
  }
}

// flies map to the correct store
function flyToStore(currentFeature) {
  map.flyTo({
    center: currentFeature.geometry.coordinates,
    zoom: 17
  });
}

// displays pop up at the correct store
function createPopUp(currentFeature) {
  var popUps = document.getElementsByClassName("mapboxgl-popup");
  // Check if there is already a popup on the map and if so, remove it
  if (popUps[0]) popUps[0].remove();

  var popup = new mapboxgl.Popup({ closeOnClick: true })
    .setLngLat(currentFeature.geometry.coordinates)
    .setHTML(
      "<h3>Recycling Bin at</h3>" +
        "<h4>" +
        getAddress(currentFeature.properties.description) +
        "</h4>"
    )
    .addTo(map);
}

function sortLonLat(storeIdentifier, searchResult) {
  // Get lat lon of nearest store and location selected
  var lats = [stores.features[storeIdentifier].geometry.coordinates[1], searchResult.coordinates[1]];
  var lons = [stores.features[storeIdentifier].geometry.coordinates[0], searchResult.coordinates[0]];

  // Sort lat lon to create bounding box
  var sortedLons = lons.sort(function(a, b) {
    if (a > b) {
      return 1;
    }
    if (a.distance < b.distance) {
      return -1;
    }
    return 0;
  });
  var sortedLats = lats.sort(function(a, b) {
    if (a > b) {
      return 1;
    }
    if (a.distance < b.distance) {
      return -1;
    }
    return 0;
  });

  map.fitBounds([
    [sortedLons[0], sortedLats[0]],
    [sortedLons[1], sortedLats[1]]
  ], {
    padding: 100
  });
}

// create the map object
var map = new mapboxgl.Map({
  // container id specified in the HTML
  container: "map",
  // style URL
  style: "mapbox://styles/mapbox/light-v9",
  // initial position in [lon, lat] format
  center: [103.8198, 1.3521], // now we can see Singapore!
  // initial zoom
  zoom: 11.3
});

// This will let you use the .remove() function later on
if (!("remove" in Element.prototype)) {
  Element.prototype.remove = function() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  };
}

var stores;

var geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  bbox: [103.6182, 1.1158, 104.4085, 1.4706]
});

map.on("load", function(e) {
  // Add recycling bin locations layer
  $.ajax({
    async: true,
    global: false,
    url: "/static/RECYCLINGBINS.geojson",
    dataType: "json",
    success: function(data) {
      stores = data;
        // Add the data to your map as a layer
      map.addLayer({
        id: "locations",
        type: "symbol",
        // Add a GeoJSON source containing place coordinates and information.
        source: {
          type: "geojson",
          data: stores
        },
        layout: {
          "icon-image": "marker-15",
          "icon-allow-overlap": true
        }
      });
      // creates the list of stores
      buildLocationList(stores);
    }
  });

  // Add location search layer
  map.addControl(geocoder, 'top-left');

  // Add marker layer for location search
  map.addSource('single-point', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [] // Notice that initially there are no features
    }
  });

  map.addLayer({
    id: 'point',
    source: 'single-point',
    type: 'circle',
    paint: {
      'circle-radius': 10,
      'circle-color': '#007cbf',
      'circle-stroke-width': 3,
      'circle-stroke-color': '#fff'
    }
  });

  // Fire event when user selects a search result
  geocoder.on('result', function(ev) {

    // Update geometry of single-point
    var searchResult = ev.result.geometry;
    map.getSource('single-point').setData(searchResult);

    // Calculate distance between all stores and this point
    stores.features.forEach(function(store) {
      Object.defineProperty(store.properties, 'distance', {
        value: turf.distance(searchResult, store.geometry),
        writable: true,
        enumerable: true,
        configurable: true
      });
    });

    // Sort all stores by distance from point
    stores.features.sort(function(a, b) {
      if (a.properties.distance > b.properties.distance) {
        return 1;
      }
      if (a.properties.distance < b.properties.distance) {
        return -1;
      }
      // a must be equal to b
      return 0;
    });

    // Remove previous listing, create new list ordered by distance
    var listings = document.getElementById('listings');
    while (listings.firstChild) {
      listings.removeChild(listings.firstChild);
    }

    buildLocationList(stores);

    // Create pop up for nearest store
    sortLonLat(0, searchResult);
    createPopUp(stores.features[0]);
  });
});

// Add an event listener for when a user clicks on the map
map.on("click", function(e) {
  // Query all the rendered points in the view
  var features = map.queryRenderedFeatures(e.point, { layers: ["locations"] });
  if (features.length) {
    var clickedPoint = features[0];
    // 1. Fly to the point
    flyToStore(clickedPoint);
    // 2. Close all other popups and display popup for clicked store
    createPopUp(clickedPoint);
    // 3. Highlight listing in sidebar (and remove highlight for all other listings)
    var activeItem = document.getElementsByClassName("active");
    if (activeItem[0]) {
      activeItem[0].classList.remove("active");
    }
    // Find the index of the store.features that corresponds to the clickedPoint that fired the event listener
    var selectedFeature = clickedPoint.properties.address;

    for (var i = 0; i < stores.features.length; i++) {
      if (stores.features[i].properties.address === selectedFeature) {
        selectedFeatureIndex = i;
      }
    }
    // Select the correct list item using the found index and add the active class
    var listing = document.getElementById("listing-" + selectedFeatureIndex);
    listing.classList.add("active");
  }
});
