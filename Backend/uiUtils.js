// uiUtils.js

// UC-JS-10: Populate Unit Dropdown
export function populateDropdown(selectEl, units) {
  if (!selectEl) {
    console.warn("Select element not found");
    return;
  }

  selectEl.innerHTML = "";

  // Default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "-- Select Unit --";
  defaultOption.disabled = true;
  defaultOption.selected = true;

  selectEl.appendChild(defaultOption);

  if (!units || units.length === 0) return;

  units.forEach((u) => {
    const opt = document.createElement("option");
    opt.value = u.symbol;
    opt.textContent = `${u.label} (${u.symbol})`;
    selectEl.appendChild(opt);
  });
}