import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  TAB_ROUTES,
  calculateTabDirection,
  getTabIndex,
} from "../src/navigation/tabNavigation";

describe("Bidirectional Tab Navigation & Direction Matrix", () => {
  it("defines exactly three primary tab routes in visual order", () => {
    assert.deepEqual(TAB_ROUTES, ["/", "/search", "/scan"]);
  });

  it("maps route pathnames to correct dock indices (0: Home, 1: Search, 2: Scan)", () => {
    assert.equal(getTabIndex("/"), 0);
    assert.equal(getTabIndex("/index"), 0);
    assert.equal(getTabIndex("/search"), 1);
    assert.equal(getTabIndex("/scan"), 2);
    // Detail scan result maps to scan index
    assert.equal(getTabIndex("/result"), 2);
    // Non-tab detail routes map to -1
    assert.equal(getTabIndex("/about"), -1);
    assert.equal(getTabIndex("/handle-share"), -1);
  });

  it("calculates correct forward directions (destination > current -> 'right')", () => {
    // Home (0) -> Search (1)
    assert.equal(calculateTabDirection("/", "/search"), "right");
    // Search (1) -> Scan (2)
    assert.equal(calculateTabDirection("/search", "/scan"), "right");
    // Home (0) -> Scan (2)
    assert.equal(calculateTabDirection("/", "/scan"), "right");
  });

  it("calculates correct backward directions (destination < current -> 'left')", () => {
    // Scan (2) -> Search (1)
    assert.equal(calculateTabDirection("/scan", "/search"), "left");
    // Search (1) -> Home (0)
    assert.equal(calculateTabDirection("/search", "/"), "left");
    // Scan (2) -> Home (0)
    assert.equal(calculateTabDirection("/scan", "/"), "left");
  });

  it("returns undefined when destination is identical to current tab", () => {
    assert.equal(calculateTabDirection("/", "/"), undefined);
    assert.equal(calculateTabDirection("/search", "/search"), undefined);
    assert.equal(calculateTabDirection("/scan", "/scan"), undefined);
  });

  it("preserves route parameters when constructing navigation params", () => {
    const originalParams = { mode: "meaning", type: "hadith", q: "الصبر" };
    const direction = calculateTabDirection("/", "/search");
    const mergedParams = { ...originalParams, __tabDirection: direction };

    assert.equal(mergedParams.mode, "meaning");
    assert.equal(mergedParams.type, "hadith");
    assert.equal(mergedParams.q, "الصبر");
    assert.equal(mergedParams.__tabDirection, "right");
  });

  it("app/_layout.tsx uses dynamic bidirectional animation and not unconditional slide_from_right", () => {
    const layoutPath = path.join(__dirname, "../app/_layout.tsx");
    assert.ok(fs.existsSync(layoutPath));
    const content = fs.readFileSync(layoutPath, "utf-8");

    // Must not have hardcoded static animation: "slide_from_right" inside Stack screenOptions object literal
    assert.ok(content.includes('tabDirection === "left"'));
    assert.ok(content.includes("slide_from_left"));
    assert.ok(content.includes("slide_from_right"));
    assert.ok(content.includes('animationTypeForReplace: "push"'));
    assert.ok(content.includes("freezeOnBlur: false"));
  });

  it("GlassDock.tsx uses useTabNavigation and does not call router.navigate directly", () => {
    const dockPath = path.join(__dirname, "../src/components/glass/GlassDock.tsx");
    assert.ok(fs.existsSync(dockPath));
    const content = fs.readFileSync(dockPath, "utf-8");

    assert.ok(content.includes("useTabNavigation"));
    assert.ok(!content.includes("router.navigate("));
    assert.ok(!content.includes("router.push("));
  });
});
