import { getUnits, saveHistory, getHistory, clearHistory as apiClearHistory } from "./api.js";
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

// ✅ GLOBAL RESULT LOCK
let lastResult = "No result yet";

// ---------------- BASE UNITS ----------------
const baseUnits = {
  length: "m",
  weight: "kg",
  temperature: "C",
  volume: "L"
};

// ---------------- UTILITY ----------------
function setActive(parentEl, clickedEl, childSelector) {
  if (!parentEl) return;
  parentEl.querySelectorAll(childSelector).forEach(el => el.classList.remove("active"));
  clickedEl.classList.add("active");
}

function showResult(value, unitSymbol = "") {
  const resultBox = document.querySelector("#comparison-result");
  if (!resultBox) return;

  lastResult = value === null || value === undefined
    ? "—"
    : typeof value === "string"
      ? value
      : `${value} ${unitSymbol}`;

  resultBox.textContent = lastResult;
}

function restoreResult() {
  const resultBox = document.querySelector("#comparison-result");
  if (resultBox) resultBox.textContent = lastResult;
}

function toggleOperators(show) {
  const operatorRow = document.querySelector(".operator-row");
  if (!operatorRow) return;
  operatorRow.style.display = show ? "flex" : "none";
}

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

// ---------------- HISTORY ----------------
function renderHistory(records) {
  const list = document.querySelector("#history-list"); // must match HTML
  if (!list) return;

  list.innerHTML = "";

  if (!records || records.length === 0) {
    list.innerHTML = "<li>No history yet.</li>";
    return;
  }

  records.forEach(r => {
    const li = document.createElement("li");
    li.textContent = `${r.expression}${r.result !== null ? " = " + r.result : ""} (${new Date(r.timestamp).toLocaleString()})`;
    list.appendChild(li);
  });
}

async function loadHistory() {
  const items = await getHistory();
  renderHistory(items);
  restoreResult();
}

async function clearHistory() {
  await apiClearHistory();
  await loadHistory();
}

// ---------------- UNITS ----------------
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

  if (fromSelect) fromSelect.value = state.fromUnit;
  if (toSelect) toSelect.value = state.toUnit;
  if (secondSelect) secondSelect.value = state.secondUnit;

  restoreResult();
}

// ---------------- CALCULATE ----------------
function attachConversionListener() {
  const btn = document.querySelector(".btn-reset");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const fromInput = document.querySelector("#from-value");
    const secondInput = document.querySelector("#second-value");
    const toInput = document.querySelector("#to-value");

    const fromVal = parseFloat(fromInput?.value);
    const secondVal = parseFloat(secondInput?.value);

    if (isNaN(fromVal)) return showErrorBanner("Enter valid value");

    state.fromVal = fromVal;

    if (state.action === "conversion") {
      const result = await performConversion(fromVal, state.fromUnit, state.toUnit);
      if (result == null) return showErrorBanner("Conversion not available");

      if (toInput) toInput.value = result;
      showResult(result, state.toUnit);

      await saveHistory({
        type: state.type,
        action: state.action,
        expression: `${fromVal} ${state.fromUnit} → ${result} ${state.toUnit}`,
        result,
        timestamp: new Date().toISOString()
      });

      await loadHistory();
    }

    if (state.action === "comparison") {
      if (isNaN(secondVal)) return showErrorBanner("Enter second value");

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

      await loadHistory();
    }

    if (state.action === "arithmetic") {
      if (isNaN(secondVal)) return showErrorBanner("Enter second value");

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

        await loadHistory();
      } catch (err) {
        showErrorBanner(err.message);
      }
    }
  });
}

// ---------------- UI ----------------
function toggleUI() {
  toggleOperators(state.action === "arithmetic");

  const secondValEl = document.querySelector(".second-value");
  const toGroupEl = document.querySelector(".to-group");
  if (secondValEl) secondValEl.style.display = state.action !== "conversion" ? "block" : "none";
  if (toGroupEl) toGroupEl.style.display = state.action === "conversion" ? "block" : "none";

  restoreResult();
}

// ---------------- EVENTS ----------------
function attachEventListeners() {
  const typeContainer = document.querySelector(".card-grid");
  const actionContainer = document.querySelector(".tabs");

  if (typeContainer) {
    typeContainer.querySelectorAll(".card").forEach(card => {
      card.addEventListener("click", async () => {
        setActive(typeContainer, card, ".card");
        state.type = card.textContent.trim().toLowerCase();
        await loadUnits(state.type);
      });
    });
  }

  if (actionContainer) {
    actionContainer.querySelectorAll(".btn").forEach(btn => {
      btn.addEventListener("click", () => {
        setActive(actionContainer, btn, ".btn");
        state.action = btn.textContent.toLowerCase().trim();
        toggleUI();
      });
    });
  }

  const fromSelect = document.querySelector("#from-unit");
  const toSelect = document.querySelector("#to-unit");
  const secondSelect = document.querySelector("#second-unit");
  const operatorDropdown = document.querySelector(".operator-dropdown");
  const clearBtn = document.querySelector("#clear-history");

  if (fromSelect) fromSelect.addEventListener("change", e => state.fromUnit = e.target.value);
  if (toSelect) toSelect.addEventListener("change", e => state.toUnit = e.target.value);
  if (secondSelect) secondSelect.addEventListener("change", e => state.secondUnit = e.target.value);
  if (operatorDropdown) operatorDropdown.addEventListener("change", e => state.operator = e.target.value);
  if (clearBtn) clearBtn.addEventListener("click", clearHistory);

  attachConversionListener();
}

// ---------------- INIT ----------------
document.addEventListener("DOMContentLoaded", async () => {
  attachEventListeners();
  await loadUnits("length");
  toggleUI();
  await loadHistory();
  restoreResult();
});