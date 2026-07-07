import { create } from "zustand";

const useOfflineStore = create((set, get) => ({
  isOffline: false,
  pendingCount: 0,
  failedSales: [],

  setIsOffline: (offline) => set({ isOffline: offline }),
  setPendingCount: (count) => set({ pendingCount: count }),
  incrementPendingCount: () => set((state) => ({ pendingCount: state.pendingCount + 1 })),
  decrementPendingCount: () =>
    set((state) => ({ pendingCount: Math.max(0, state.pendingCount - 1) })),

  setFailedSales: (sales) => set({ failedSales: sales }),
  addFailedSale: (sale) =>
    set((state) => ({ failedSales: [...state.failedSales, sale] })),
  removeFailedSale: (localId) =>
    set((state) => ({
      failedSales: state.failedSales.filter((s) => s.localId !== localId),
    })),
}));

export default useOfflineStore;
