import { toast } from "react-hot-toast";
import {
  addPendingSale,
  getPendingSales,
  deletePendingSale,
  updatePendingSale,
  setMetaValue,
  getMetaValue,
  deleteMetaValue,
} from "@/lib/offline/db";
import useOfflineStore from "@/lib/stores/offlineStore";

let listenerRegistered = false;

export function registerOnlineListener() {
  if (listenerRegistered || typeof window === "undefined") return;
  listenerRegistered = true;

  window.addEventListener("online", async () => {
    await deleteMetaValue("went_offline_at");
    flushPendingSales();
  });

  window.addEventListener("offline", async () => {
    const existing = await getMetaValue("went_offline_at");
    if (!existing) {
      await setMetaValue("went_offline_at", new Date().toISOString());
    }
  });
}

export async function queueSale(payload, localSaleData) {
  const localId = await addPendingSale(payload, localSaleData);
  const store = useOfflineStore.getState();
  store.incrementPendingCount();
  return localId;
}

export async function flushPendingSales() {
  const all = await getPendingSales();
  const pending = all.filter((s) => s.status === "pending");
  if (pending.length === 0) return;

  const store = useOfflineStore.getState();

  for (const sale of pending) {
    try {
      const res = await fetch("/api/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sale.payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        await deletePendingSale(sale.localId);
        store.decrementPendingCount();
        toast.success("Queued sale synced successfully.");
      } else if (res.status >= 400 && res.status < 500) {
        // Business logic error — mark failed so cashier can review
        const updated = {
          ...sale,
          status: "failed",
          errorMessage: data?.error || "Sale failed to sync",
          retryCount: (sale.retryCount || 0) + 1,
        };
        await updatePendingSale(sale.localId, updated);
        store.addFailedSale(updated);
        store.decrementPendingCount();
      }
      // 5xx / network errors: leave as pending, retry next time
    } catch {
      // Network error during flush — leave pending
    }
  }

  // Refresh final count from IDB to stay in sync
  const remaining = await getPendingSales();
  store.setPendingCount(remaining.filter((s) => s.status === "pending").length);
}

export async function retryFailedSale(localId) {
  const store = useOfflineStore.getState();
  await updatePendingSale(localId, { status: "pending", errorMessage: null });
  store.removeFailedSale(localId);
  store.incrementPendingCount();
  flushPendingSales();
}

export async function voidFailedSale(localId) {
  await deletePendingSale(localId);
  useOfflineStore.getState().removeFailedSale(localId);
}
