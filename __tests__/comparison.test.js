import { compareValues } from "../Backend/comparisonUtils.js";

describe("Comparison Tests", () => {

  test("greater than", () => {
    const result = compareValues(10, "m", 5, "m", 10, 5);
    expect(result).toContain("GREATER");
  });

  test("less than", () => {
    const result = compareValues(5, "m", 10, "m", 5, 10);
    expect(result).toContain("LESS");
  });

  test("equal", () => {
    const result = compareValues(10, "m", 1000, "cm", 10, 10);
    expect(result).toContain("EQUAL");
  });

});