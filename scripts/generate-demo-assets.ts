import fs from "fs";
import path from "path";

const root = "public/demo-assets";
const colors: Record<string, string[]> = {
  products: ["#e7e2d8", "#d9d2c5", "#cfc6b6", "#b8a994", "#9a8b76", "#6e675c"],
  fabrics: ["#f3f1ec", "#e7e2d8", "#c5d1c0", "#e8dcc8", "#4a4540", "#d4c4a8", "#e8cfc8", "#2c3a55"],
  shapes: ["#ebe6dc", "#e0d8cb", "#d5cbb8", "#cfc3ae", "#c4b7a0", "#b8aa92"],
  lifestyle: ["#ddd6c8", "#d0c7b6", "#c4b9a6", "#ebe4d6"],
};

function svg(label: string, bg: string, accent = "#b8924a") {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${bg}"/><stop offset="1" stop-color="#f7f5f1"/></linearGradient></defs>
  <rect width="1200" height="1500" fill="url(#g)"/>
  <ellipse cx="600" cy="720" rx="280" ry="320" fill="none" stroke="${accent}" stroke-width="3" opacity="0.55"/>
  <ellipse cx="600" cy="720" rx="180" ry="210" fill="${accent}" opacity="0.12"/>
  <text x="600" y="1380" text-anchor="middle" font-family="Georgia,serif" font-size="36" fill="#1c1915">${label}</text>
  <text x="600" y="1430" text-anchor="middle" font-family="system-ui" font-size="18" fill="#6e675c">Lumina Hub</text>
</svg>`;
}

const names: Record<string, string[]> = {
  products: [
    "ivory-drum-shade",
    "stone-empire-shade",
    "sage-oval-shade",
    "champagne-coolie",
    "charcoal-rectangular",
    "botanical-drum",
    "blush-empire",
    "navy-square-shade",
    "linen-tall-drum",
    "herringbone-coolie",
    "velvet-empire-deep",
    "moire-oval-evening",
    "ivory-linen-cushion",
    "botanical-cushion",
    "sage-velvet-cushion",
    "blush-damask-cushion",
    "drum-kit-30",
    "empire-kit-30",
    "starter-tool-kit",
    "placeholder",
  ],
  fabrics: [
    "ivory-linen",
    "stone-herringbone",
    "sage-velvet",
    "champagne-silk",
    "charcoal-tweed",
    "botanical-print",
    "blush-damask",
    "navy-moire",
  ],
  shapes: ["drum", "empire", "oval", "rectangular", "coolie", "square"],
  lifestyle: ["atelier", "botanical", "customer-home", "hero"],
};

for (const [folder, list] of Object.entries(names)) {
  const dir = path.join(root, folder);
  fs.mkdirSync(dir, { recursive: true });
  list.forEach((name, i) => {
    const palette = colors[folder] || colors.products;
    const bg = palette[i % palette.length];
    fs.writeFileSync(path.join(dir, `${name}.svg`), svg(name.replace(/-/g, " "), bg));
  });
}

console.log("demo assets written");
