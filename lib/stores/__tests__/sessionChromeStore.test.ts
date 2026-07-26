import { beforeEach, describe, expect, it } from "vitest";
import {
  selectHideMobileNav,
  useSessionChromeStore,
} from "../sessionChromeStore";

describe("sessionChromeStore", () => {
  beforeEach(() => {
    useSessionChromeStore.setState({ depth: 0 });
  });

  it("hides mobile nav when depth is positive", () => {
    expect(selectHideMobileNav(useSessionChromeStore.getState())).toBe(false);
    useSessionChromeStore.getState().enterSession();
    expect(selectHideMobileNav(useSessionChromeStore.getState())).toBe(true);
  });

  it("supports nested enter/exit without going negative", () => {
    const { enterSession, exitSession } = useSessionChromeStore.getState();
    enterSession();
    enterSession();
    exitSession();
    expect(useSessionChromeStore.getState().depth).toBe(1);
    expect(selectHideMobileNav(useSessionChromeStore.getState())).toBe(true);
    exitSession();
    expect(useSessionChromeStore.getState().depth).toBe(0);
    exitSession();
    expect(useSessionChromeStore.getState().depth).toBe(0);
  });
});
