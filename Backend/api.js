// api.js
const BASE_URL = "http://localhost:3000";

export async function getUnits(type) {
  try {

    const res = await fetch(`http://localhost:3000/units?type=${type}`);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching units:", error);
    return [];
  }
}

export async function getConversion(from, to) {
  if (from === to) {
    return { from, to, factor: 1, formula: null };
  }

  try {
    const res = await fetch(`${BASE_URL}/conversions?from=${from}&to=${to}`);

    const data = await res.json();

    if (!data.length) {
      throw new Error("No conversion found");
    }

    return data[0];
  } catch (error) {
    console.error("Error fetching conversion:", error);
    throw new Error("Conversion not available for this pair");
  }
}
