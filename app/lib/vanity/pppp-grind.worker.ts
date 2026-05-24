import { getCreate2Address, pad, toHex, type Address, type Hash } from "viem";
import { hasPpppSuffix } from "./pppp";

export type GrindWorkerRequest = {
  deployer: Address;
  bytecodeHash: Hash;
  workerId: number;
  workerCount: number;
};

export type GrindWorkerResponse =
  | { type: "found"; salt: Hash; predictedAddress: Address; attempts: string }
  | { type: "progress"; attempts: string };

self.onmessage = (event: MessageEvent<GrindWorkerRequest>) => {
  const { deployer, bytecodeHash, workerId, workerCount } = event.data;

  for (let i = BigInt(workerId); ; i += BigInt(workerCount)) {
    const salt = pad(toHex(i), { size: 32 });
    const predicted = getCreate2Address({
      from: deployer,
      salt,
      bytecodeHash,
    });

    if (hasPpppSuffix(predicted)) {
      const msg: GrindWorkerResponse = {
        type: "found",
        salt,
        predictedAddress: predicted,
        attempts: i.toString(),
      };
      self.postMessage(msg);
      return;
    }

    if (i % 100_000n === 0n) {
      const msg: GrindWorkerResponse = {
        type: "progress",
        attempts: i.toString(),
      };
      self.postMessage(msg);
    }
  }
};
