#!/usr/bin/env node
import { createServer } from "node:http";
import { isAddress } from "viem";
import { grindSalt, predictTokenAddress, readLauncherImpls } from "./lib/grind.mjs";

const PORT = Number(process.env.VANITY_PORT ?? 8787);
const LAUNCHER = process.env.LAUNCHER_ADDRESS;
const CHAIN_ID = Number(process.env.CHAIN_ID ?? "84532");

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function resolveLauncher(body) {
  const launcher = body.launcher ?? LAUNCHER;
  if (!launcher || !isAddress(launcher)) {
    throw new Error("LAUNCHER_ADDRESS_MISSING");
  }
  const chainId = body.chainId ?? CHAIN_ID;
  const { tokenImplementation } = await readLauncherImpls(launcher, chainId);
  return { launcher, chainId, tokenImplementation };
}

const server = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    return json(res, 200, { ok: true });
  }

  if (req.method === "POST" && req.url === "/salt") {
    let body = {};
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
    } catch {
      return json(res, 400, { error: "INVALID_JSON" });
    }

    try {
      const { launcher, tokenImplementation } = await resolveLauncher(body);
      const started = Date.now();
      const { salt, predictedAddress, attempts } = grindSalt(launcher, tokenImplementation, {
        onProgress: (n) => console.log(`[vanity] ${n} attempts…`),
      });
      console.log(
        `[vanity] found salt in ${attempts} attempts (${Date.now() - started}ms) → ${predictedAddress}`
      );
      return json(res, 200, { salt, predictedAddress, attempts: attempts.toString() });
    } catch (e) {
      const message = e instanceof Error ? e.message : "VANITY_FAILED";
      return json(res, 503, { error: message });
    }
  }

  if (req.method === "GET" && req.url?.startsWith("/predict")) {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const salt = url.searchParams.get("salt");
    const launcherParam = url.searchParams.get("launcher") ?? LAUNCHER;
    if (!salt || !launcherParam || !isAddress(launcherParam)) {
      return json(res, 400, { error: "INVALID_PARAMS" });
    }
    try {
      const { launcher, tokenImplementation } = await resolveLauncher({
        launcher: launcherParam,
        chainId: Number(url.searchParams.get("chainId") ?? CHAIN_ID),
      });
      const predictedAddress = predictTokenAddress(launcher, tokenImplementation, salt);
      return json(res, 200, { predictedAddress });
    } catch (e) {
      const message = e instanceof Error ? e.message : "PREDICT_FAILED";
      return json(res, 503, { error: message });
    }
  }

  json(res, 404, { error: "NOT_FOUND" });
});

server.listen(PORT, () => {
  console.log(`[vanity] listening on http://localhost:${PORT}`);
  if (LAUNCHER) console.log(`[vanity] default launcher ${LAUNCHER}`);
});
