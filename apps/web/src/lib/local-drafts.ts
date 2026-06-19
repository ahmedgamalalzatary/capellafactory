"use client";

export type DraftValidator<T> = (value: unknown) => value is T;

export function loadLocalDraft<T>(key: string, isDraft: DraftValidator<T>): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(key);

  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!isDraft(parsedValue)) {
      window.localStorage.removeItem(key);
      return null;
    }

    return parsedValue;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

export function saveLocalDraft<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Draft persistence is best-effort and must not interrupt the form flow.
  }
}

export function clearLocalDraft(key: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(key);
}
