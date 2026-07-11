"use client";

export type DraftValidator<T> = (value: unknown) => value is T;
export type DraftEntry<T> = {
  id: string;
  updatedAt: number;
  data: T;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function acceptAnyDraft<T>(_unused: unknown): _unused is T {
  return true;
}

function isDraftEntry<T>(value: unknown, isDraft: DraftValidator<T>): value is DraftEntry<T> {
  const candidate = value as Partial<DraftEntry<T>> | null;

  return (
    typeof value === "object" &&
    value !== null &&
    typeof candidate?.id === "string" &&
    typeof candidate.updatedAt === "number" &&
    isDraft(candidate.data)
  );
}

function loadStoredValue(key: string): unknown {
  const rawValue = window.localStorage.getItem(key);

  if (!rawValue) {
    return null;
  }

  return JSON.parse(rawValue);
}

export function loadLocalDraft<T>(key: string, isDraft: DraftValidator<T>): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const parsedValue = loadStoredValue(key);

    if (parsedValue === null) {
      return null;
    }

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

export function listLocalDraftEntries<T>(key: string, isDraft: DraftValidator<T>): DraftEntry<T>[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const parsedValue = loadStoredValue(key);

    if (parsedValue === null) {
      return [];
    }

    if (!Array.isArray(parsedValue)) {
      window.localStorage.removeItem(key);
      return [];
    }

    const entries = parsedValue.filter((entry): entry is DraftEntry<T> => isDraftEntry(entry, isDraft));

    if (entries.length !== parsedValue.length) {
      window.localStorage.setItem(key, JSON.stringify(entries));
    }

    return entries.sort((left, right) => right.updatedAt - left.updatedAt);
  } catch {
    window.localStorage.removeItem(key);
    return [];
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

function createDraftId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function saveLocalDraftEntry<T>(key: string, value: T, id?: string): DraftEntry<T> {
  const entry = {
    id: id ?? createDraftId(),
    updatedAt: Date.now(),
    data: value,
  };

  if (typeof window === "undefined") {
    return entry;
  }

  try {
    const existingEntries = listLocalDraftEntries<T>(key, acceptAnyDraft<T>);
    const nextEntries = existingEntries.filter((item) => item.id !== entry.id);
    nextEntries.push(entry);
    window.localStorage.setItem(key, JSON.stringify(nextEntries));
  } catch {
    // Draft persistence is best-effort and must not interrupt the form flow.
  }

  return entry;
}

export function removeLocalDraftEntry(key: string, id: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const parsedValue = loadStoredValue(key);

    if (!Array.isArray(parsedValue)) {
      window.localStorage.removeItem(key);
      return;
    }

    window.localStorage.setItem(
      key,
      JSON.stringify(parsedValue.filter((entry) => {
        return typeof entry === "object" && entry !== null && "id" in entry && entry.id !== id;
      })),
    );
  } catch {
    window.localStorage.removeItem(key);
  }
}
