let refreshTimer = null;

async function loadAndRenderDevices() {
  try {
    const devices = await fetchDevices();
    renderDevices(devices);

    document.getElementById("lastUpdate").textContent =
      `Última actualización: ${new Date().toLocaleTimeString("es-AR")}`;
  } catch (error) {
    console.error("Error cargando dispositivos:", error);
    document.getElementById("lastUpdate").textContent =
      "Error al actualizar";
  } finally {
    scheduleNextRefresh();
  }
}

function scheduleNextRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(loadAndRenderDevices, CONFIG.REFRESH_MS);
}

loadAndRenderDevices();