import { getUnits, saveHistory, getHistory } from "./api.js";
import { performConversion } from "./conversion.js";
import { compareValues } from "./comparisonUtils.js";

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

// --- Base Units Map ---
const baseUnits = {
  length: "m",
  weight: "kg",
  temperature: "C",
  volume: "L"
};

// --- Load History ---
async function loadHistory() {
  const items = await getHistory();
  const historyContainer = document.querySelector("#history");
  if (historyContainer) {
    historyContainer.innerHTML = "";
    if (items.length === 0) {
      historyContainer.textContent = "No history yet.";
      return;
    }
    items.forEach((entry) => {
      const div = document.createElement("div");
      div.textContent = `${entry.expression} ${entry.result !== null ? "= " + entry.result : ""}`;
      historyContainer.appendChild(div);
    });
  }
}

// --- Conversion / Comparison / Arithmetic Trigger ---
function attachConversionListener() {
  const convertBtn = document.querySelector(".btn-reset");
  if (convertBtn) {
    convertBtn.textContent = "Convert";
    convertBtn.addEventListener("click", async () => {
      const fromVal = parseFloat(document.querySelector("input[type='number']").value);
      state.fromVal = fromVal;

      if (state.action === "conversion") {
        const result = await performConversion(fromVal, state.fromUnit, state.toUnit);
        if (result !== null) {
          state.toVal = result;
          document.querySelector("input[readonly]").value = result;

          const record = {
            type: state.type,
            action: state.action,
            expression: `${fromVal} ${state.fromUnit} → ${result} ${state.toUnit}`,
            result,
            timestamp: new Date().toISOString()
          };

          await saveHistory(record);
          await loadHistory();
        } else {
          showErrorBanner("Conversion not available for this pair");
        }
      }

      if (state.action === "comparison") {
        const secondVal = parseFloat(prompt("Enter second value to compare:"));
        const secondUnit = prompt("Enter second unit symbol:");

        const baseUnit = baseUnits[state.type];
        const base1 = await performConversion(fromVal, state.fromUnit, baseUnit);
        const base2 = await performConversion(secondVal, secondUnit, baseUnit);

        const comparisonSentence = compareValues(fromVal, state.fromUnit, secondVal, secondUnit, base1, base2);

        // ✅ Show result in UI and keep it persistent
        const compDiv = document.querySelector("#comparison-result");
        if (compDiv) {
          compDiv.textContent = comparisonSentence;
        }

        const record = {
          type: state.type,
          action: state.action,
          expression: comparisonSentence,
          result: null,
          timestamp: new Date().toISOString()
        };
        await saveHistory(record);

        // Only reload history list, not comparison result
        await loadHistory();
      }

      if (state.action === "arithmetic") {
        const secondVal = parseFloat(prompt("Enter second value:"));
        const secondUnit = prompt("Enter second unit symbol:");

        const baseUnit = baseUnits[state.type];
        const base1 = await performConversion(fromVal, state.fromUnit, baseUnit);
        const base2 = await performConversion(secondVal, secondUnit, baseUnit);

        let result;
        switch (state.operator) {
          case "+": result = base1 + base2; break;
          case "-": result = base1 - base2; break;
          case "*": result = base1 * base2; break;
          case "/": result = base2 !== 0 ? base1 / base2 : "Division by zero"; break;
        }

        // ✅ Show arithmetic result in UI
        const compDiv = document.querySelector("#comparison-result");
        if (compDiv) {
          compDiv.textContent = `Result: ${result} ${baseUnit}`;
        }

        const record = {
          type: state.type,
          action: state.action,
          expression: `${fromVal} ${state.fromUnit} ${state.operator} ${secondVal} ${secondUnit}`,
          result,
          timestamp: new Date().toISOString()
        };
        await saveHistory(record);

        // Only reload history list
        await loadHistory();
      }
    });
  }
}

// --- Load Units ---
async function loadUnits(type) {
  const units = await getUnits(type);
  if (!units || units.length === 0) {
    showErrorBanner("No units available for this type");
    return;
  }

  cachedUnits = units;
  const dropdownLists = document.querySelectorAll(".dropdown-list");
  dropdownLists.forEach((list, idx) => {
    list.innerHTML = "";
    units.forEach((unit, index) => {
      const optionDiv = document.createElement("div");
      optionDiv.classList.add("option");
      if (index === 0) optionDiv.classList.add("active");
      optionDiv.textContent = unit.label;
      optionDiv.dataset.value = unit.symbol;

      optionDiv.addEventListener("click", () => {
        const head = list.parentElement.querySelector(".dropdown-head span");
        if (head) head.textContent = unit.label;
        if (idx === 0) state.fromUnit = unit.symbol;
        else state.toUnit = unit.symbol;
      });

      list.appendChild(optionDiv);
    });
  });

  state.fromUnit = units[0]?.symbol || "";
  state.toUnit = units[1]?.symbol || units[0]?.symbol || "";
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
      } catch {
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

  attachConversionListener();
}

// --- Initialise ---
document.addEventListener("DOMContentLoaded", async () => {
  attachEventListeners();
  try {
    await loadUnits("length");
  } catch {
    showErrorBanner("Failed to load units");
  }
  toggleOperators(false);
  await loadHistory();
});
