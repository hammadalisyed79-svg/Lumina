import EmbeddedPostgres from "embedded-postgres";
import fs from "fs";
import path from "path";

const dir = path.join(process.cwd(), "data", "pg");
const port = Number(process.env.PG_PORT || 55432);

async function main() {
  const pg = new EmbeddedPostgres({
    databaseDir: dir,
    user: "lumina",
    password: "lumina_dev_password",
    port,
    persistent: true,
  });
  if (!fs.existsSync(path.join(dir, "PG_VERSION"))) {
    console.log("Initialising embedded Postgres…");
    await pg.initialise();
  }
  await pg.start();
  try {
    await pg.createDatabase("lumina");
  } catch {
    /* exists */
  }
  console.log(`Embedded Postgres ready on port ${port}`);
  console.log(`DATABASE_URL=postgresql://lumina:lumina_dev_password@127.0.0.1:${port}/lumina?schema=public`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
