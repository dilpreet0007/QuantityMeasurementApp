import { getUnits, saveHistory, getHistory } from "./api.js";
import { performConversion } from "./conversion.js";
import { compareValues } from "./comparisonUtils.js";
import { performArithmetic } from "./arithmeticUtils.js";

// --- STATE ---
const state = {
  type: "length",
  action: "conversion",
  fromVal: null,
  fromUnit: "",
  toUnit: "",
  secondUnit: "",
  operator: "+"
};

const baseUnits = {
  length: "m",
  weight: "kg",
  temperature: "C",
  volume: "L"
};

// =====================================================
// ✅ UC-JS-11: SET ACTIVE FUNCTION
// =====================================================
function setActive(parentEl, clickedEl, childSelector) {
  if (!parentEl) return;

  parentEl.querySelectorAll(childSelector).forEach((el) =>
    el.classList.remove("active")
  );

  clickedEl.classList.add("active");
}

// =====================================================
// HISTORY
// =====================================================
async function loadHistory() {
  const items = await getHistory();
  const container = document.querySelector("#history");

  if (!container) return;

  container.innerHTML = "";

  if (!items.length) {
    container.textContent = "No history yet.";
    return;
  }

  items.forEach((e) => {
    const div = document.createElement("div");
    div.textContent = `${e.expression} ${
      e.result !== null ? "= " + e.result : ""
    }`;
    container.appendChild(div);
  });
}

// =====================================================
// LOAD UNITS INTO <select>
// =====================================================
async function loadUnits(type) {
  let units = await getUnits(type);

  // safety filter
  units = units.filter((u) => u.type === type);

  if (!units.length) {
    showErrorBanner("No units found");
    return;
  }

  const fromSelect = document.querySelector("#from-unit");
  const toSelect = document.querySelector("#to-unit");
  const secondSelect = document.querySelector("#second-unit");

  // clear old
  fromSelect.innerHTML = "";
  toSelect.innerHTML = "";
  secondSelect.innerHTML = "";

  units.forEach((unit) => {
    const option1 = new Option(
      `${unit.label} (${unit.symbol})`,
      unit.symbol
    );
    const option2 = option1.cloneNode(true);
    const option3 = option1.cloneNode(true);

    fromSelect.appendChild(option1);
    toSelect.appendChild(option2);
    secondSelect.appendChild(option3);
  });

  // defaults
  state.fromUnit = units[0].symbol;
  state.toUnit = units[1]?.symbol || units[0].symbol;
  state.secondUnit = units[0].symbol;

  fromSelect.value = state.fromUnit;
  toSelect.value = state.toUnit;
  secondSelect.value = state.secondUnit;
}

// =====================================================
// CALCULATE
// =====================================================
function attachConversionListener() {
  const btn = document.querySelector(".btn-reset");

  btn.addEventListener("click", async () => {
    const fromVal = parseFloat(document.querySelector("#from-value").value);
    const secondVal = parseFloat(
      document.querySelector("#second-value").value
    );

    if (isNaN(fromVal)) {
      showErrorBanner("Enter valid value");
      return;
    }

    state.fromVal = fromVal;

    // ---------- CONVERSION ----------
    if (state.action === "conversion") {
      const result = await performConversion(
        fromVal,
        state.fromUnit,
        state.toUnit
      );

      if (result == null) {
        showErrorBanner("Conversion not available");
        return;
      }

      document.querySelector("#to-value").value = result;

      await saveHistory({
        type: state.type,
        action: state.action,
        expression: `${fromVal} ${state.fromUnit} → ${result} ${state.toUnit}`,
        result,
        timestamp: new Date().toISOString()
      });

      loadHistory();
    }

    // ---------- COMPARISON ----------
    if (state.action === "comparison") {
      if (isNaN(secondVal)) {
        showErrorBanner("Enter second value");
        return;
      }

      const base = baseUnits[state.type];

      const v1 = await performConversion(fromVal, state.fromUnit, base);
      const v2 = await performConversion(
        secondVal,
        state.secondUnit,
        base
      );

      const result = compareValues(
        fromVal,
        state.fromUnit,
        secondVal,
        state.secondUnit,
        v1,
        v2
      );

      document.querySelector("#comparison-result").textContent = result;

      await saveHistory({
        type: state.type,
        action: state.action,
        expression: result,
        result: null,
        timestamp: new Date().toISOString()
      });

      loadHistory();
    }

    // ---------- ARITHMETIC ----------
    if (state.action === "arithmetic") {
      if (isNaN(secondVal)) {
        showErrorBanner("Enter second value");
        return;
      }

      try {
        const v2 = await performConversion(
          secondVal,
          state.secondUnit,
          state.fromUnit
        );

        const result = performArithmetic(
          fromVal,
          v2,
          state.operator
        );

        document.querySelector(
          "#comparison-result"
        ).textContent = `${result} ${state.fromUnit}`;

        await saveHistory({
          type: state.type,
          action: state.action,
          expression: `${fromVal} ${state.fromUnit} ${state.operator} ${secondVal} ${state.secondUnit}`,
          result,
          timestamp: new Date().toISOString()
        });

        loadHistory();
      } catch (err) {
        showErrorBanner(err.message);
      }
    }
  });
}

// =====================================================
// ERROR
// =====================================================
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

// =====================================================
// UI TOGGLE
// =====================================================
function toggleUI() {
  document.querySelector(".operator-row").style.display =
    state.action === "arithmetic" ? "block" : "none";

  document.querySelector(".second-value").style.display =
    state.action !== "conversion" ? "block" : "none";

  document.querySelector(".to-group").style.display =
    state.action === "conversion" ? "block" : "none";
}

// =====================================================
// EVENTS
// =====================================================
function attachEventListeners() {
  const cardContainer = document.querySelector(".card-grid");
  const tabContainer = document.querySelector(".tabs");

  // TYPE CARDS
  cardContainer.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", async () => {
      setActive(cardContainer, card, ".card");

      state.type = card.textContent.trim().toLowerCase();
      await loadUnits(state.type);
    });
  });

  // ACTION TABS
  tabContainer.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      setActive(tabContainer, btn, ".btn");

      state.action = btn.textContent.toLowerCase().trim();
      toggleUI();
    });
  });

  // SELECT EVENTS
  document.querySelector("#from-unit").addEventListener("change", (e) => {
    state.fromUnit = e.target.value;
  });

  document.querySelector("#to-unit").addEventListener("change", (e) => {
    state.toUnit = e.target.value;
  });

  document.querySelector("#second-unit").addEventListener("change", (e) => {
    state.secondUnit = e.target.value;
  });

  document
    .querySelector(".operator-dropdown")
    .addEventListener("change", (e) => {
      state.operator = e.target.value;
    });

  attachConversionListener();
}

// =====================================================
// INIT
// =====================================================
document.addEventListener("DOMContentLoaded", async () => {
  attachEventListeners();
  await loadUnits("length");
  toggleUI();
  loadHistory();
});