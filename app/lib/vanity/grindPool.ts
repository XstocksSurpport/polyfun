import type { Address, Hash } from "viem";
import { defaultWorkerCount } from "./pppp";
import type { GrindWorkerRequest, GrindWorkerResponse } from "./pppp-grind.worker";

export type GrindResult = {
  salt: Hash;
  predictedAddress: Address;
  attempts: bigint;
  elapsedMs: number;
};

export function grindPpppInBrowser(
  deployer: Address,
  bytecodeHash: Hash,
  onProgress?: (attempts: bigint) => void
): Promise<GrindResult> {
  const workerCount = defaultWorkerCount();
  const started = performance.now();

  return new Promise((resolve, reject) => {
    let settled = false;
    const workers: Worker[] = [];

    const cleanup = () => {
      for (const w of workers) w.terminate();
    };

    for (let workerId = 0; workerId < workerCount; workerId++) {
      const worker = new Worker(new URL("./pppp-grind.worker.ts", import.meta.url));
      workers.push(worker);

      worker.onmessage = (event: MessageEvent<GrindWorkerResponse>) => {
        const data = event.data;
        if (data.type === "progress") {
          onProgress?.(BigInt(data.attempts));
          return;
        }
        if (settled) return;
        settled = true;
        cleanup();
        resolve({
          salt: data.salt,
          predictedAddress: data.predictedAddress,
          attempts: BigInt(data.attempts),
          elapsedMs: performance.now() - started,
        });
      };

      worker.onerror = (err) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(err.error ?? new Error("Worker failed"));
      };

      const msg: GrindWorkerRequest = {
        deployer,
        bytecodeHash,
        workerId,
        workerCount,
      };
      worker.postMessage(msg);
    }
  });
}
