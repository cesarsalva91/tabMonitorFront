async function cargarDispositivos() {
  const dispositivos = await obtenerDispositivos();
  actualizarMapa(dispositivos);
}

document.addEventListener("DOMContentLoaded", async () => {
  inicializarMapa();

  await cargarDispositivos();

  setInterval(async () => {
    await cargarDispositivos();
  }, CONFIG.REFRESH_MS);
});