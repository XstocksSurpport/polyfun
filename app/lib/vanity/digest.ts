/** Runtime-decoded EIP-1167 clone fragments (not stored as plain hex in bundle). */
function decodeHexFragment(b64: string): `0x${string}` {
  if (typeof Buffer !== "undefined") {
    return `0x${Buffer.from(b64, "base64").toString("hex")}` as `0x${string}`;
  }
  const bin = atob(b64);
  let hex = "";
  for (let i = 0; i < bin.length; i++) {
    hex += bin.charCodeAt(i).toString(16).padStart(2, "0");
  }
  return `0x${hex}` as `0x${string}`;
}

export const CLONE_PREFIX = decodeHexFragment("PWAtgGAKPTmB8zY9PTc9PT02PXM=");
export const CLONE_SUFFIX = decodeHexFragment("WvQ9goA+kD2RYCtX/Vvz");
