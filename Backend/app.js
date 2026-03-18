// --- Global State ---
const state = {
  type: "length",
  action: "conversion",
  fromVal: null,
  fromUnit: "",
  toVal: null,
  toUnit: "",
  operator: "+"
};

let cachedUnits = [];
let cachedHistory = [];

// Base URL for json-server
const API_BASE_URL = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", async () => {
  // --- Event Listeners ---
  function attachEventListeners() {
    const cards = document.querySelectorAll(".card");
    cards.forEach((card) => {
      card.addEventListener("click", async () => {
        cards.forEach((item) => item.classList.remove("active"));
        card.classList.add("active");

        const selectedType = card.querySelector("span")?.textContent?.trim().toLowerCase();
        if (!selectedType) return;

        state.type = selectedType;
        try {
          await loadUnits(state.type);
        } catch (error) {
          if (error instanceof TypeError) {
            showErrorBanner("Server unavailable");
          } else {
            showErrorBanner("Failed to load units");
          }
        }
      });
    });

    const actionButtons = document.querySelectorAll(".btn");
    actionButtons.forEach((button) => {
      button.addEventListener("click", () => {
        actionButtons.forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        state.action = (button.textContent || "conversion").trim().toLowerCase();
        toggleOperators(state.action === "arithmetic");
      });
    });

    const operatorDropdown = document.querySelector(".operator-dropdown");
    if (operatorDropdown) {
      operatorDropdown.addEventListener("change", (event) => {
        state.operator = event.target.value;
      });
    }
  }

  // --- Load Units ---
  async function loadUnits(type) {
    const response = await fetch(`${API_BASE_URL}/units`);
    if (!response.ok && response.status !== 304) {
      throw new Error("Failed to load units");
    }

    let unitsPayload;
    try {
      unitsPayload = await response.json();
    } catch (_) {
      unitsPayload = cachedUnits;
    }

    const allUnits = Array.isArray(unitsPayload) ? unitsPayload : unitsPayload?.units;
    if (!Array.isArray(allUnits)) {
      throw new Error("Invalid units response");
    }

    cachedUnits = allUnits;

    const matchingUnits = allUnits.filter((unit) => String(unit.type).toLowerCase() === type.toLowerCase());
    const unitDropdowns = document.querySelectorAll(".unit-dropdown");

    unitDropdowns.forEach((dropdown) => {
      dropdown.innerHTML = "";
      matchingUnits.forEach((unit) => {
        const option = document.createElement("option");
        option.value = unit.symbol;
        option.textContent = unit.label;
        dropdown.appendChild(option);
      });
    });

    state.fromUnit = unitDropdowns[0]?.value || "";
    state.toUnit = unitDropdowns[1]?.value || "";
  }

  // --- Initial Active Selections ---
  function setInitialActiveSelections() {
    const firstTypeCard = document.querySelector(".card");
    const firstActionButton = document.querySelector(".btn");
    if (firstTypeCard) firstTypeCard.classList.add("active");
    if (firstActionButton) firstActionButton.classList.add("active");
  }

  // --- Toggle Operators ---
  function toggleOperators(show) {
    const operatorRow = document.querySelector(".operator-row") || document.querySelector("[data-operator-row]");
    if (!operatorRow) return;
    operatorRow.style.display = show ? "flex" : "none";
  }

  // --- Load History ---
  async function loadHistory() {
    const response = await fetch(`${API_BASE_URL}/history`);
    if (!response.ok && response.status !== 304) {
      throw new Error("Failed to load history");
    }

    let historyPayload;
    try {
      historyPayload = await response.json();
    } catch (_) {
      historyPayload = cachedHistory;
    }

    const items = Array.isArray(historyPayload) ? historyPayload : historyPayload?.history || [];
    cachedHistory = items;

    // Example: render history list
    const historyContainer = document.querySelector("#history");
    if (historyContainer) {
      historyContainer.innerHTML = "";
      items.forEach((entry) => {
        const div = document.createElement("div");
        div.textContent = `${entry.fromVal} ${entry.fromUnit} → ${entry.toVal} ${entry.toUnit}`;
        historyContainer.appendChild(div);
      });
    }
  }

  // --- Error Banner ---
  function showErrorBanner(message) {
    let banner = document.getElementById("error-banner");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "error-banner";
      banner.style.background = "#fee2e2";
      banner.style.color = "#991b1b";
      banner.style.padding = "10px 12px";
      banner.style.margin = "10px 0";
      banner.style.border = "1px solid #fca5a5";
      banner.style.borderRadius = "6px";
      document.body.prepend(banner);
    }
    banner.textContent = message;
  }

  // --- Initialise ---
  attachEventListeners();

  try {
    await loadUnits("length");
  } catch (error) {
    if (error instanceof TypeError) {
      showErrorBanner("Server unavailable");
    } else {
      showErrorBanner("Failed to load units");
    }
  }

  setInitialActiveSelections();
  toggleOperators(false);

  try {
    await loadHistory();
  } catch (error) {
    if (error instanceof TypeError) {
      showErrorBanner("Server unavailable");
    } else {
      showErrorBanner("Failed to load history");
    }
  }
});
