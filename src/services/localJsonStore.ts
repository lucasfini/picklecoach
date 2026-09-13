import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

const STORAGE_PREFIX = 'picklecoach-';
const STORAGE_KEY_PATTERN = /^[a-z0-9-]{1,64}$/;

function assertSafeStorageKey(key: string) {
  if (!STORAGE_KEY_PATTERN.test(key)) {
    throw new Error('The local storage key is invalid.');
  }
}

function fileForKey(key: string) {
  assertSafeStorageKey(key);
  return new File(Paths.document, `${STORAGE_PREFIX}${key}.json`);
}

function temporaryFileForKey(key: string) {
  assertSafeStorageKey(key);
  return new File(
    Paths.document,
    `${STORAGE_PREFIX}${key}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}.tmp`,
  );
}

export async function readLocalJson<T>(key: string): Promise<T | null> {
  try {
    if (Platform.OS === 'web') {
      const value = globalThis.localStorage?.getItem(`${STORAGE_PREFIX}${key}`);
      return value ? (JSON.parse(value) as T) : null;
    }

    const file = fileForKey(key);
    if (!file.exists) {
      return null;
    }

    return JSON.parse(await file.text()) as T;
  } catch (error) {
    console.warn(`Unable to read local ${key} data.`, error);
    return null;
  }
}

export async function writeLocalJson<T>(key: string, value: T): Promise<boolean> {
  let temporaryFile: File | null = null;
  try {
    const serialized = JSON.stringify(value);
    if (Platform.OS === 'web') {
      if (!globalThis.localStorage) return false;
      globalThis.localStorage.setItem(`${STORAGE_PREFIX}${key}`, serialized);
      return true;
    }

    const destination = fileForKey(key);
    temporaryFile = temporaryFileForKey(key);
    temporaryFile.create({ intermediates: true });
    temporaryFile.write(serialized);
    await temporaryFile.move(destination, { overwrite: true });
    return true;
  } catch (error) {
    try {
      if (temporaryFile?.exists) temporaryFile.delete();
    } catch {
      // Best-effort cleanup; preserve the original write failure for callers.
    }
    console.warn(`Unable to save local ${key} data.`, error);
    return false;
  }
}

export async function deleteLocalJson(key: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      if (!globalThis.localStorage) return false;
      globalThis.localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
      return true;
    }

    const file = fileForKey(key);
    if (file.exists) {
      file.delete();
    }
    return true;
  } catch (error) {
    console.warn(`Unable to delete local ${key} data.`, error);
    return false;
  }
}

/**
 * Removes same-directory staging files left only if iOS terminated between an
 * atomic JSON write and its final move. Canonical JSON records are untouched.
 */
export async function purgeAbandonedLocalJsonWrites() {
  if (Platform.OS === 'web') {
    return 0;
  }

  try {
    const documentDirectory = new Directory(Paths.document);
    const abandonedFiles = documentDirectory.list().filter(
      (entry): entry is File => (
        entry instanceof File &&
        entry.name.startsWith(STORAGE_PREFIX) &&
        entry.name.endsWith('.tmp')
      ),
    );

    for (const file of abandonedFiles) {
      file.delete();
    }
    return abandonedFiles.length;
  } catch (error) {
    console.warn('Unable to clear abandoned local-data writes.', error);
    throw new Error('Abandoned local-data writes could not be cleared.', { cause: error });
  }
}
