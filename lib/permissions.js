import { roleAccess } from "./roles";

export function canAccess(role, action) {
  if (!role) return false;
  const perms = roleAccess[role] || [];

  if (perms.includes("*")) return true;
  if (perms.includes(action)) return true;

  // support hierarchical: e.g. "deliveries.view" should grant "deliveries.view.assigned"
  // or "inventory.*" should match "inventory.report"
  // check ancestors and wildcard ancestors
  const parts = action.split(".");
  for (let i = parts.length - 1; i > 0; i--) {
    const ancestor = parts.slice(0, i).join(".");
    if (perms.includes(ancestor)) return true;
    if (perms.includes(`${ancestor}.*`)) return true;
  }

  return false;
}
