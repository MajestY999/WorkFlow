import assert from "node:assert/strict";
import { test } from "node:test";
import { formatRequestDateTime } from "../../shared/utils/format-date";

test("formats ISO timestamps for Russian interface without exposing raw ISO", () => {
  const formatted = formatRequestDateTime("2026-11-12T10:59:40.175Z");
  assert.match(formatted, /12 ноября/);
  assert.match(formatted, /\d{2}:\d{2}/);
  assert.doesNotMatch(formatted, /T|Z/);
});

test("formats ISO timestamps in UTC to keep SSR and browser output identical", () => {
  const previousTimezone = process.env.TZ;
  try {
    process.env.TZ = "America/Los_Angeles";
    assert.equal(
      formatRequestDateTime("2026-11-12T10:59:40.175Z"),
      "12 ноября в 10:59",
    );
  } finally {
    if (previousTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimezone;
  }
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
