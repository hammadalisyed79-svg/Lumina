export const SITE = {
  name: "Lumina Hub",
  legalName: "Lumina Hub Ltd",
  tagline: "Handmade lampshades & interior textiles",
  domain: "luminahub.co.uk",
  email: "hello@luminahub.co.uk",
  phone: "+44 20 0000 0000",
  whatsapp: "https://wa.me/447000000000",
  address: "Made in the United Kingdom",
  currency: "gbp" as const,
  locale: "en-GB" as const,
  freeShippingFrom: 75,
  defaultShipping: 4.95,
  maxContent: "max-w-[1440px]",
};

export const ANNOUNCEMENT =
  "Complimentary UK mainland delivery on orders over £75 · Made to order in Britain";

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
          { href: "/shop/mood/linen-calm", label: "Linen calm" },
          { href: "/shop/mood/botanical", label: "Botanical" },
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
