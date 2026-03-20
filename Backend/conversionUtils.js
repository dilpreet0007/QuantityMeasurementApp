export function applyConversion(value, convObj) {
  if (isNaN(value) || !isFinite(value)) {
    throw new Error("Invalid number");
  }

  if (convObj.from === convObj.to) {
    return value;
  }

  try {
    if (convObj.factor !== null && convObj.factor !== undefined) {
      return parseFloat((value * convObj.factor).toFixed(6));
    } else if (convObj.formula) {
      // Safer than eval: build a function that takes x
      const fn = new Function("x", `return ${convObj.formula}`);
      return parseFloat(fn(value).toFixed(6));
    } else {
      throw new Error("No factor or formula provided");
    }
  } catch {
    throw new Error("Bad formula");
  }
}
