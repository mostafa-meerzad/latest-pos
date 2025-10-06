// components/saleStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

const PERSIST_KEY = "pos-sale-storage";

const useSaleStore = create(
  persist(
    (set, get) => ({
      items: [],
      finalizedSales: [],

      // Add an item
      addItem: (item) => {
        set((state) => ({ items: [...state.items, item] }));
      },

      // Update item by tempId
      updateItem: (tempId, updated) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.tempId === tempId ? { ...i, ...updated } : i
          ),
        })),

      // Delete item by tempId
      deleteItem: (tempId) =>
        set((state) => ({
          items: state.items.filter((i) => i.tempId !== tempId),
        })),

      // Clear cart
      clear: () => set({ items: [] }),

      // Finalize sale: (keeps old behavior if you call it locally without server)
      finalizeSale: (customer = { id: 0, name: "Walk in" }) => {
        const { items, finalizedSales } = get();
        if (items.length === 0) return; // no sale
        const sale = {
          id: Date.now(), // simple unique id
          customer,
          items,
          total: items.reduce(
            (sum, i) => sum + parseFloat(i.unitPrice) * i.quantity,
            0
          ),
          date: new Date().toISOString(),
        };

        set({
          finalizedSales: [...finalizedSales, sale],
          items: [], // empty cart after finalizing
        });
      },

      // NEW: add a finalized sale from server response (keeps server and local store in sync)
      addFinalizedSale: (sale) =>
        set((state) => ({ finalizedSales: [...state.finalizedSales, sale] })),
    }),
    {
      name: PERSIST_KEY, // persisted key
    }
  )
);

// ------------------------
// Sync store across tabs / pages
// ------------------------
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === PERSIST_KEY && event.newValue) {
      const newState = JSON.parse(event.newValue);
      useSaleStore.setState(newState.state);
    }
  });
}

export default useSaleStore;
export { PERSIST_KEY };
