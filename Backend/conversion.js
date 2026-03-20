// conversion.js
import { getConversion } from "./api.js";

export async function performConversion(fromVal, fromUnit, toUnit) {
  try {
    const conversion = await getConversion(fromUnit, toUnit);

    let result;
    if (conversion.formula) {
      result = eval(conversion.formula.replace(/x/g, fromVal));
    } else {
      result = fromVal * conversion.factor;
    }

    return result;
  } catch (error) {
    console.error(error.message);
    return null;
  }
}
