// solcard-registry client: on-chain name registry (devnet).
// Program id + RPC come from env so mainnet later is a config change.

import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";

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
  const info = await conn.getAccountInfo(namePda(name));
  if (!info) return null;
  return decodeNameRecord(info.data);
}

// Config PDA layout (72 bytes): admin (32), fee_wallet (32), fee_lamports u64 LE (8).
export async function fetchConfig(
  conn: Connection
): Promise<RegistryConfig | null> {
  const info = await conn.getAccountInfo(configPda());
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

export function shortKey(pk: string) {
  return pk.length > 12 ? `${pk.slice(0, 4)}..${pk.slice(-4)}` : pk;
}
