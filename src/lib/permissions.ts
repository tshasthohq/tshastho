// All available permissions
export const ALL_PERMISSIONS = [
  { key: "view_dashboard", label: "View Dashboard", category: "General" },
  { key: "view_orders", label: "View Orders", category: "Orders" },
  { key: "accept_orders", label: "Accept/Reject Orders", category: "Orders" },
  { key: "deliver_orders", label: "Mark as Delivered", category: "Orders" },
  { key: "view_medicines", label: "View Medicines", category: "Inventory" },
  { key: "add_medicines", label: "Add/Edit Medicines", category: "Inventory" },
  { key: "delete_medicines", label: "Delete Medicines", category: "Inventory" },
  { key: "view_inventory", label: "View Inventory", category: "Inventory" },
  { key: "view_customers", label: "View Customers", category: "Customers" },
  { key: "view_dues", label: "View Dues", category: "Finance" },
  { key: "collect_dues", label: "Collect Due Payments", category: "Finance" },
  { key: "view_reports", label: "View Reports & Profit", category: "Reports" },
  { key: "manage_staff", label: "Manage Staff", category: "Staff" },
  { key: "view_attendance", label: "View Attendance", category: "Staff" },
  { key: "manage_settings", label: "Manage Settings", category: "Settings" },
];

// Default permissions for each role
export const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  MANAGER: [
    "view_dashboard", "view_orders", "accept_orders", "deliver_orders",
    "view_medicines", "add_medicines", "view_inventory",
    "view_customers", "view_dues", "collect_dues", "view_reports",
    "view_attendance",
  ],
  CASHIER: [
    "view_dashboard", "view_orders", "accept_orders",
    "view_medicines", "view_dues", "collect_dues",
  ],
  PHARMACIST: [
    "view_dashboard", "view_orders", "view_medicines", "add_medicines",
    "view_inventory", "view_customers",
  ],
  DELIVERY: [
    "view_dashboard", "view_orders", "deliver_orders",
  ],
  STOCK_KEEPER: [
    "view_dashboard", "view_medicines", "add_medicines", "view_inventory",
  ],
  ACCOUNTANT: [
    "view_dashboard", "view_orders", "view_dues", "view_reports",
  ],
  NIGHT_SHIFT: [
    "view_dashboard", "view_orders", "accept_orders",
    "view_medicines", "view_dues",
  ],
  SUPERVISOR: [
    "view_dashboard", "view_orders", "accept_orders", "deliver_orders",
    "view_medicines", "add_medicines", "view_inventory",
    "view_customers", "view_dues", "collect_dues", "view_attendance",
  ],
  SECURITY: ["view_dashboard", "view_orders"],
  CLEANER: ["view_dashboard"],
};

// Custom Role default - practical starting set (owner can modify)
const CUSTOM_DEFAULTS = [
  "view_dashboard",
  "view_orders",
  "view_medicines",
  "view_dues",
];

export function getDefaultPermissions(role: string): string[] {
  if (DEFAULT_PERMISSIONS[role]) return DEFAULT_PERMISSIONS[role];
  // Custom roles get practical default set
  return CUSTOM_DEFAULTS;
}

// ===== Validation Helpers (Part D-5) =====

// সব valid permission keys
export const ALL_PERMISSION_KEYS = ALL_PERMISSIONS.map(p => p.key);

// Permission validate করি - শুধু valid key রাখি
export function validatePermissions(perms: unknown): string[] {
  if (!Array.isArray(perms)) return [];
  return perms.filter((p): p is string => 
    typeof p === "string" && ALL_PERMISSION_KEYS.includes(p)
  );
}

// Staff-এর জন্য dangerous permissions block করি (owner-e exclusive)
export const OWNER_ONLY_PERMISSIONS = ["manage_staff", "manage_settings"];

// Staff permission sanitize - dangerous বাদ দিই
export function sanitizeStaffPermissions(perms: string[], isOwner: boolean): string[] {
  if (isOwner) return perms;
  return perms.filter(p => !OWNER_ONLY_PERMISSIONS.includes(p));
}

// Custom role-এর জন্য minimum guaranteed permissions
export const MINIMUM_STAFF_PERMISSIONS = ["view_dashboard"];

export function ensureMinimumPermissions(perms: string[]): string[] {
  if (perms.length === 0) return [...MINIMUM_STAFF_PERMISSIONS];
  return perms;
}
