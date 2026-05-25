"use client";

import { useCallback, useEffect, useState } from "react";
import { JsonRpcProvider } from "ethers";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Interface, type ContractTransactionReceipt } from "ethers";
import { contracts, getConfigError, CHAIN_ID, rpcUrl } from "@/lib/config";
import { launcherAbi } from "@/lib/abis";
import { getContract } from "@/lib/ethers/contract";
import { getPublicClient } from "@/lib/client/public-client";
import { useWallet } from "@/providers/WalletProvider";
import { FEES } from "@/lib/protocol";
import { formatEth } from "@/lib/utils";
import { formatMarketProposition } from "@/lib/market-utils";
import { withTimeout } from "@/lib/async";
import { grindBa5eSaltAvailable, validateSaltAvailable } from "@/lib/vanity/ba5e";
import { SetupBlock } from "@/components/ui/State";

type LaunchStep = "idle" | "salt" | "metadata" | "wallet" | "confirming";

function formatLaunchError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes("USER_REJECTED") || msg.includes("user rejected") || msg.includes("ACTION_REJECTED")) {
      return "Transaction rejected";
    }
    if (msg.includes("insufficient funds")) {
      return "Insufficient ETH for deploy fee + gas";
    }
    if (msg.includes("Create2Failed")) {
      return "Address already taken — generating a new salt, please try again";
    }
    if (msg.includes("SuffixMismatch")) {
      return "Invalid token address suffix — please retry";
    }
    if (msg.includes("DeployFee")) {
      return "Incorrect deploy fee amount";
    }
    if (/METADATA|PINATA|NAME_SYMBOL|IMAGE_|RATE_LIMITED/i.test(msg)) {
      return msg.length > 120 ? `${msg.slice(0, 120)}…` : msg;
    }
    if (/Reentrancy|estimateGas|CALL_EXCEPTION/i.test(msg)) {
      return "Launch simulation failed — check fee and try again";
    }
    return "Launch failed — please try again";
  }
  return "Launch failed";
}

function getLaunchPublicClient() {
  return getPublicClient();
}

