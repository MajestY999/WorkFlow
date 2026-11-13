import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getApiErrorMessage,
  getApiErrorStatus,
} from "../../app/utils/api-error";

test("shows retry guidance for HTTP 500 and 429", () => {
  assert.match(getApiErrorMessage({ statusCode: 500 }), /временно недоступен/i);
  assert.match(
    getApiErrorMessage({ statusCode: 429 }),
    /слишком много запросов/i,
  );
});

test("preserves server messages for HTTP 401 and 409", () => {
  const unauthorized = { statusCode: 401, statusMessage: "Требуется вход." };
  const conflict = {
    statusCode: 409,
    data: { statusMessage: "Заявка уже изменена." },
  };
  assert.equal(getApiErrorStatus(unauthorized), 401);
  assert.equal(getApiErrorMessage(unauthorized), "Требуется вход.");
  assert.equal(getApiErrorStatus(conflict), 409);
  assert.equal(getApiErrorMessage(conflict), "Заявка уже изменена.");
});
