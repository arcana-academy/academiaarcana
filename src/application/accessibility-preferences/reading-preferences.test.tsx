// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_READING_PREFERENCES,
  useReadingPreferences,
} from "./reading-preferences";

describe("device-local reading preferences", () => {
  beforeEach(() => window.localStorage.clear());

  it("starts with safe defaults and persists updates on the device", () => {
    const { result, unmount } = renderHook(() => useReadingPreferences());
    expect(result.current.preferences).toEqual(DEFAULT_READING_PREFERENCES);
    act(() => result.current.update({ size: "large", font: "literata", spacing: true }));
    expect(result.current.preferences).toMatchObject({
      size: "large",
      font: "literata",
      spacing: true,
    });
    unmount();

    const followUp = renderHook(() => useReadingPreferences());
    expect(followUp.result.current.preferences.size).toBe("large");
    expect(followUp.result.current.preferences.font).toBe("literata");
    followUp.unmount();
  });

  it("ignores corrupted storage values rather than enabling unknown settings", () => {
    window.localStorage.setItem("academia-arcana:reading-preferences", '{"size":"huge"}');
    const { result } = renderHook(() => useReadingPreferences());
    expect(result.current.preferences).toEqual(DEFAULT_READING_PREFERENCES);
  });

  it("updates after a storage event from another tab", () => {
    const { result } = renderHook(() => useReadingPreferences());
    act(() => {
      window.localStorage.setItem("academia-arcana:reading-preferences", JSON.stringify({
        size: "large",
        contrast: true,
        spacing: true,
        focus: false,
        font: "default",
      }));
      window.dispatchEvent(new StorageEvent("storage", {
        key: "academia-arcana:reading-preferences",
      }));
    });
    expect(result.current.preferences.contrast).toBe(true);
    expect(result.current.preferences.size).toBe("large");
  });
});
