import { jest, describe, test, expect } from "@jest/globals";
import { performConversion } from "../Backend/conversion.js";

describe("Conversion Tests", () => {

  test("convert meter to cm", async () => {
    const result = await performConversion(5, "cm", "cm");

    expect(result).toBe(5);
  });

  test("same unit returns same value", async () => {
    const result = await performConversion(10, "m", "m");

    expect(result).toBe(10);
  });

});