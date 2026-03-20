import { getUnits, saveHistory, getHistory } from "./api.js";
import { performConversion } from "./conversion.js";
import { compareValues } from "./comparisonUtils.js";
import { performArithmetic } from "./arithmeticUtils.js";

// --- Global State ---
const state = {
  type: "length",
  action: "conversion",
  fromVal: null,
  fromUnit: "",
  toVal: null,
  toUnit: "",
  secondUnit: "",   // ✅ FIX
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

  if (!historyContainer) return;

  historyContainer.innerHTML = "";

  if (items.length === 0) {
    historyContainer.textContent = "No history yet.";
    return;
  }

  items.forEach((entry) => {
    const div = document.createElement("div");
    div.textContent = `${entry.expression} ${
      entry.result !== null ? "= " + entry.result : ""
    }`;
    historyContainer.appendChild(div);
  });
}

// --- Conversion / Comparison / Arithmetic ---
function attachConversionListener() {
  const convertBtn = document.querySelector(".btn-reset");

  if (!convertBtn) return;

  convertBtn.textContent = "Calculate";

  convertBtn.addEventListener("click", async () => {
    const fromVal = parseFloat(document.querySelector("#from-value").value);
    state.fromVal = fromVal;

    // ---------------- CONVERSION ----------------
    if (state.action === "conversion") {
      const result = await performConversion(
        fromVal,
        state.fromUnit,
        state.toUnit
      );

      if (result !== null) {
        state.toVal = result;
        document.querySelector("#to-value").value = result;

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

    // ---------------- COMPARISON ----------------
    if (state.action === "comparison") {
      const secondVal = parseFloat(prompt("Enter second value:"));
      const secondUnit = prompt("Enter second unit (symbol like cm, m):");

      if (isNaN(secondVal) || !secondUnit) {
        showErrorBanner("Invalid comparison input");
        return;
      }

      const baseUnit = baseUnits[state.type];

      const base1 = await performConversion(
        fromVal,
        state.fromUnit,
        baseUnit
      );
      const base2 = await performConversion(
        secondVal,
        secondUnit,
        baseUnit
      );

      const sentence = compareValues(
        fromVal,
        state.fromUnit,
        secondVal,
        secondUnit,
        base1,
        base2
      );

      document.querySelector("#comparison-result").textContent = sentence;

      await saveHistory({
        type: state.type,
        action: state.action,
        expression: sentence,
        result: null,
        timestamp: new Date().toISOString()
      });

      await loadHistory();
    }

    // ---------------- ARITHMETIC ----------------
    if (state.action === "arithmetic") {
      const secondVal = parseFloat(
        document.querySelector("#second-value").value
      );

      const secondUnit = state.secondUnit; // ✅ FIX

      if (isNaN(secondVal) || !secondUnit) {
        showErrorBanner("Please enter valid second value and unit");
        return;
      }

      try {
        // normalize second value into FROM unit
        const v2 = await performConversion(
          secondVal,
          secondUnit,
          state.fromUnit
        );

        if (v2 === null) {
          throw new Error("Conversion failed");
        }

        const result = performArithmetic(
          state.fromVal,
          v2,
          state.operator
        );

        document.querySelector(
          "#comparison-result"
        ).textContent = `Result: ${result} ${state.fromUnit}`;

        await saveHistory({
          type: state.type,
          action: state.action,
          expression: `${state.fromVal} ${state.fromUnit} ${state.operator} ${secondVal} ${secondUnit}`,
          result,
          timestamp: new Date().toISOString()
        });

        await loadHistory();
      } catch (err) {
        document.querySelector("#comparison-result").textContent =
          err.message;
      }
    }
  });
}

// --- Load Units ---
async function loadUnits(type) {
  const units = await getUnits(type);

  if (!units.length) {
    showErrorBanner("No units found");
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
        const head = list.parentElement.querySelector(
          ".dropdown-head span"
        );
        if (head) head.textContent = unit.label;

        if (idx === 0) {
          state.fromUnit = unit.symbol;
        } else if (list.closest(".second-value")) {
          state.secondUnit = unit.symbol; // ✅ FIX
        } else {
          state.toUnit = unit.symbol;
        }
      });

      list.appendChild(optionDiv);
    });
  });

  // defaults
  state.fromUnit = units[0].symbol;
  state.toUnit = units[1]?.symbol || units[0].symbol;
  state.secondUnit = units[0].symbol; // ✅ FIX
}

// --- Error Banner ---
function showErrorBanner(msg) {
  let banner = document.getElementById("error-banner");

  if (!banner) {
    banner = document.createElement("div");
    banner.id = "error-banner";
    banner.style.background = "#fee2e2";
    banner.style.color = "#991b1b";
    banner.style.padding = "10px";
    banner.style.margin = "10px 0";
    document.body.prepend(banner);
  }

  banner.textContent = msg;
}

// --- Toggle UI ---
function toggleOperators(show) {
  document.querySelector(".operator-row").style.display = show
    ? "flex"
    : "none";
  document.querySelector(".to-group").style.display = show
    ? "none"
    : "block";
  document.querySelector(".second-value").style.display = show
    ? "block"
    : "none";
}

// --- Event Listeners ---
function attachEventListeners() {
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", async () => {
      document
        .querySelectorAll(".card")
        .forEach((c) => c.classList.remove("active"));

      card.classList.add("active");

      const type = card.textContent.trim().toLowerCase();
      state.type = type;

      await loadUnits(type);
    });
  });

  document.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".btn")
        .forEach((b) => b.classList.remove("active"));

      btn.classList.add("active");

      state.action = btn.textContent.toLowerCase().trim();
      toggleOperators(state.action === "arithmetic");
    });
  });

  document
    .querySelector(".operator-dropdown")
    ?.addEventListener("change", (e) => {
      state.operator = e.target.value;
    });

  attachConversionListener();
}

// --- Init ---
document.addEventListener("DOMContentLoaded", async () => {
  attachEventListeners();
  await loadUnits("length");
  toggleOperators(false);
  await loadHistory();
});