// solcard-registry client: on-chain name registry (devnet).
// Program id + RPC come from env so mainnet later is a config change.

import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { withRetry429 } from "./rpc";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_REGISTRY_PROGRAM_ID ||
    "4SpRPoj6MV6o2g6yYBuJwdE8kvxZ83gxEoLfwDYAnNsw"
);

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";

export function getConnection() {
  return new Connection(RPC_URL, "confirmed");
}

export function namePda(name: string): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("name"), Buffer.from(name.toLowerCase())],
    PROGRAM_ID
  )[0];
}

export function configPda(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    PROGRAM_ID
  )[0];
}

export type NameRecord = {
  owner: string;
  mint: string;
  ts: number; // ms
  listingState: number;
  listingPrice: number; // lamports
};

export type RegistryConfig = {
  admin: string;
  feeWallet: string;
  feeLamports: number;
};

// Name PDA layout (113 bytes):
// owner (32), mint (32), created_at i64 LE (8), listing_state u8 (1),
// listing_price u64 LE (8), reserved (32).
export function decodeNameRecord(data: Uint8Array): NameRecord | null {
  if (data.length < 113) return null;
  const buf = Buffer.from(data);
  return {
    owner: new PublicKey(buf.subarray(0, 32)).toBase58(),
    mint: new PublicKey(buf.subarray(32, 64)).toBase58(),
    ts: Number(buf.readBigInt64LE(64)) * 1000,
    listingState: buf.readUInt8(72),
    listingPrice: Number(buf.readBigUInt64LE(73)),
  };
}

export async function fetchNameRecord(
  conn: Connection,
  name: string
): Promise<NameRecord | null> {
  const info = await withRetry429(() => conn.getAccountInfo(namePda(name)));
  if (!info) return null;
  return decodeNameRecord(info.data);
}

// Config PDA layout (72 bytes): admin (32), fee_wallet (32), fee_lamports u64 LE (8).
export async function fetchConfig(
  conn: Connection
): Promise<RegistryConfig | null> {
  const info = await withRetry429(() => conn.getAccountInfo(configPda()));
  if (!info || info.data.length < 72) return null;
  const buf = Buffer.from(info.data);
  return {
    admin: new PublicKey(buf.subarray(0, 32)).toBase58(),
    feeWallet: new PublicKey(buf.subarray(32, 64)).toBase58(),
    feeLamports: Number(buf.readBigUInt64LE(64)),
  };
}

function encString(s: string) {
  const b = Buffer.from(s);
  const l = Buffer.alloc(4);
  l.writeUInt32LE(b.length, 0);
  return Buffer.concat([l, b]);
}

// Claim instruction (tag 1): payer becomes owner, fee goes to feeWallet.
export function claimIx(
  payer: PublicKey,
  name: string,
  mint: PublicKey,
  feeWallet: PublicKey
): TransactionInstruction {
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: configPda(), isSigner: false, isWritable: false },
      { pubkey: feeWallet, isSigner: false, isWritable: true },
      { pubkey: namePda(name), isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([
      Buffer.from([1]),
      encString(name.toLowerCase()),
      mint.toBuffer(),
    ]),
  });
}

// UpdateMint instruction (tag 2): owner re-points their name PDA's mint
// field to a new inscription mint. No fee, owner must sign.
// Borsh layout: [2 (u8 tag)] + [name len u32 LE + name utf8 bytes] + [new_mint 32 bytes].
export function updateMintIx(
  owner: PublicKey,
  name: string,
  newMint: PublicKey
): TransactionInstruction {
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: owner, isSigner: true, isWritable: false },
      { pubkey: namePda(name), isSigner: false, isWritable: true },
    ],
    data: Buffer.concat([
      Buffer.from([2]),
      encString(name.toLowerCase()),
      newMint.toBuffer(),
    ]),
  });
}

function encU64(n: bigint | number) {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(BigInt(n));
  return b;
}

// ListName (tag 6): owner lists their name for sale, price in lamports.
export function listIx(
  owner: PublicKey,
  name: string,
  priceLamports: number | bigint
): TransactionInstruction {
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: owner, isSigner: true, isWritable: false },
      { pubkey: namePda(name), isSigner: false, isWritable: true },
    ],
    data: Buffer.concat([
      Buffer.from([6]),
      encString(name.toLowerCase()),
      encU64(priceLamports),
    ]),
  });
}

// DelistName (tag 7): owner cancels a listing.
export function delistIx(
  owner: PublicKey,
  name: string
): TransactionInstruction {
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: owner, isSigner: true, isWritable: false },
      { pubkey: namePda(name), isSigner: false, isWritable: true },
    ],
    data: Buffer.concat([Buffer.from([7]), encString(name.toLowerCase())]),
  });
}

