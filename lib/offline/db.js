import { openDB } from "idb";

const DB_NAME = "pos_offline_db";
const DB_VERSION = 1;

let dbPromise = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("offline_products")) {
          const productStore = db.createObjectStore("offline_products", { keyPath: "id" });
          productStore.createIndex("barcode", "barcode", { unique: false });
        }
        if (!db.objectStoreNames.contains("offline_customers")) {
          db.createObjectStore("offline_customers", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("pending_sales")) {
          db.createObjectStore("pending_sales", { keyPath: "localId", autoIncrement: true });
        }
        if (!db.objectStoreNames.contains("offline_meta")) {
          db.createObjectStore("offline_meta", { keyPath: "key" });
        }
      },
    });
  }
  return dbPromise;
}

export async function putProducts(products) {
  const db = await getDb();
  const tx = db.transaction("offline_products", "readwrite");
  await Promise.all(
    products.map((p) =>
      tx.store.put({
        id: p.id,
        name: p.name,
        barcode: p.barcode ?? null,
        price: p.price,
        stockQuantity: p.stockQuantity,
        unit: p.unit,
        status: p.status,
        isDeleted: p.isDeleted,
      })
    )
  );
  await tx.done;
  await setMetaValue("products_cached_at", new Date().toISOString());
}

export async function getProducts() {
  const db = await getDb();
  return db.getAll("offline_products");
}

export async function putCustomers(customers) {
  const db = await getDb();
  const tx = db.transaction("offline_customers", "readwrite");
  await Promise.all(
    customers.map((c) =>
      tx.store.put({ id: c.id, name: c.name, phone: c.phone ?? null })
    )
  );
  await tx.done;
  await setMetaValue("customers_cached_at", new Date().toISOString());
}

export async function getCustomers() {
  const db = await getDb();
  return db.getAll("offline_customers");
}

export async function addPendingSale(payload, localSaleData) {
  const db = await getDb();
  return db.add("pending_sales", {
    payload,
    localSaleData,
    queuedAt: new Date().toISOString(),
    status: "pending",
    errorMessage: null,
    retryCount: 0,
  });
}

export async function getPendingSales() {
  const db = await getDb();
  return db.getAll("pending_sales");
}

export async function updatePendingSale(localId, changes) {
  const db = await getDb();
  const tx = db.transaction("pending_sales", "readwrite");
  const record = await tx.store.get(localId);
  if (record) {
    await tx.store.put({ ...record, ...changes });
  }
  await tx.done;
}

export async function deletePendingSale(localId) {
  const db = await getDb();
  return db.delete("pending_sales", localId);
}

export async function getMetaValue(key) {
  const db = await getDb();
  const record = await db.get("offline_meta", key);
  return record?.value ?? null;
}

export async function setMetaValue(key, value) {
  const db = await getDb();
  return db.put("offline_meta", { key, value });
}

export async function deleteMetaValue(key) {
  const db = await getDb();
  return db.delete("offline_meta", key);
}
