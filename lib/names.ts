// v1 name index: local JSON file mapping name -> mint.
// v2 moves this on-chain (PDA registry or SNS-style domain), see README.

import { promises as fs } from "fs";
import path from "path";
import { NAME_RE } from "./card";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "names.json");

type Index = Record<string, { mint: string; owner: string; ts: number }>;

async function load(): Promise<Index> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return {};
  }
}

async function save(idx: Index) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(idx, null, 2));
}

export async function lookupName(name: string) {
  const idx = await load();
  return idx[name.toLowerCase()] ?? null;
}

export async function claimName(
  name: string,
  mint: string,
  owner: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = name.toLowerCase();
  if (!NAME_RE.test(key)) return { ok: false, error: "invalid name" };
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint))
    return { ok: false, error: "invalid mint" };
  const idx = await load();
  if (idx[key] && idx[key].mint !== mint)
    return { ok: false, error: "name already taken" };
  idx[key] = { mint, owner, ts: Date.now() };
  await save(idx);
  return { ok: true };
}
