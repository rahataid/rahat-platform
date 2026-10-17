// rahat-platform/apps/rahat/src/notification/utils/push.util.ts  (NEW)
export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Exponential backoff with jitter: ~base * 2^attempt, capped. */
export function backoffDelay(attempt: number, baseMs = 500, maxMs = 15000): number {
    const exp = Math.min(maxMs, baseMs * 2 ** attempt);
    return Math.round(exp / 2 + Math.random() * (exp / 2));
}

export function chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

/** Runs fn over items with at most `limit` in flight (no extra dependency needed). */
export async function mapWithConcurrency<T, R>(
    items: T[],
    limit: number,
    fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
    const results = new Array<R>(items.length);
    let next = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (true) {
            const i = next++;
            if (i >= items.length) return;
            results[i] = await fn(items[i], i);
        }
    });
    await Promise.all(workers);
    return results;
}