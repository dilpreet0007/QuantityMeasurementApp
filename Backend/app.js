import { getUnits, saveHistory, getHistory } from "./api.js";
import { performConversion } from "./conversion.js";
import { compareValues } from "./comparisonUtils.js";
import { performArithmetic } from "./arithmeticUtils.js";

// ---------------- STATE ----------------
const state = {
  type: "length",
  action: "conversion",
  fromVal: null,
  fromUnit: "",
  toUnit: "",
  secondUnit: "",
  operator: "+"
};

// ✅ GLOBAL RESULT LOCK (MAIN FIX)
let lastResult = "No result yet";

// ---------------- BASE UNITS ----------------
const baseUnits = {
  length: "m",
  weight: "kg",
  temperature: "C",
  volume: "L"
};

// ---------------- UC-JS-11 ----------------
function setActive(parentEl, clickedEl, childSelector) {
  if (!parentEl) return;
  parentEl.querySelectorAll(childSelector).forEach(el => el.classList.remove("active"));
  clickedEl.classList.add("active");
}

// ---------------- UC-JS-12 ----------------
function showResult(value, unitSymbol = "") {
  const resultBox = document.querySelector("#comparison-result");
  if (!resultBox) return;

  if (value === null || value === undefined) {
    lastResult = "—";
  } else if (typeof value === "string") {
    lastResult = value;
  } else {
    lastResult = `${value} ${unitSymbol}`;
  }

  resultBox.textContent = lastResult;
}

// ✅ RESTORE RESULT EVERY TIME UI UPDATES
function restoreResult() {
  const resultBox = document.querySelector("#comparison-result");
  if (resultBox) resultBox.textContent = lastResult;
}

// ---------------- UC-JS-13 ----------------
function toggleOperators(show) {
  const operatorRow = document.querySelector(".operator-row");
  if (!operatorRow) {
    console.warn("Operator row element not found");
    return;
  }
  operatorRow.style.display = show ? "flex" : "none";
}

// ---------------- HISTORY ----------------
async function loadHistory() {
  const items = await getHistory();
  const container = document.querySelector("#history");

  if (!container) return;

  container.innerHTML = "";

  if (!items.length) {
    container.textContent = "No history yet.";
  } else {
    items.forEach(e => {
      const div = document.createElement("div");
      div.textContent = `${e.expression} ${e.result !== null ? "= " + e.result : ""}`;
      container.appendChild(div);
    });
  }

  restoreResult(); // ✅ FIX
}

// ---------------- LOAD UNITS ----------------
async function loadUnits(type) {
  let units = await getUnits(type);
  units = units.filter(u => u.type === type);

  if (!units.length) {
    showErrorBanner("No units found");
    return;
  }

  const fromSelect = document.querySelector("#from-unit");
  const toSelect = document.querySelector("#to-unit");
  const secondSelect = document.querySelector("#second-unit");

  [fromSelect, toSelect, secondSelect].forEach(select => {
    if (!select) return;
    select.innerHTML = "";
    units.forEach(unit => {
      const option = document.createElement("option");
      option.value = unit.symbol;
      option.textContent = `${unit.label} (${unit.symbol})`;
      select.appendChild(option);
    });
  });

  state.fromUnit = units[0].symbol;
  state.toUnit = units[1]?.symbol || units[0].symbol;
  state.secondUnit = units[0].symbol;

  fromSelect.value = state.fromUnit;
  toSelect.value = state.toUnit;
  if (secondSelect) secondSelect.value = state.secondUnit;

  restoreResult(); // ✅ FIX
}

// ---------------- CALCULATE ----------------
function attachConversionListener() {
  const btn = document.querySelector(".btn-reset");

  btn.addEventListener("click", async () => {
    const fromVal = parseFloat(document.querySelector("#from-value").value);
    const secondVal = parseFloat(document.querySelector("#second-value")?.value);

    if (isNaN(fromVal)) {
      showErrorBanner("Enter valid value");
      return;
    }

    state.fromVal = fromVal;

    // ---------- CONVERSION ----------
    if (state.action === "conversion") {
      const result = await performConversion(fromVal, state.fromUnit, state.toUnit);

      if (result == null) {
        showErrorBanner("Conversion not available");
        return;
      }

      document.querySelector("#to-value").value = result;
      showResult(result, state.toUnit);

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
      const v2 = await performConversion(secondVal, state.secondUnit, base);

      const result = compareValues(fromVal, state.fromUnit, secondVal, state.secondUnit, v1, v2);

      showResult(result);

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
        const v2 = await performConversion(secondVal, state.secondUnit, state.fromUnit);

        const result = performArithmetic(fromVal, v2, state.operator);

        showResult(result, state.fromUnit);

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

// ---------------- ERROR ----------------
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

// ---------------- UI TOGGLE ----------------
function toggleUI() {
  toggleOperators(state.action === "arithmetic"); // ✅ UC-JS-13

  document.querySelector(".second-value").style.display =
    state.action !== "conversion" ? "block" : "none";

  document.querySelector(".to-group").style.display =
    state.action === "conversion" ? "block" : "none";

  restoreResult(); // ✅ FIX
}

// ---------------- EVENTS ----------------
function attachEventListeners() {
  const typeContainer = document.querySelector(".card-grid");
  const actionContainer = document.querySelector(".tabs");

  // TYPE
  typeContainer.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", async () => {
      setActive(typeContainer, card, ".card");

      state.type = card.textContent.trim().toLowerCase();
      await loadUnits(state.type);
    });
  });

  // ACTION
  actionContainer.querySelectorAll(".btn").forEach(btn => {
    btn.addEventListener("click", () => {
      setActive(actionContainer, btn, ".btn");

      state.action = btn.textContent.toLowerCase().trim();
      toggleUI();
    });
  });

  // SELECTS
  document.querySelector("#from-unit").addEventListener("change", e => {
    state.fromUnit = e.target.value;
  });

  document.querySelector("#to-unit").addEventListener("change", e => {
    state.toUnit = e.target.value;
  });

  document.querySelector("#second-unit").addEventListener("change", e => {
    state.secondUnit = e.target.value;
  });

  // OPERATOR
  document.querySelector(".operator-dropdown")?.addEventListener("change", e => {
    state.operator = e.target.value;
  });

  attachConversionListener();
}

// ---------------- INIT ----------------
document.addEventListener("DOMContentLoaded", async () => {
  attachEventListeners();
  await loadUnits("length");
  toggleUI();
  await loadHistory();

  restoreResult(); // ✅ FINAL SAFETY
});