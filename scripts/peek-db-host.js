const fs = require("fs");
const e = fs.readFileSync(".env", "utf8");
const m = e.match(/DATABASE_URL=["']?([^\r\n"']+)/);
if (!m) {
  console.log("no DATABASE_URL");
  process.exit(0);
}
try {
  const u = new URL(m[1]);
  console.log("db host:", u.hostname);
  console.log("db port:", u.port || "5432");
  console.log("db name:", u.pathname);
} catch (err) {
  console.log("parse fail:", err.message);
}
