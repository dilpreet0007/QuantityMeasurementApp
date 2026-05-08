// comparisonUtils.js

export function compareValues(v1, u1, v2, u2, base1, base2) {
  // Exception Flow: invalid inputs
  if (isNaN(v1) || isNaN(v2)) {
    return "Invalid values — cannot compare";
  }

  // Alternate Flow: same units (skip normalisation in caller)
  if (u1 === u2) {
    if (v1 > v2) return `${v1} ${u1} is GREATER than ${v2} ${u2}`;
    if (v1 < v2) return `${v1} ${u1} is LESS than ${v2} ${u2}`;
    return `${v1} ${u1} is EQUAL to ${v2} ${u2}`;
  }

  // Main Flow: compare normalised values
  if (base1 > base2) {
    return `${v1} ${u1} is GREATER than ${v2} ${u2}`;
  }
  if (base1 < base2) {
    return `${v1} ${u1} is LESS than ${v2} ${u2}`;
  }
  return `${v1} ${u1} is EQUAL to ${v2} ${u2}`;
}
