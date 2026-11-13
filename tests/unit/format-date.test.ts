import assert from "node:assert/strict";
import { test } from "node:test";
import { formatRequestDateTime } from "../../shared/utils/format-date";

test("formats ISO timestamps for Russian interface without exposing raw ISO", () => {
  const formatted = formatRequestDateTime("2026-11-12T10:59:40.175Z");
  assert.match(formatted, /12 ноября/);
  assert.match(formatted, /\d{2}:\d{2}/);
  assert.doesNotMatch(formatted, /T|Z/);
});

test("preserves already human-readable demo times", () => {
  assert.equal(formatRequestDateTime("09:14"), "09:14");
});

test("handles malformed ISO timestamps explicitly", () => {
  assert.equal(
    formatRequestDateTime("2026-99-99T10:00:00Z"),
    "Дата не указана",
  );
});
