async function fetchDevices() {
  const response = await fetch(CONFIG.API_URL);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return Object.values(data);
}