const BASE_URL = "http://localhost:3000";

// ---------------- UC-JS-03: Fetch Units for Selected Type ----------------
export async function getUnits(type) {
  try {
    const res = await fetch(`${BASE_URL}/units?type=${type}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching units:", error);
    return [];
  }
}

// ---------------- UC-JS-04: Fetch Conversion Record for Unit Pair ----------------
export async function getConversion(from, to) {
  if (from === to) {
    return { from, to, factor: 1, formula: null };
  }
  try {
    const res = await fetch(`${BASE_URL}/conversions?from=${from}&to=${to}`);
    const data = await res.json();
    if (!data.length) throw new Error("No conversion found");
    return data[0];
  } catch (error) {
    console.error("Error fetching conversion:", error);
    throw new Error("Conversion not available for this pair");
  }
}

// ---------------- UC-JS-05: Save Calculation Record to History ----------------
export async function saveHistory(record) {
  try {
    const res = await fetch(`${BASE_URL}/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record)
    });
    return await res.json();
  } catch (error) {
    console.error("Error saving history:", error);
    return null;
  }
}

// ---------------- UC-JS-06: Load All History Records ----------------
export async function getHistory() {
  try {
    const res = await fetch(`${BASE_URL}/history?_sort=timestamp&_order=desc`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching history:", error);
    return [];
  }
}

// ---------------- UC-JS-14: Clear History ----------------
export async function clearHistory() {
  try {
    const historyItems = await getHistory();
    const promises = historyItems.map(item =>
      fetch(`${BASE_URL}/history/${item.id}`, { method: "DELETE" })
    );
    await Promise.all(promises);
  } catch (error) {
    console.error("Error clearing history:", error);
  }
}