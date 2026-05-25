import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { TokenMetadata } from "@/lib/types";

export interface MetadataIndexEntry extends TokenMetadata {
  ipfsHash?: string;
  uri?: string;
}

type IndexFile = Record<string, MetadataIndexEntry>;

const memoryIndex = new Map<string, MetadataIndexEntry>();

function deploymentsIndexPath() {
  return path.join(process.cwd(), "..", "deployments", "metadata-index.json");
}

function tmpIndexPath() {
  return path.join(os.tmpdir(), "polyfun-metadata-index.json");
}

function readIndexFile(file: string): IndexFile {
  if (!existsSync(file)) return {};
  try {
    return JSON.parse(readFileSync(file, "utf8")) as IndexFile;
  } catch {
    return {};
  }
}

function writeIndexFile(file: string, index: IndexFile): boolean {
  try {
    const dir = path.dirname(file);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(file, JSON.stringify(index, null, 2), "utf8");
    return true;
  } catch {
    return false;
  }
}

function persistIndex(index: IndexFile) {
  writeIndexFile(deploymentsIndexPath(), index) || writeIndexFile(tmpIndexPath(), index);
}

export function getMetadataByHash(metadataHash: string): MetadataIndexEntry | null {
  const key = metadataHash.toLowerCase();
  const fromMemory = memoryIndex.get(key);
  if (fromMemory) return fromMemory;

  for (const file of [deploymentsIndexPath(), tmpIndexPath()]) {
    const fromIndex = readIndexFile(file)[key];
    if (fromIndex) {
      memoryIndex.set(key, fromIndex);
      return fromIndex;
    }
  }

  const genesisPath = path.join(process.cwd(), "..", "deployments", "genesis-metadata.json");
  if (existsSync(genesisPath)) {
    try {
      const genesis = JSON.parse(readFileSync(genesisPath, "utf8")) as MetadataIndexEntry & {
        metadataHash?: string;
      };
      if (genesis.metadataHash?.toLowerCase() === key) {
        return genesis;
      }
    } catch {
      // ignore
    }
  }

  return null;
}

/** Never throws — Vercel serverless FS is read-only outside /tmp. */
export function saveMetadataByHash(metadataHash: string, entry: MetadataIndexEntry) {
  const key = metadataHash.toLowerCase();
  memoryIndex.set(key, entry);

  const deploymentsFile = deploymentsIndexPath();
  const index = { ...readIndexFile(deploymentsFile), ...readIndexFile(tmpIndexPath()), [key]: entry };
  persistIndex(index);
}
