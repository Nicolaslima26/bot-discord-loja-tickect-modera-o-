import { describe, expect, it } from "vitest";
import { Module, moduleUnavailableMessage } from "../packages/shared/src/index.js";

describe("module contract", () => {
  it("keeps the module catalog explicit and stable", () => {
    expect(Object.values(Module)).toEqual(["STORE", "TICKETS", "MODERATION"]);
    expect(moduleUnavailableMessage).toContain("não está habilitado");
  });
});
