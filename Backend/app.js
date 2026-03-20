// app.js
import { getUnits } from "./api.js";

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

// --- Load Units (populate your custom dropdowns) ---
async function loadUnits(type) {
  const units = await getUnits(type);
  if (!units || units.length === 0) {
    showErrorBanner("No units available for this type");
    return;
  }

  cachedUnits = units;

  // Find all dropdown lists in your HTML
  const dropdownLists = document.querySelectorAll(".dropdown-list");
  dropdownLists.forEach((list) => {
    list.innerHTML = "";
    units.forEach((unit, index) => {
      const optionDiv = document.createElement("div");
      optionDiv.classList.add("option");
      if (index === 0) optionDiv.classList.add("active");
      optionDiv.textContent = unit.label;
      optionDiv.dataset.value = unit.symbol;

      optionDiv.addEventListener("click", () => {
        // Update state when user selects
        const head = list.parentElement.querySelector(".dropdown-head span");
        if (head) head.textContent = unit.label;
        state.fromUnit = unit.symbol;
      });

      list.appendChild(optionDiv);
    });
  });

  // Default selections
  state.fromUnit = units[0]?.symbol || "";
  state.toUnit = units[1]?.symbol || "";
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

// --- Toggle Operators ---
function toggleOperators(show) {
  const operatorRow = document.querySelector(".operator-row") || document.querySelector("[data-operator-row]");
  if (!operatorRow) return;
  operatorRow.style.display = show ? "flex" : "none";
}

// --- Load History ---
async function loadHistory() {
  try {
    const response = await fetch("http://localhost:3000/history");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const historyPayload = await response.json();
    const items = Array.isArray(historyPayload) ? historyPayload : historyPayload?.history || [];
    cachedHistory = items;

    const historyContainer = document.querySelector("#history");
    if (historyContainer) {
      historyContainer.innerHTML = "";
      items.forEach((entry) => {
        const div = document.createElement("div");
        div.textContent = `${entry.fromVal} ${entry.fromUnit} → ${entry.toVal} ${entry.toUnit}`;
        historyContainer.appendChild(div);
      });
    }
  } catch (error) {
    showErrorBanner("Failed to load history");
  }
}

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
        showErrorBanner("Failed to load units");
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

// --- Initial Active Selections ---
function setInitialActiveSelections() {
  const firstTypeCard = document.querySelector(".card");
  const firstActionButton = document.querySelector(".btn");
  if (firstTypeCard) firstTypeCard.classList.add("active");
  if (firstActionButton) firstActionButton.classList.add("active");
}

// --- Initialise ---
document.addEventListener("DOMContentLoaded", async () => {
  attachEventListeners();

  try {
    await loadUnits("length");
  } catch (error) {
    showErrorBanner("Failed to load units");
  }

  setInitialActiveSelections();
  toggleOperators(false);

  await loadHistory();
});
