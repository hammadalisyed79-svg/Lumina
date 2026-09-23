export type AdminNavItem = {
  href: string;
  label: string;
  permission?: string;
};

export type AdminNavGroup = {
  title: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: "Overview",
    items: [{ href: "/admin", label: "Dashboard", permission: "dashboard.view" }],
  },
  {
    title: "Commerce",
    items: [
      { href: "/admin/orders", label: "Orders", permission: "orders.view" },
      { href: "/admin/customers", label: "Customers", permission: "customers.view" },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", permission: "products.view" },
      { href: "/admin/collections", label: "Collections", permission: "collections.view" },
      { href: "/admin/fabrics", label: "Fabrics", permission: "fabrics.view" },
      { href: "/admin/shapes", label: "Shapes", permission: "shapes.view" },
      { href: "/admin/sizes", label: "Sizes", permission: "sizes.view" },
      { href: "/admin/linings", label: "Linings", permission: "linings.view" },
      { href: "/admin/fittings", label: "Fittings", permission: "fittings.view" },
      { href: "/admin/inventory", label: "Inventory", permission: "inventory.view" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/admin/discounts", label: "Discounts", permission: "discounts.view" },
      { href: "/admin/reviews", label: "Reviews", permission: "reviews.view" },
      { href: "/admin/newsletter", label: "Newsletter", permission: "newsletter.view" },
    ],
  },
  {
    title: "Enquiries",
    items: [
      { href: "/admin/bespoke", label: "Bespoke", permission: "bespoke.view" },
      { href: "/admin/trade", label: "Trade", permission: "trade.view" },
      { href: "/admin/enquiries", label: "Contact", permission: "enquiries.view" },
    ],
  },
  {
    title: "Website",
    items: [
      { href: "/admin/content", label: "Content", permission: "content.view" },
      { href: "/admin/homepage", label: "Homepage", permission: "content.view" },
      { href: "/admin/navigation", label: "Navigation", permission: "navigation.view" },
      { href: "/admin/media", label: "Media", permission: "media.view" },
      { href: "/admin/seo", label: "SEO", permission: "seo.view" },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/users", label: "Users", permission: "users.view" },
      { href: "/admin/settings", label: "Settings", permission: "settings.view" },
      { href: "/admin/audit-log", label: "Audit log", permission: "audit.view" },
      { href: "/admin/search", label: "Search" },
    ],
  },
];

/** Legacy coupon route redirect target */
export const ADMIN_LEGACY_REDIRECTS: Record<string, string> = {
  "/admin/coupons": "/admin/discounts",
  "/admin/cms": "/admin/content",
  "/admin/shipping": "/admin/settings",
};
