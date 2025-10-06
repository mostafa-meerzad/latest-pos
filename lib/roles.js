export const ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  CASHIER: "CASHIER",
  STOCK_MANAGER: "STOCK_MANAGER",
  DELIVERY_DRIVER: "DELIVERY_DRIVER",
};

export const roleAccess = {
  ADMIN: ["*"],

  MANAGER: [
    // full business-level access (except some low-level infra)
    "customers.view",
    "customers.manage",
    "products.view",
    "products.manage",
    "inventory.view",
    "inventory.manage",
    "inventory.report",
    "sales.view",
    "sales.create",
    "sales.refund",
    "sales.report",
    "reports.view",
    "reports.export",
    "suppliers.manage",
    "drivers.view",
    "drivers.manage",
    "invoices.view",
    "invoices.manage",
    "categories.manage",
    "users.manage",
    "settings.manage",
    "deliveries.view",
    "deliveries.manage",
    "deliveries.assign",
  ],

  CASHIER: [
    // mostly sales + invoices + basic customer/product lookup
    "sales.create",
    "sales.view",
    "sales.refund",
    "invoices.manage",
    "invoices.view",
    "customers.view",
    "products.view",
    "deliveries.view",
  ],

  STOCK_MANAGER: [
    // inventory & supplier focused
    "inventory.view",
    "inventory.manage",
    "inventory.report",
    "products.view",
    "products.manage",
    "suppliers.manage",
  ],

  DELIVERY_DRIVER: [
    // only their assigned deliveries + status updates
    "deliveries.view.assigned",
    "deliveries.update",
    "deliveries.view",
  ],
};
