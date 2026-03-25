const savedView = JSON.parse(localStorage.getItem("mapView") || "null");
const initialView = savedView || CONFIG.DEFAULT_VIEW;

const map = L.map("map").setView(
  [initialView.lat, initialView.lng],
  initialView.zoom
);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const markers = {};
let firstFitDone = !!savedView;

map.on("moveend", () => {
  const center = map.getCenter();
  localStorage.setItem(
    "mapView",
    JSON.stringify({
      lat: center.lat,
      lng: center.lng,
      zoom: map.getZoom()
    })
  );
});

function normalizeCoords(coordenadas) {
  if (!coordenadas) return null;

  const lat = Number(coordenadas.lat);
  const lng = Number(coordenadas.lng);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return { lat, lng };
}

function phaseIsActive(value) {
  return Number(value) !== 0;
}

function countActivePhases(device) {
  return [device.fase1, device.fase2, device.fase3].filter(phaseIsActive).length;
}

function getMarkerIconUrl(activeCount) {
  if (activeCount === 3) return "img/fase3.png";
  if (activeCount === 2) return "img/fase2.png";
  if (activeCount === 1) return "img/fase1.png";
  return "img/fase-off.png";
}

function createDivIcon(iconUrl) {
  return L.divIcon({
    className: "custom-pin-icon",
    html: `
      <div class="custom-pin-wrap">
        <img src="${iconUrl}" alt="marker" class="custom-pin-img" />
      </div>
    `,
    iconSize: [70, 70],
    iconAnchor: [35, 70],
    popupAnchor: [0, -70]
  });
}

function buildPopup(device) {
  const activeCount = countActivePhases(device);
  const statusText =
    activeCount === 0
      ? "Sin fases activas"
      : `${activeCount} fase(s) activa(s)`;

  return `
    <div class="popup">
      <h3>${device.id_dispositivo}</h3>
      <div class="status-row">
        <span>Estado general:</span>
        <span class="${activeCount === 0 ? "status-off" : "status-ok"}">${statusText}</span>
      </div>
      <div class="status-row">
        <span>Fase 1:</span>
        <span class="${phaseIsActive(device.fase1) ? "status-ok" : "status-off"}">${device.fase1}</span>
      </div>
      <div class="status-row">
        <span>Fase 2:</span>
        <span class="${phaseIsActive(device.fase2) ? "status-ok" : "status-off"}">${device.fase2}</span>
      </div>
      <div class="status-row">
        <span>Fase 3:</span>
        <span class="${phaseIsActive(device.fase3) ? "status-ok" : "status-off"}">${device.fase3}</span>
      </div>
      <div class="status-row">
        <span>Latitud:</span>
        <span>${device.coordenadas.lat}</span>
      </div>
      <div class="status-row">
        <span>Longitud:</span>
        <span>${device.coordenadas.lng}</span>
      </div>
    </div>
  `;
}

function renderDevices(devices) {
  const bounds = [];
  const visibleIds = new Set();

  devices.forEach((device) => {
    const coords = normalizeCoords(device.coordenadas);

    if (!coords) {
      console.warn(
        "No se pudieron interpretar las coordenadas de:",
        device.id_dispositivo,
        device.coordenadas
      );
      return;
    }

    visibleIds.add(device.id_dispositivo);

    const normalizedDevice = {
      ...device,
      coordenadas: coords
    };

    const activeCount = countActivePhases(normalizedDevice);
    const iconUrl = getMarkerIconUrl(activeCount);

    if (markers[device.id_dispositivo]) {
      const markerData = markers[device.id_dispositivo];
      const currentLatLng = markerData.marker.getLatLng();

      if (currentLatLng.lat !== coords.lat || currentLatLng.lng !== coords.lng) {
        markerData.marker.setLatLng([coords.lat, coords.lng]);
      }

      if (markerData.iconUrl !== iconUrl) {
        markerData.marker.setIcon(createDivIcon(iconUrl));
        markerData.iconUrl = iconUrl;
      }

      markerData.device = normalizedDevice;
    } else {
      const marker = L.marker([coords.lat, coords.lng], {
        icon: createDivIcon(iconUrl)
      }).addTo(map);

      marker.on("click", () => {
        const currentData = markers[device.id_dispositivo]?.device;
        if (!currentData) return;

        marker.bindPopup(buildPopup(currentData)).openPopup();
      });

      markers[device.id_dispositivo] = {
        marker,
        iconUrl,
        device: normalizedDevice
      };
    }

    bounds.push([coords.lat, coords.lng]);
  });

  Object.keys(markers).forEach((deviceId) => {
    if (!visibleIds.has(deviceId)) {
      map.removeLayer(markers[deviceId].marker);
      delete markers[deviceId];
    }
  });

  if (bounds.length > 0 && !firstFitDone) {
    map.fitBounds(bounds, { padding: [40, 40] });
    firstFitDone = true;

    const center = map.getCenter();
    localStorage.setItem(
      "mapView",
      JSON.stringify({
        lat: center.lat,
        lng: center.lng,
        zoom: map.getZoom()
      })
    );
  }
}