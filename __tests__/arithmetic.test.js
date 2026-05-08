import { performArithmetic } from "../Backend/arithmeticUtils.js";

describe("Arithmetic Tests", () => {

  test("addition", () => {
    expect(performArithmetic(5, 3, "+")).toBe(8);
  });

  test("subtraction", () => {
    expect(performArithmetic(5, 3, "-")).toBe(2);
  });

  test("multiplication", () => {
    expect(performArithmetic(5, 3, "*")).toBe(15);
  });

  test("division", () => {
    expect(performArithmetic(6, 3, "/")).toBe(2);
  });

});