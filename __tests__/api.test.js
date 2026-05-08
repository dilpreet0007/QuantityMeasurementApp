import { jest, describe, test, afterEach, expect } from "@jest/globals";
import { getUnits, getConversion } from "../Backend/api.js";

global.fetch = jest.fn();

describe("API Tests", () => {

  afterEach(() => {
    fetch.mockClear();
  });

  test("getUnits returns data", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => [{ type: "length", symbol: "m" }]
    });

    const data = await getUnits("length");

    expect(data.length).toBe(1);
    expect(data[0].symbol).toBe("m");
  });

  test("getConversion returns factor", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => [{ from: "m", to: "cm", factor: 100 }]
    });

    const data = await getConversion("m", "cm");

    expect(data.factor).toBe(100);
  });

  test("getConversion throws error if not found", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => []
    });

    await expect(getConversion("m", "xyz"))
      .rejects
      .toThrow("Conversion not available");
  });

});