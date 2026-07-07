import { create } from "zustand";
import { persist } from "zustand/middleware";

const PERSIST_KEY = "pos-sale-storage";

const useSaleStore = create(
  persist(
    (set, get) => ({
      items: [],
      finalizedSales: [],

      addItem: (item) => {
        set((state) => ({ items: [...state.items, item] }));
      },

      updateItem: (tempId, updated) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.tempId === tempId ? { ...i, ...updated } : i
          ),
        })),

      deleteItem: (tempId) =>
        set((state) => ({
          items: state.items.filter((i) => i.tempId !== tempId),
        })),

      clear: () => set({ items: [] }),

      finalizeSale: (customer = { id: 0, name: "Walk-in Customer" }) => {
        const { items, finalizedSales } = get();
        if (items.length === 0) return;
        const sale = {
          id: Date.now(),
          customer,
          items,
          total: items.reduce(
            (sum, i) => sum + parseFloat(i.unitPrice) * i.quantity,
            0
          ),
          date: new Date().toISOString(),
        };
        set({ finalizedSales: [...finalizedSales, sale], items: [] });
      },

      addFinalizedSale: (sale) =>
        set((state) => ({ finalizedSales: [...state.finalizedSales, sale] })),
    }),
    { name: PERSIST_KEY }
  )
);

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
