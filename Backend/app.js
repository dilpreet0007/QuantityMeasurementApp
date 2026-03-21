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

// --- HISTORY ---
async function loadHistory() {
  const items = await getHistory();
  const container = document.querySelector("#history");

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

// --- LOAD UNITS (FIXED FOR SELECT) ---
async function loadUnits(type) {
  let units = await getUnits(type);

  units = units.filter(u => u.type === type);

  console.log("Loaded units:", units);

  if (!units.length) return;

  const fromSelect = document.getElementById("from-unit");
  const toSelect = document.getElementById("to-unit");
  const secondSelect = document.getElementById("second-unit");

  fromSelect.innerHTML = "";
  toSelect.innerHTML = "";
  secondSelect.innerHTML = "";

  units.forEach((unit, index) => {
    const option1 = document.createElement("option");
    option1.value = unit.symbol;
    option1.textContent = `${unit.label} (${unit.symbol})`;

    const option2 = option1.cloneNode(true);
    const option3 = option1.cloneNode(true);

    fromSelect.appendChild(option1);
    toSelect.appendChild(option2);
    secondSelect.appendChild(option3);

    if (index === 0) {
      state.fromUnit = unit.symbol;
      state.secondUnit = unit.symbol;
    }
    if (index === 1) {
      state.toUnit = unit.symbol;
    }
  });

  if (!state.toUnit) state.toUnit = state.fromUnit;
}

// --- SELECT LISTENERS ---
function attachSelectListeners() {
  document.getElementById("from-unit").addEventListener("change", (e) => {
    state.fromUnit = e.target.value;
  });

  document.getElementById("to-unit").addEventListener("change", (e) => {
    state.toUnit = e.target.value;
  });

  document.getElementById("second-unit").addEventListener("change", (e) => {
    state.secondUnit = e.target.value;
  });
}

// --- CALCULATE ---
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
      const v2 = await performConversion(secondVal, state.secondUnit, base);

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

        const result = performArithmetic(fromVal, v2, state.operator);

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

// --- ERROR ---
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

// --- UI TOGGLE ---
function toggleUI() {
  document.querySelector(".operator-row").style.display =
    state.action === "arithmetic" ? "block" : "none";

  document.querySelector(".second-value").style.display =
    state.action !== "conversion" ? "block" : "none";

  document.querySelector(".to-group").style.display =
    state.action === "conversion" ? "block" : "none";
}

// --- EVENTS ---
function attachEventListeners() {
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", async () => {
      document.querySelectorAll(".card").forEach((c) =>
        c.classList.remove("active")
      );

      card.classList.add("active");

      state.type = card.textContent.trim().toLowerCase();
      await loadUnits(state.type);
    });
  });

  document.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".btn").forEach((b) =>
        b.classList.remove("active")
      );

      btn.classList.add("active");

      state.action = btn.textContent.toLowerCase().trim();
      toggleUI();
    });
  });

  document
    .querySelector(".operator-dropdown")
    ?.addEventListener("change", (e) => {
      state.operator = e.target.value;
    });

  attachConversionListener();
}

// --- INIT ---
document.addEventListener("DOMContentLoaded", async () => {
  attachEventListeners();
  attachSelectListeners();   // ✅ IMPORTANT
  await loadUnits("length");
  toggleUI();
  loadHistory();
});