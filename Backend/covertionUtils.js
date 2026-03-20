// conversionUtils.js

export function applyConversion(value, convObj) {
  // Preconditions
  if (isNaN(value) || !isFinite(value)) {
    throw new Error("Invalid number");
  }

  // Alternate Flow: same unit
  if (convObj.from === convObj.to) {
    return value;
  }

  try {
    if (convObj.factor !== null && convObj.factor !== undefined) {
      // Factor path
      return parseFloat((value * convObj.factor).toFixed(6));
    } else if (convObj.formula) {
      // Formula path
      const expr = convObj.formula.replace(/x/g, value);
      return parseFloat(eval(expr).toFixed(6));
    } else {
      throw new Error("No factor or formula provided");
    }
  } catch (error) {
    throw new Error("Bad formula");
  }
}
