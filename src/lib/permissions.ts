export type Role = "customer" | "super_admin" | "operations" | "sales" | "content" | "finance";

export const ADMIN_ROLES: Role[] = ["super_admin", "operations", "sales", "content", "finance"];

export const ROLE_LABEL: Record<string, string> = {
  customer: "Customer",
  super_admin: "Super Admin",
  operations: "Operations Manager",
  sales: "Sales Manager",
  content: "Content Manager",
  finance: "Finance",
};

export type Section =
  | "dashboard"
  | "orders"
  | "customers"
  | "products"
  | "categories"
  | "inventory"
  | "pigs"
  | "wholesale"
  | "quotes"
  | "payments"
  | "delivery"
  | "coupons"
  | "reviews"
  | "blog"
  | "notifications"
  | "reports"
  | "settings";

const ACCESS: Record<Section, Role[]> = {
  dashboard: ADMIN_ROLES,
  orders: ["super_admin", "operations", "sales", "finance"],
  customers: ["super_admin", "sales"],
  products: ["super_admin", "content", "operations"],
  categories: ["super_admin", "content"],
  inventory: ["super_admin", "operations"],
  pigs: ["super_admin", "operations"],
  wholesale: ["super_admin", "sales"],
  quotes: ["super_admin", "sales"],
  payments: ["super_admin", "finance"],
  delivery: ["super_admin", "operations"],
  coupons: ["super_admin", "sales", "content"],
  reviews: ["super_admin", "content", "sales"],
  blog: ["super_admin", "content"],
  notifications: ADMIN_ROLES,
  reports: ["super_admin", "finance", "sales"],
  settings: ["super_admin"],
};

export function can(role: string | undefined | null, section: Section): boolean {
  if (!role) return false;
  return ACCESS[section]?.includes(role as Role) ?? false;
}

export function isAdminRole(role: string | undefined | null): boolean {
  return !!role && ADMIN_ROLES.includes(role as Role);
}

export const ADMIN_NAV: { section: Section; label: string; href: string }[] = [
  { section: "dashboard", label: "Dashboard", href: "/admin" },
  { section: "orders", label: "Orders", href: "/admin/orders" },
  { section: "customers", label: "Customers", href: "/admin/customers" },
  { section: "products", label: "Products", href: "/admin/products" },
  { section: "categories", label: "Categories", href: "/admin/categories" },
  { section: "inventory", label: "Inventory", href: "/admin/inventory" },
  { section: "pigs", label: "Whole Pig Inventory", href: "/admin/pigs" },
  { section: "wholesale", label: "Wholesale Pricing", href: "/admin/wholesale" },
  { section: "quotes", label: "Quotes", href: "/admin/quotes" },
  { section: "payments", label: "Payments", href: "/admin/payments" },
  { section: "delivery", label: "Delivery", href: "/admin/delivery" },
  { section: "coupons", label: "Discounts", href: "/admin/coupons" },
  { section: "reviews", label: "Reviews", href: "/admin/reviews" },
  { section: "blog", label: "Blog & Content", href: "/admin/blog" },
  { section: "notifications", label: "Notifications", href: "/admin/notifications" },
  { section: "reports", label: "Reports", href: "/admin/reports" },
  { section: "settings", label: "Settings & Staff", href: "/admin/settings" },
];
