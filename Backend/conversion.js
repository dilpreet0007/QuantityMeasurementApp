// conversion.js
import { getConversion } from "./api.js";
import { applyConversion } from "./conversionUtils.js";

export async function performConversion(fromVal, fromUnit, toUnit) {
  try {
    const convObj = await getConversion(fromUnit, toUnit);
    return applyConversion(fromVal, convObj);
  } catch (error) {
    console.error(error.message);
    return null;
  }
}