// BuyName (tag 8): buyer purchases a listed name. expectedPrice must equal
// the on-chain listing_price (front-run protection).
export function buyIx(
  buyer: PublicKey,
  name: string,
  expectedPriceLamports: number | bigint,
  seller: PublicKey,
  feeWallet: PublicKey
): TransactionInstruction {
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: buyer, isSigner: true, isWritable: true },
      { pubkey: configPda(), isSigner: false, isWritable: false },
      { pubkey: feeWallet, isSigner: false, isWritable: true },
      { pubkey: seller, isSigner: false, isWritable: true },
      { pubkey: namePda(name), isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([
      Buffer.from([8]),
      encString(name.toLowerCase()),
      encU64(expectedPriceLamports),
    ]),
  });
}

export type Listing = {
  name: string;
  owner: string;
  mint: string;
  priceLamports: number;
  ts: number;
};

// All currently listed names: getProgramAccounts on 113-byte name PDAs with
// listing_state == 1 at offset 72. The PDA data does not store the name
// (only the seeds do), so each listed PDA's name is recovered from the
// ListName instruction data in its recent transaction history, then
// verified by re-deriving the PDA from the candidate name.
export async function fetchListings(conn: Connection): Promise<Listing[]> {
  const accounts = await withRetry429(() =>
    conn.getProgramAccounts(PROGRAM_ID, {
      filters: [
        { dataSize: 113 },
        { memcmp: { offset: 72, bytes: "2" } }, // base58(0x01) = "2"
      ],
    })
  );
  const out: Listing[] = [];
  for (const { pubkey, account } of accounts) {
    const rec = decodeNameRecord(account.data);
    if (!rec || rec.listingState !== 1) continue;
    const name = await resolveNameFromHistory(conn, pubkey);
    if (!name) continue;
    out.push({
      name,
      owner: rec.owner,
      mint: rec.mint,
      priceLamports: rec.listingPrice,
      ts: rec.ts,
    });
  }
  return out;
}

export type OwnedName = {
  name: string;
  owner: string;
  mint: string;
  ts: number;
  listingState: number;
  listingPrice: number;
};

// All name PDAs owned by a wallet: memcmp on owner at offset 0 across the
// fixed-size (113 byte) name accounts, then recover each name from tx
// history (the PDA data does not store the name, only the seeds do).
export async function fetchNamesByOwner(
  conn: Connection,
  owner: PublicKey
): Promise<OwnedName[]> {
  const accounts = await withRetry429(() =>
    conn.getProgramAccounts(PROGRAM_ID, {
      filters: [
        { dataSize: 113 },
        { memcmp: { offset: 0, bytes: owner.toBase58() } },
      ],
    })
  );
  const out: OwnedName[] = [];
  for (const { pubkey, account } of accounts) {
    const rec = decodeNameRecord(account.data);
    if (!rec) continue;
    const name = await resolveNameFromHistory(conn, pubkey);
    if (!name) continue;
    out.push({
      name,
      owner: rec.owner,
      mint: rec.mint,
      ts: rec.ts,
      listingState: rec.listingState,
      listingPrice: rec.listingPrice,
    });
  }
  return out;
}

// Walk the PDA's recent signatures, find a registry instruction whose data
// carries the name string (tags 1 claim, 2 update, 6 list, 7 delist, 8 buy)
// and verify by re-deriving the PDA.
async function resolveNameFromHistory(
  conn: Connection,
  pda: PublicKey
): Promise<string | null> {
  const sigs = await withRetry429(() =>
    conn.getSignaturesForAddress(pda, { limit: 10 })
  );
  for (const s of sigs) {
    if (s.err) continue;
    const tx = await withRetry429(() =>
      conn.getTransaction(s.signature, {
        maxSupportedTransactionVersion: 0,
      })
    );
    if (!tx) continue;
    const msg = tx.transaction.message;
    const keys = msg.staticAccountKeys ?? (msg as any).accountKeys;
    const ixs = msg.compiledInstructions ?? (msg as any).instructions;
    for (const ix of ixs) {
      const pid = keys[ix.programIdIndex];
      if (!pid || !pid.equals(PROGRAM_ID)) continue;
      const data = Buffer.from(
        typeof ix.data === "string" ? bs58decode(ix.data) : ix.data
      );
      if (data.length < 5) continue;
      const tag = data[0];
      if (![1, 2, 6, 7, 8].includes(tag)) continue;
      const len = data.readUInt32LE(1);
      if (len === 0 || len > 64 || data.length < 5 + len) continue;
      const candidate = data.subarray(5, 5 + len).toString("utf8");
      if (/^[a-z0-9_-]+$/.test(candidate) && namePda(candidate).equals(pda))
        return candidate;
    }
  }
  return null;
}

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function bs58decode(s: string): Uint8Array {
  let n = 0n;
  for (const c of s) {
    const i = B58.indexOf(c);
    if (i === -1) throw new Error("bad base58");
    n = n * 58n + BigInt(i);
  }
  const bytes: number[] = [];
  while (n > 0n) {
    bytes.unshift(Number(n & 0xffn));
    n >>= 8n;
  }
  for (const c of s) {
    if (c === "1") bytes.unshift(0);
    else break;
  }
  return Uint8Array.from(bytes);
}

export function shortKey(pk: string) {
  return pk.length > 12 ? `${pk.slice(0, 4)}..${pk.slice(-4)}` : pk;
}
