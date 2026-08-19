import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const dbPath = "./dev.db";
const backupsDir = "./backups";

if (!existsSync(dbPath)) {
  console.log("Nenhum dev.db encontrado, nada para backup.");
  process.exit(0);
}

mkdirSync(backupsDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupPath = join(backupsDir, `dev-${timestamp}.db`);

copyFileSync(dbPath, backupPath);
console.log(`Backup salvo em ${backupPath}`);
