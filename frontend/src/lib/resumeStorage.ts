const DATABASE_NAME = "unhired-resume-storage";
const STORE_NAME = "resume-files";
const RESUME_KEY = "uploaded-resume";

interface StoredResume {
  blob: Blob;
  fileName: string;
  contentType: string;
}

function openResumeDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("This browser does not support local resume storage."));
      return;
    }

    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open resume storage."));
  });
}

export async function saveResumeFile(file: File): Promise<void> {
  const database = await openResumeDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(
        { blob: file, fileName: file.name, contentType: file.type } satisfies StoredResume,
        RESUME_KEY,
      );
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Could not save the resume."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Resume storage was interrupted."));
    });
  } finally {
    database.close();
  }
}

export async function loadResumeFile(): Promise<StoredResume | null> {
  const database = await openResumeDatabase();
  try {
    return await new Promise<StoredResume | null>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(RESUME_KEY);
      request.onsuccess = () => resolve((request.result as StoredResume | undefined) ?? null);
      request.onerror = () => reject(request.error ?? new Error("Could not load the saved resume."));
    });
  } finally {
    database.close();
  }
}

export async function removeResumeFile(): Promise<void> {
  const database = await openResumeDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(RESUME_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Could not remove the saved resume."));
    });
  } finally {
    database.close();
  }
}
