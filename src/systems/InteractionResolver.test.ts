import { describe, it, expect } from "vitest";
import { GameState } from "./GameState";
import { resolve } from "./InteractionResolver";

describe("InteractionResolver", () => {
  it("resolves a plain look", () => {
    const state = new GameState();
    const r = resolve("look", "window", state);
    expect(r?.lineId).toBe("lookWindow");
  });

  it("resolves a use that sets a flag", () => {
    const state = new GameState();
    const r = resolve("use", "window", state);
    expect(r?.lineId).toBe("useWindow");
    expect(r?.setFlag).toBe("examined_window");
  });

  it("uses an item override when active", () => {
    const state = new GameState();
    state.addItem("tape_measure");
    state.activeItem = "tape_measure";
    const r = resolve("use", "window", state);
    expect(r?.lineId).toBe("measureWindow");
    expect(r?.setFlag).toBe("measured_window");
  });

  it("falls back when item doesn't fit hotspot", () => {
    const state = new GameState();
    state.addItem("tape_measure");
    state.activeItem = "tape_measure";
    const r = resolve("use", "handyman", state);
    expect(r?.lineId).toBe("useTapeMeasureFail");
  });

  it("picking up tape measure removes hotspot and gives item", () => {
    const state = new GameState();
    const r = resolve("use", "tape_measure", state);
    expect(r?.giveItem).toBe("tape_measure");
    expect(r?.removeHotspot).toBe(true);
  });

  it("solved condition needs both measurements", () => {
    const state = new GameState();
    expect(state.isSolved(["measured_window", "measured_fridge"])).toBe(false);
    state.setFlag("measured_window");
    expect(state.isSolved(["measured_window", "measured_fridge"])).toBe(false);
    state.setFlag("measured_fridge");
    expect(state.isSolved(["measured_window", "measured_fridge"])).toBe(true);
  });
});
