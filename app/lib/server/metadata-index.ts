import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { TokenMetadata } from "@/lib/types";

export interface MetadataIndexEntry extends TokenMetadata {
  ipfsHash?: string;
  uri?: string;
}

type IndexFile = Record<string, MetadataIndexEntry>;

function indexPath() {
  return path.join(process.cwd(), "..", "deployments", "metadata-index.json");
}

function readIndex(): IndexFile {
  const file = indexPath();
  if (!existsSync(file)) return {};
  try {
    return JSON.parse(readFileSync(file, "utf8")) as IndexFile;
  } catch {
    return {};
  }
}

export function getMetadataByHash(metadataHash: string): MetadataIndexEntry | null {
  const key = metadataHash.toLowerCase();
  const fromIndex = readIndex()[key];
  if (fromIndex) return fromIndex;

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

export function saveMetadataByHash(metadataHash: string, entry: MetadataIndexEntry) {
  const file = indexPath();
  const dir = path.dirname(file);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const index = readIndex();
  index[metadataHash.toLowerCase()] = entry;
  writeFileSync(file, JSON.stringify(index, null, 2), "utf8");
}
