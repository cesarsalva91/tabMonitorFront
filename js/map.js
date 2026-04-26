let map;
let markers = {};

function inicializarMapa() {
  map = L.map("map", {
    zoomControl: false
  }).setView(
    [CONFIG.DEFAULT_VIEW.lat, CONFIG.DEFAULT_VIEW.lng],
    CONFIG.DEFAULT_VIEW.zoom
  );

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: "abcd",
    maxZoom: 20
  }).addTo(map);
}

function crearIcono(rutaIcono) {
  return L.icon({
    iconUrl: rutaIcono,
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -42]
  });
}

function obtenerFasesVisibles(device) {
  if (device.estado_conexion === "offline") {
    return {
      fase1: 0,
      fase2: 0,
      fase3: 0
    };
  }

  return device.ultimo_estado_fases || {
    fase1: 0,
    fase2: 0,
    fase3: 0
  };
}

function obtenerIconoPorEstado(device) {
  if (device.estado_conexion === "offline") {
    return crearIcono(CONFIG.ICONS.offline);
  }

  const fases = obtenerFasesVisibles(device);

  const cantidadFasesActivas =
    Number(fases.fase1 === 1) +
    Number(fases.fase2 === 1) +
    Number(fases.fase3 === 1);

  if (cantidadFasesActivas === 3) {
    return crearIcono(CONFIG.ICONS.fase3);
  }

  if (cantidadFasesActivas === 2) {
    return crearIcono(CONFIG.ICONS.fase2);
  }

  if (cantidadFasesActivas === 1) {
    return crearIcono(CONFIG.ICONS.fase1);
  }

  return crearIcono(CONFIG.ICONS.faseOff);
}

function formatearFecha(fechaIso) {
  if (!fechaIso) {
    return "Sin datos";
  }

  const fecha = new Date(fechaIso);

  if (Number.isNaN(fecha.getTime())) {
    return fechaIso;
  }

  return fecha.toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "medium"
  });
}

function textoEstadoConexion(device) {
  if (device.estado_conexion === "online") {
    return `<span class="estado-online">Online</span>`;
  }

  return `<span class="estado-offline">Offline</span>`;
}

function textoFase(valor) {
  return valor === 1
    ? `<span class="fase-on">ON</span>`
    : `<span class="fase-off">OFF</span>`;
}

function crearContenidoPopup(device) {
  const fases = obtenerFasesVisibles(device);

  return `
    <div class="device-popup">
      <h3>${device.nombre || "Dispositivo sin nombre"}</h3>

      <p>
        <strong>ID:</strong> ${device.id_dispositivo || "Sin ID"}
      </p>

      <p>
        <strong>Estado:</strong> ${textoEstadoConexion(device)}
      </p>

      <p>
        <strong>Último online:</strong><br>
        ${formatearFecha(device.ultimo_online)}
      </p>

      <div class="fases-popup">
        <div><strong>F1:</strong> ${textoFase(fases.fase1)}</div>
        <div><strong>F2:</strong> ${textoFase(fases.fase2)}</div>
        <div><strong>F3:</strong> ${textoFase(fases.fase3)}</div>
      </div>
    </div>
  `;
}

function dispositivoTieneCoordenadas(device) {
  return (
    device.coordenadas &&
    typeof device.coordenadas.lat === "number" &&
    typeof device.coordenadas.lng === "number"
  );
}

function actualizarMarcador(device) {
  if (!dispositivoTieneCoordenadas(device)) {
    console.warn("Dispositivo sin coordenadas válidas:", device);
    return;
  }

  const id = device.id_dispositivo;
  const latLng = [device.coordenadas.lat, device.coordenadas.lng];
  const icono = obtenerIconoPorEstado(device);
  const contenidoPopup = crearContenidoPopup(device);

  if (markers[id]) {
    markers[id].setLatLng(latLng);
    markers[id].setIcon(icono);
    markers[id].setPopupContent(contenidoPopup);
    return;
  }

  markers[id] = L.marker(latLng, { icon: icono })
    .addTo(map)
    .bindPopup(contenidoPopup);
}

function actualizarMapa(dispositivos) {
  dispositivos.forEach(actualizarMarcador);
}