export function LaunchForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { address, getSigner } = useWallet();
  const configError = getConfigError();

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [about, setAbout] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [website, setWebsite] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [burnPolyfun, setBurnPolyfun] = useState(false);
  const [salt, setSalt] = useState<string | null>(null);
  const [vanityError, setVanityError] = useState<string | null>(null);
  const [creationFee, setCreationFee] = useState<bigint | null>(null);
  const [pending, setPending] = useState(false);
  const [launchStep, setLaunchStep] = useState<LaunchStep>("idle");
  const [launchError, setLaunchError] = useState<string | null>(null);

  useEffect(() => {
    if (!contracts.launcher) return;
    const provider = new JsonRpcProvider(rpcUrl, CHAIN_ID);
    const contract = getContract(contracts.launcher, launcherAbi, provider);
    contract.quoteCreationFee(burnPolyfun).then(setCreationFee).catch(() => setCreationFee(FEES.deployWei));
  }, [burnPolyfun]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const grindSaltForUser = useCallback(async () => {
    if (!address || !contracts.launcher) return null;
    const client = getLaunchPublicClient();
    const readContract = getContract(contracts.launcher, launcherAbi, new JsonRpcProvider(rpcUrl, CHAIN_ID));
    const [tokenImplementation, marketImplementation] = await Promise.all([
      withTimeout(readContract.tokenImplementation(), 15_000, "Launcher RPC timeout") as Promise<`0x${string}`>,
      withTimeout(readContract.marketImplementation(), 15_000, "Launcher RPC timeout") as Promise<`0x${string}`>,
    ]);
    return grindBa5eSaltAvailable(
      client,
      contracts.launcher,
      address as `0x${string}`,
      tokenImplementation,
      marketImplementation
    );
  }, [address]);

  useEffect(() => {
    setSalt(null);
    setVanityError(null);
  }, [address]);

  useEffect(() => {
    if (!address || salt || !contracts.launcher) return;
    let cancelled = false;
    grindSaltForUser()
      .then((result) => {
        if (cancelled || !result) return;
        setSalt(result.rawSalt);
      })
      .catch(() => {
        if (!cancelled) setVanityError("Could not generate token address");
      });
    return () => {
      cancelled = true;
    };
  }, [address, salt, grindSaltForUser]);

  const onImageChange = (file: File | null) => {
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleLaunch = async () => {
    if (!address) {
      setLaunchError("Connect wallet first");
      return;
    }
    if (!name.trim() || !symbol.trim()) {
      setLaunchError("Name and symbol required");
      return;
    }
    if (!contracts.launcher) {
      setLaunchError("Launcher not configured");
      return;
    }

    setPending(true);
    setLaunchError(null);
    setLaunchStep("salt");

    let launchSalt = salt;
    try {
      const activeSigner = await withTimeout(getSigner(), 15_000, "Wallet timeout");

      if (!launchSalt) {
        const result = await grindSaltForUser();
        if (!result) throw new Error("Salt generation failed");
        launchSalt = result.rawSalt;
        setSalt(result.rawSalt);
      } else {
        const client = getLaunchPublicClient();
        const readContract = getContract(
          contracts.launcher,
          launcherAbi,
          new JsonRpcProvider(rpcUrl, CHAIN_ID)
        );
        const [tokenImplementation, marketImplementation] = await Promise.all([
          readContract.tokenImplementation() as Promise<`0x${string}`>,
          readContract.marketImplementation() as Promise<`0x${string}`>,
        ]);
        const check = await validateSaltAvailable(
          client,
          contracts.launcher,
          address as `0x${string}`,
          tokenImplementation,
          marketImplementation,
          launchSalt as `0x${string}`
        );
        if (!check.ok) {
          const result = await grindSaltForUser();
          if (!result) throw new Error("Salt generation failed");
          launchSalt = result.rawSalt;
          setSalt(result.rawSalt);
        }
      }

      setLaunchStep("metadata");
      const marketProposition = formatMarketProposition(symbol.trim());
      const form = new FormData();
      form.append("name", name.trim());
      form.append("symbol", symbol.trim().toUpperCase());
      form.append("proposition", marketProposition);
      form.append("description", about.trim() || marketProposition);
      if (twitter.trim()) form.append("twitter", twitter.trim());
      if (telegram.trim()) form.append("telegram", telegram.trim());
      if (website.trim()) form.append("website", website.trim());
      if (imageFile) form.append("image", imageFile);

      const metaRes = await withTimeout(
        fetch("/api/metadata", { method: "POST", body: form }),
        45_000,
        "Metadata upload timeout"
      );
      const meta = await metaRes.json();
      if (!metaRes.ok) throw new Error(meta.error ?? "METADATA_FAILED");

      setLaunchStep("wallet");
      const fee = creationFee ?? FEES.deployWei;
      const params = {
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        metadataHash: meta.metadataHash as `0x${string}`,
        initialLiquidity: 0n,
        burnPolyfun,
      };

      await getLaunchPublicClient().simulateContract({
        address: contracts.launcher,
        abi: launcherAbi,
        functionName: "createLaunch",
        args: [params, launchSalt as `0x${string}`],
        account: address as `0x${string}`,
        value: fee,
      });

      const contract = getContract(contracts.launcher, launcherAbi, activeSigner);
      const tx = await withTimeout(
        contract.createLaunch(params, launchSalt, { value: fee }),
        120_000,
        "Confirm transaction in wallet"
      );

      setLaunchStep("confirming");
      const receipt = await withTimeout(
        tx.wait() as Promise<ContractTransactionReceipt | null>,
        180_000,
        "Transaction confirmation timeout"
      );

      let marketAddress: string | undefined;
      if (receipt && contracts.launcher) {
        const iface = new Interface(launcherAbi);
        for (const log of receipt.logs ?? []) {
          if (log.address.toLowerCase() !== contracts.launcher.toLowerCase()) continue;
          try {
            const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
            if (parsed?.name === "LaunchCreated") {
              marketAddress = parsed.args.market as string;
              break;
            }
          } catch {
            /* ignore unrelated logs */
          }
        }
      }

      await fetch("/api/markets?fresh=1");
      await queryClient.invalidateQueries({ queryKey: ["markets"] });

      router.push(marketAddress ? `/markets?market=${marketAddress}&side=yes` : "/markets");
      router.refresh();
    } catch (e) {
      setLaunchError(formatLaunchError(e));
    } finally {
      setPending(false);
      setLaunchStep("idle");
    }
  };

  if (configError) {
    return (
      <div className="py-12">
        <SetupBlock />
      </div>
    );
  }

  return (
    <div className="w-full pb-10">
      <form
        className="space-y-10"
        onSubmit={(e) => {
          e.preventDefault();
          void handleLaunch();
        }}
      >
        <Field label="Image">
          <label className="group relative flex h-40 w-full cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-zinc-300 bg-zinc-50 transition-colors hover:border-zinc-400">
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePreview} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <span className="text-sm text-zinc-500">+ Upload image</span>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => onImageChange(e.target.files?.[0] ?? null)}
              className="sr-only"
            />
          </label>
        </Field>

        <Field label="Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Polyfun"
            required
          />
        </Field>

        <Field label="Symbol">
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            maxLength={8}
            className={inputClass}
            placeholder="POLY"
            required
          />
          {symbol.trim() ? (
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">
              {formatMarketProposition(symbol)}
            </p>
          ) : null}
        </Field>

        <Field label="About (optional)">
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
            placeholder="Extra context for your market page"
          />
        </Field>

        <Field label="Social (optional)">
          <div className="space-y-6">
            <input
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              className={inputClass}
              placeholder="X / Twitter"
            />
            <input
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              className={inputClass}
              placeholder="Telegram"
            />
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className={inputClass}
              placeholder="Website"
            />
          </div>
        </Field>


        {vanityError ? <p className="text-xs text-zinc-600">{vanityError}</p> : null}

        <div className="flex items-center justify-between border-b border-zinc-200 pb-3 text-sm">
          <span className="text-zinc-500">Deploy fee</span>
          <span className="font-semibold tabular-nums text-zinc-950">
            {formatEth(creationFee ?? FEES.deployWei)}
          </span>
        </div>

        {launchError ? <p className="text-center text-xs text-zinc-600">{launchError}</p> : null}

        <button
          type="submit"
          disabled={pending || !address}
          className="btn-accent h-11 w-full rounded-md text-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? (launchStep === "wallet" ? "Confirm in wallet" : "Creating…") : address ? "Create" : "Connect wallet"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-3 block text-xs font-medium tracking-wide text-zinc-500">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-950/5";
