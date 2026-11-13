import assert from "node:assert/strict";
import { test } from "node:test";
import { canTransitionRequestStatus } from "../../shared/utils/request-rules";

test("allows supported status transitions", () => {
  assert.equal(canTransitionRequestStatus("Новая", "Назначена"), true);
  assert.equal(canTransitionRequestStatus("Назначена", "Ожидает ответа"), true);
  assert.equal(canTransitionRequestStatus("Назначена", "Решена"), true);
});

test("prevents reopening a resolved request", () => {
  assert.equal(canTransitionRequestStatus("Решена", "Новая"), false);
  assert.equal(canTransitionRequestStatus("Решена", "Назначена"), false);
});

test("accepts an unchanged status", () => {
  assert.equal(canTransitionRequestStatus("Назначена", "Назначена"), true);
});
