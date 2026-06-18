import { db } from './firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  writeBatch,
  query
} from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {}, // auth is not configured/implemented in this applet
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Universal subscription helper that listens to Firestore collections.
 * If the collection is completely empty (e.g. brand new Firebase project), 
 * it seeds it with the provided items to assure the user gets a working setup of demo data.
 */
export function subscribeToCollection<T extends { id: string }>(
  collectionName: string,
  onUpdate: (data: T[]) => void,
  seedData?: T[]
) {
  const colRef = collection(db, collectionName);
  
  // Real-time listener
  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty && seedData && seedData.length > 0) {
      console.log(`Collection ${collectionName} is empty. Seeding with default data...`);
      const batch = writeBatch(db);
      seedData.forEach((item) => {
        const docRef = doc(db, collectionName, item.id);
        batch.set(docRef, item);
      });
      try {
        await batch.commit();
      } catch (err) {
        console.error(`Error seeding collection ${collectionName}:`, err);
      }
    } else {
      const items: T[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as T);
      });
      // Sort item arrays if they have createdAt to match original visual sequence
      if (items.length > 0 && 'createdAt' in items[0]) {
        items.sort((a: any, b: any) => {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
      }
      onUpdate(items);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, collectionName);
  });
}

/**
 * Saves (adds or edits) a document in its corresponding collection.
 * Using setDoc to preserve consistent ID structures (e.g. "co-1", "do-2026-0001", etc.)
 */
export async function saveDocument<T extends { id: string }>(
  collectionName: string,
  item: T
) {
  try {
    const docRef = doc(db, collectionName, item.id);
    await setDoc(docRef, item);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${item.id}`);
  }
}

/**
 * Deletes a document from a collection.
 */
export async function deleteDocument(
  collectionName: string,
  id: string
) {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
  }
}

/**
 * Resets a collection by deleting all existing documents and loading seed data.
 */
export async function resetCollectionWithSeeds<T extends { id: string }>(
  collectionName: string,
  seedData: T[]
) {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const batch = writeBatch(db);
    
    // Delete all current documents
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Insert all seed documents
    seedData.forEach((item) => {
      const docRef = doc(db, collectionName, item.id);
      batch.set(docRef, item);
    });
    
    await batch.commit();
    console.log(`Successfully reset collection ${collectionName} with seeds.`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, collectionName);
  }
}
