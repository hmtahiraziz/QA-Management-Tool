import dns from "node:dns";
import dnsPromises from "node:dns/promises";

/**
 * Windows/Node often fails transiently resolving api.airtable.com
 * (ENOTFOUND / EAI_AGAIN) even when the system DNS works.
 */
dns.setDefaultResultOrder("ipv4first");

const preferredServers = ["8.8.8.8", "1.1.1.1", "9.9.9.9", "192.168.1.1"];

try {
  const current = dns.getServers();
  dns.setServers([...new Set([...preferredServers, ...current])]);
} catch {
  dns.setServers(preferredServers);
}

let warmPromise: Promise<void> | null = null;

export async function warmAirtableDns() {
  if (!warmPromise) {
    warmPromise = (async () => {
      try {
        await dnsPromises.lookup("api.airtable.com", { family: 4 });
      } catch {
        // Force public resolvers, then retry once.
        dns.setServers(preferredServers);
        await dnsPromises.lookup("api.airtable.com", { family: 4 });
      }
    })().catch(() => {
      warmPromise = null;
    });
  }
  await warmPromise;
}

export function isTransientNetworkError(err: unknown) {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; errno?: string; message?: string };
  const code = String(e.code || e.errno || "");
  const message = String(e.message || "");
  return (
    code === "EAI_AGAIN" ||
    code === "ENOTFOUND" ||
    code === "ETIMEDOUT" ||
    code === "ECONNRESET" ||
    code === "ECONNREFUSED" ||
    /EAI_AGAIN|ENOTFOUND|ETIMEDOUT|ECONNRESET|getaddrinfo/i.test(message)
  );
}

export async function withNetworkRetry<T>(
  operation: () => Promise<T>,
  attempts = 4,
): Promise<T> {
  await warmAirtableDns();

  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransientNetworkError(error) || attempt === attempts) {
        throw error;
      }
      // Reset warm cache and wait briefly before retrying.
      warmPromise = null;
      await warmAirtableDns().catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    }
  }
  throw lastError;
}
