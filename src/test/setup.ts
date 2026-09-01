import { afterEach } from "vitest";

Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
  configurable: true,
  value: true,
  writable: true,
});

afterEach(() => {
  // Keep the test environment isolated between cases.
});
