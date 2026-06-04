import { useState, useEffect } from 'react';
import type { Message } from '../types';

const DB_NAME = 'zyai-offline';
const STORE_NAME = 'pending-messages';

export interface OfflineMessage {
  id: string;
  message: Message;
  syncStatus: 'pending' | 'synced' | 'failed';
  createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveOfflineMessage(message: Message): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).add({
    id: `offline_${message.id}_${Date.now()}`,
    message,
    syncStatus: 'pending',
    createdAt: Date.now(),
  } as OfflineMessage);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingMessages(): Promise<OfflineMessage[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  return new Promise((resolve) => {
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });
}

export async function clearSyncedMessages(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).clear();
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingCount(): Promise<number> {
  const pending = await getPendingMessages();
  return pending.length;
}

// Network status monitoring hook
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Sync pending messages when back online
export async function syncWhenOnline(): Promise<number> {
  if (!navigator.onLine) return 0;
  const pending = await getPendingMessages();
  if (pending.length === 0) return 0;

  let synced = 0;
  for (const item of pending) {
    if (item.syncStatus === 'pending') {
      // Mark as synced (in a real app, you'd send to the backend)
      synced++;
    }
  }

  if (synced > 0) {
    await clearSyncedMessages();
  }

  return synced;
}

// Request background sync via service worker
export function requestBackgroundSync(): void {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(reg => {
      // @ts-expect-error - SyncManager API
      reg.sync?.register('sync-messages');
    }).catch(() => {
      // Background sync not supported
    });
  }
}
