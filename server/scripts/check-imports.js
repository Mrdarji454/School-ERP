import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.filter(e => !["node_modules", "scripts", "tests", ".test-data", ".reportcard-venv"].includes(e.name)).map(e => e.isDirectory() ? walk(path.join(dir, e.name)) : path.join(dir, e.name)))).flat();
}
const files = (await walk(root)).filter(p => p.endsWith(".js") && path.basename(p) !== "server.js");
for (const file of files) {
  const source = await fs.readFile(file, "utf8");
  for (const match of source.matchAll(/(?:from\s*|import\s*)["'](\.[^"']+)["']/g)) {
    const target = path.resolve(path.dirname(file), match[1]);
    if (!target.endsWith(".js")) throw new Error(`Missing extension: ${file}: ${match[1]}`);
    let dir = root;
    for (const component of path.relative(root, target).split(path.sep)) {
      if (!(await fs.readdir(dir)).includes(component)) throw new Error(`Missing or incorrectly cased import: ${file}: ${match[1]}`);
      dir = path.join(dir, component);
    }
  }
  await import(pathToFileURL(file));
}
console.log(`Verified ${files.length} backend modules and exact-case relative imports`);
