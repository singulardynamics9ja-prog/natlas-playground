import assert from "node:assert/strict";
import test from "node:test";
import { removeStoredRecordKeys } from "../lib/chat-storage.mjs";

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    value: (key) => values.get(key),
  };
}

test("deleting a conversation's message keys keeps records for other conversations", () => {
  const storage = createStorage({
    feedback: JSON.stringify({ messageA: { helpful: true }, messageB: { helpful: false } }),
  });

  removeStoredRecordKeys(storage, "feedback", ["messageA"]);

  assert.deepEqual(JSON.parse(storage.value("feedback")), {
    messageB: { helpful: false },
  });
});

test("removes the browser key when its last record is deleted", () => {
  const storage = createStorage({ evaluation: JSON.stringify({ messageA: { caseId: "case-a" } }) });

  removeStoredRecordKeys(storage, "evaluation", ["messageA"]);

  assert.equal(storage.value("evaluation"), undefined);
});

test("preserves storage when no message IDs are supplied", () => {
  const original = JSON.stringify({ messageA: { helpful: true } });
  const storage = createStorage({ feedback: original });

  removeStoredRecordKeys(storage, "feedback", []);

  assert.equal(storage.value("feedback"), original);
});

test("surfaces invalid stored JSON instead of silently discarding it", () => {
  const storage = createStorage({ feedback: "not-json" });

  assert.throws(() => removeStoredRecordKeys(storage, "feedback", ["messageA"]));
});
