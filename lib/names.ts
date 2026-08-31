// Name index: on-chain registry (solcard-registry program) is the source
// of truth. data/names.json is kept as a read-only fallback during the
// migration window for names claimed before the program existed.

import { promises as fs } from "fs";
import path from "path";
import { PublicKey } from "@solana/web3.js";
import {
  getConnection,
  fetchNameRecord,
  fetchNamesByOwner,
  primeNameCache,
  OwnedName,
} from "./registry";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "names.json");

type Index = Record<string, { mint: string; owner: string; ts: number }>;

async function loadJsonFallback(): Promise<Index> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return {};
  }
}

export type NameEntry = {
  mint: string;
  owner: string;
  ts: number;
  onChain: boolean;
  listingState: number;
  listingPrice: number;
};

export async function lookupName(name: string): Promise<NameEntry | null> {
  const key = name.toLowerCase();
  try {
    const rec = await fetchNameRecord(getConnection(), key);
    if (rec) {
      primeNameCache(key);
      return {
        mint: rec.mint,
        owner: rec.owner,
        ts: rec.ts,
        onChain: true,
        listingState: rec.listingState,
        listingPrice: rec.listingPrice,
      };
    }
  } catch {
    // RPC hiccup: fall through to json fallback
  }
  const idx = await loadJsonFallback();
  const entry = idx[key];
  return entry
    ? { ...entry, onChain: false, listingState: 0, listingPrice: 0 }
    : null;
}

// All chaincards owned by a wallet. On-chain registry first; the json
// fallback covers pre-program names during the migration window.
export async function lookupByOwner(wallet: string): Promise<OwnedName[]> {
  let owner: PublicKey;
  try {
    owner = new PublicKey(wallet);
  } catch {
    return [];
  }
  try {
    const found = await fetchNamesByOwner(getConnection(), owner);
    if (found.length > 0) return found;
  } catch {
    // RPC hiccup: fall through to json fallback
  }
  const idx = await loadJsonFallback();
  const key = owner.toBase58();
  return Object.entries(idx)
    .filter(([, v]) => v.owner === key)
    .map(([name, v]) => ({
      name,
      owner: v.owner,
      mint: v.mint,
      ts: v.ts,
      listingState: 0,
      listingPrice: 0,
    }));
}
