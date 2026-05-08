// UC-JS-09: Perform Arithmetic Between Two Measurements
export function performArithmetic(v1, v2normalised, op) {
  if (isNaN(v1) || isNaN(v2normalised)) {
    throw new Error("Invalid values — cannot perform arithmetic");
  }

  switch (op) {
    case "+":
      return parseFloat((v1 + v2normalised).toFixed(6));
    case "-":
      return parseFloat((v1 - v2normalised).toFixed(6));
    case "*":
      return parseFloat((v1 * v2normalised).toFixed(6));
    case "/":
      if (v2normalised === 0) {
        throw new Error("Cannot divide by zero");
      }
      return parseFloat((v1 / v2normalised).toFixed(6));
    default:
      throw new Error("Unknown operator");
  }
}
