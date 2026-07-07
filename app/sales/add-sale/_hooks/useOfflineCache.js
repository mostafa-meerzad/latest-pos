import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  putProducts,
  getProducts,
  putCustomers,
  getCustomers,
  getPendingSales,
} from "@/lib/offline/db";
import useOfflineStore from "@/lib/stores/offlineStore";
import { registerOnlineListener } from "@/lib/offline/sync";

async function fetchAllPages(buildUrl) {
  let all = [];
  let page = 1;
  while (true) {
    const res = await fetch(buildUrl(page));
    const data = await res.json();
    if (!data.success) break;
    all = [...all, ...data.data];
    if (page >= (data.pagination?.totalPages ?? 1)) break;
    page++;
  }
  return all;
}

export function useOfflineCache({ isEditMode = false } = {}) {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const { setIsOffline, setPendingCount, setFailedSales } = useOfflineStore();

  // Online/offline status tracking
  useEffect(() => {
    const update = () => setIsOffline(!navigator.onLine);
    setIsOffline(!navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, [setIsOffline]);

  // Load pending sale state from IDB on mount
  useEffect(() => {
    async function load() {
      const all = await getPendingSales();
      setPendingCount(all.filter((s) => s.status === "pending").length);
      setFailedSales(all.filter((s) => s.status === "failed"));
    }
    load();
  }, [setPendingCount, setFailedSales]);

  // Register the online listener for auto-sync (idempotent)
  useEffect(() => {
    registerOnlineListener();
  }, []);

  // Fetch products — full catalog for offline cache, IDB fallback on failure
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const all = await fetchAllPages(
          (page) => `/api/products/?page=${page}&limit=100&status=ACTIVE&stock=in`
        );
        if (!active) return;
        await putProducts(all);
        setProducts(
          all.filter((p) => p.status === "ACTIVE" && !p.isDeleted && Number(p.stockQuantity) > 0)
        );
      } catch {
        const cached = await getProducts();
        if (!active) return;
        if (cached.length > 0) {
          setProducts(
            cached.filter((p) => p.status === "ACTIVE" && !p.isDeleted && Number(p.stockQuantity) > 0)
          );
          toast("Using cached product list — data may be outdated", { icon: "⚠️" });
        } else {
          toast.error("Failed to fetch products and no cache available");
        }
      }
    }

    load();
    return () => { active = false; };
  }, [isEditMode]);

  // Fetch customers — full list for offline cache, IDB fallback on failure
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const all = await fetchAllPages(
          (page) => `/api/customer/?page=${page}&limit=100`
        );
        if (!active) return;
        await putCustomers(all);
        setCustomers(all);
      } catch {
        const cached = await getCustomers();
        if (!active) return;
        if (cached.length > 0) {
          setCustomers(cached);
          toast("Using cached customer list — data may be outdated", { icon: "⚠️" });
        } else {
          toast.error("Failed to fetch customers and no cache available");
        }
      }
    }

    load();
    return () => { active = false; };
  }, []);

  return { products, customers };
}
