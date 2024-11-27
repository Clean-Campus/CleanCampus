class LeafletMap {
  constructor(containerId, center, zoom) {
    this.map = L.map(containerId, {
      center: center,
      zoom: zoom,
      dragging: true,
      zoomControl: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      touchZoom: false,
      tap: false
    });
    this.initTileLayer();
    this.markers = [];
    this.lastSelectedMarker = null;
  }

  initTileLayer() {
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);
  }

  addMarker(lat, lng, name, imageUrl, id, htmlLink, categories) {
    const marker = L.marker([lat, lng]).addTo(this.map);

    marker.on('click', () => {
      marker.bindPopup(`
        <img src="${imageUrl}" alt="${name}" style="width: 100px; height: auto;" />
        <p>Categories: ${categories.join(', ')}</p>
      `).openPopup();
    });

    marker.on('dblclick', () => {
      const infoDiv = document.createElement('div');
      infoDiv.innerHTML = `
        <p>Details for ${name}:</p>
        <p>ID: ${id}</p>
        <img src="${imageUrl}" alt="${name}" style="width: 150px; height: auto; display: block; margin-top: 5px;">
        <div style="text-align: center; margin-top: 10px;">
          <button onclick="window.location.href='${htmlLink}'" class="btn btn-primary more-details-btn">More Details</button>
        </div>
      `;
      marker.bindPopup(infoDiv).openPopup();
    });

    this.markers.push({ lat, lng, name, marker });
    return marker;
  }

  changeMarkerColor(marker, color) {
    const markerElement = marker.getElement();
    markerElement.classList.remove('marker-red', 'marker-blue', 'marker-green');
    markerElement.classList.add(`marker-${color}`);
    marker.openPopup();
  }

  resetMarkerColor() {
    if (this.lastSelectedMarker) {
      const lastMarkerElement = this.lastSelectedMarker.getElement();
      lastMarkerElement.classList.remove('marker-red', 'marker-blue', 'marker-green');
      lastMarkerElement.classList.add('marker-default');
    }
  }

  openPopup(lat, lng, color = 'red') {
    const marker = this.markers.find((m) => m.lat === lat && m.lng === lng);
    if (marker) {
      this.map.panTo([lat, lng]);
      this.resetMarkerColor();
      this.changeMarkerColor(marker.marker, color);
      this.lastSelectedMarker = marker.marker;
      marker.marker.openPopup();
    }
  }

  loadMarkersFromJson(url) {
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        data.garbageData.forEach((item) => {
          this.addMarker(
            item.location.lat, 
            item.location.lng, 
            item.name, 
            item.image, 
            item.id, 
            item.htmlLink, 
            item.categories
          );
        });
      })
      .catch((error) => console.error('Error loading markers:', error));
  }
}

class LocationCard {
  constructor(name, lat, lng, categories, imageUrl) {
    this.name = name;
    this.lat = lat;
    this.lng = lng;
    this.categories = categories;
    this.imageUrl = imageUrl;
  }

  createCard() {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card location-card';
    cardDiv.innerHTML = `
      <div class="card-body">
        <div class="row">
          <div class="col-sm-4">
            <img src="${this.imageUrl}" class="card-img-top" alt="${this.name}" style="width: 100%; height: auto;">
          </div>
          <div class="col-sm-8">
            <h5 class="card-title">${this.name}</h5>
            <p><strong>Categories:</strong> ${this.categories.join(', ')}</p>
          </div>
        </div>
      </div>
    `;

    cardDiv.addEventListener('click', () => {
      cardDiv.classList.toggle('active');
      myMap.openPopup(this.lat, this.lng, 'red');
    });

    return cardDiv;
  }

  changeCardColor(color) {
    this.cardElement.classList.remove('card-red', 'card-blue', 'card-green');
    this.cardElement.classList.add(`card-${color}`);
  }
}

class LocationRenderer {
  constructor(containerId, searchInputId) {
    this.container = document.getElementById(containerId);
    this.searchInput = document.getElementById(searchInputId);
    this.locations = [];
    this.filteredLocations = [];

    this.searchInput.addEventListener('input', () => this.filterLocations());
  }

  fetchLocationData(url) {
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        this.locations = data.garbageData;
        this.filteredLocations = this.locations;
        this.renderLocations(this.filteredLocations);
      })
      .catch((error) => console.error('Error loading location data:', error));
  }
  
  renderLocations(data) {
    this.container.innerHTML = '';
    data.forEach((location) => {
      const locationCard = new LocationCard(
        location.name, 
        location.location.lat, 
        location.location.lng, 
        location.categories, 
        location.image 
      );
      this.container.appendChild(locationCard.createCard());
    });
  }
  
  filterLocations() {
    const query = this.searchInput.value.toLowerCase();
    this.filteredLocations = this.locations.filter((location) =>
      location.name.toLowerCase().includes(query)
    );
    this.renderLocations(this.filteredLocations);
  }
}

const myMap = new LeafletMap('map', [8.360004, 124.868419], 18);
const locationRenderer = new LocationRenderer('location-container', 'searchLocation');

myMap.loadMarkersFromJson('app.json');
locationRenderer.fetchLocationData('app.json');
