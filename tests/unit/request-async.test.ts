import assert from "node:assert/strict";
import { test } from "node:test";
import { createSingleFlight } from "../../app/utils/request-async";

test("coalesces overlapping calls and permits retry after completion", async () => {
  let calls = 0;
  let release: ((value: string) => void) | undefined;
  const submit = createSingleFlight(
    () =>
      new Promise<string>((resolve) => {
        calls += 1;
        release = resolve;
      }),
  );

  const first = submit();
  const second = submit();
  await Promise.resolve();
  assert.equal(calls, 1);
  release?.("saved");
  assert.equal(await first, "saved");
  assert.equal(await second, "saved");
  const retry = submit();
  await Promise.resolve();
  release?.("saved");
  assert.equal(await retry, "saved");
  assert.equal(calls, 2);
});

test("releases the single-flight lock when a request fails", async () => {
  let calls = 0;
  const submit = createSingleFlight(async () => {
    calls += 1;
    if (calls === 1) throw new Error("temporary failure");
    return "saved";
  });

  await assert.rejects(submit(), /temporary failure/);
  assert.equal(await submit(), "saved");
  assert.equal(calls, 2);
});
