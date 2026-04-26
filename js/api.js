async function obtenerDispositivos() {
  try {
    const response = await fetch(CONFIG.API_URL);

    if (!response.ok) {
      throw new Error("Error en la respuesta del backend");
    }

    const data = await response.json();

    // El backend devuelve un objeto, lo convertimos a array
    return Object.values(data);

  } catch (error) {
    console.error("Error obteniendo dispositivos:", error);
    return [];
  }
}