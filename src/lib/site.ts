export const SITE = {
  name: "Lumina Hub",
  legalName: "Lumina Hub Ltd",
  tagline: "Lampshades & textiles, crafted for how light feels",
  domain: "luminahub.co.uk",
  email: "Sales@luminahub.co.uk",
  phone: "+44 7889 451166",
  whatsapp: "https://wa.me/447889451166",
  address: "Electric Parade, Seven Kings, Ilford IG3 8BS, United Kingdom",
  hours: {
    weekdays: "Mon–Fri 9:30–17:30",
    saturday: "Sat by appointment",
    note: "WhatsApp preferred for quick shade questions",
  },
  currency: "gbp" as const,
  locale: "en-GB" as const,
  maxContent: "max-w-[1440px]",
};

export const ANNOUNCEMENT =
  "Handmade in Britain · Made to order · Quiet luxury for the home";

export const NAV_MEGA = {
  lampshades: {
    label: "Lampshades",
    href: "/shop/lampshades",
    columns: [
      {
        title: "By shape",
        links: [
          { href: "/shop/lampshades?shape=drum", label: "Drum" },
          { href: "/shop/lampshades?shape=empire", label: "Empire" },
          { href: "/shop/lampshades?shape=oval", label: "Oval" },
          { href: "/shop/lampshades?shape=rectangular", label: "Rectangular" },
          { href: "/shop/lampshades?shape=coolie", label: "Coolie" },
          { href: "/shop/lampshades?shape=square", label: "Square" },
        ],
      },
      {
        title: "By collection",
        links: [
          { href: "/shop/bestsellers", label: "Bestsellers" },
          { href: "/shop/new", label: "New arrivals" },
          { href: "/shop/linen-calm", label: "Linen calm" },
          { href: "/shop/botanical", label: "Botanical" },
        ],
      },
      {
        title: "By material",
        links: [
          { href: "/shop/velvet", label: "Velvet" },
          { href: "/shop/linen", label: "Linen" },
          { href: "/shop/printed", label: "Printed" },
          { href: "/shop/foil", label: "Foil" },
        ],
      },
      {
        title: "Create",
        links: [
          { href: "/design-your-shade", label: "Design your shade" },
          { href: "/bespoke", label: "Bespoke enquiry" },
          { href: "/size-guide", label: "Size guide" },
        ],
      },
    ],
  },
};

export const PRIMARY_NAV = [
  { href: "/shop/lampshades", label: "Lampshades", mega: "lampshades" as const },
  { href: "/shop/fabrics", label: "Fabrics" },
  { href: "/shop/cushions", label: "Cushions" },
  { href: "/shop/kits", label: "Kits" },
  { href: "/design-your-shade", label: "Design your shade" },
  { href: "/trade", label: "Trade" },
];
