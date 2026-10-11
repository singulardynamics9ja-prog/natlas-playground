/**
 * @param {Pick<Storage, "getItem" | "setItem" | "removeItem">} storage
 * @param {string} storageKey
 * @param {readonly string[]} removedKeys
 */
export function removeStoredRecordKeys(storage, storageKey, removedKeys) {
  const stored = storage.getItem(storageKey);
  if (!stored || removedKeys.length === 0) return;

  const parsed = JSON.parse(stored);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`Stored data for "${storageKey}" has an invalid format.`);
  }

  for (const key of removedKeys) {
    delete parsed[key];
  }

  if (Object.keys(parsed).length === 0) {
    storage.removeItem(storageKey);
  } else {
    storage.setItem(storageKey, JSON.stringify(parsed));
  }
}
