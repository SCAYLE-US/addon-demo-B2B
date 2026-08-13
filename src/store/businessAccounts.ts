export const BUSINESS_ACCOUNTS_STORAGE_KEY = 'addon-demo-b2b:user-companies';

export type BusinessAccount = {
    id: number;
    name: string;
    address?: string;
    phone?: string;
};

export const generateBusinessAccountId = (existing: BusinessAccount[]): number => {
    const taken = new Set(existing.map((a) => a.id));
    // 5-digit id: 10000–99999. Retry on the (very unlikely) collision.
    for (let attempt = 0; attempt < 1000; attempt++) {
        const candidate = Math.floor(10000 + Math.random() * 90000);
        if (!taken.has(candidate)) return candidate;
    }
    // Fallback if the space is somehow exhausted.
    return Math.max(0, ...existing.map((a) => a.id)) + 1;
};

export const readBusinessAccounts = (): BusinessAccount[] => {
    try {
        const raw = localStorage.getItem(BUSINESS_ACCOUNTS_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        const result: BusinessAccount[] = [];
        for (const entry of parsed) {
            if (typeof entry === 'string') {
                if (!entry.trim()) continue;
                result.push({ id: generateBusinessAccountId(result), name: entry });
                continue;
            }
            if (entry && typeof entry === 'object') {
                const source = entry as Record<string, unknown>;
                const name = String(source.name ?? '').trim();
                if (!name) continue;
                const rawId = typeof source.id === 'number' ? source.id : Number(source.id);
                const id = Number.isFinite(rawId) && rawId > 0 ? rawId : generateBusinessAccountId(result);
                result.push({
                    id,
                    name,
                    address: typeof source.address === 'string' ? source.address : undefined,
                    phone: typeof source.phone === 'string' ? source.phone : undefined,
                });
            }
        }
        return result;
    } catch {
        return [];
    }
};

export const writeBusinessAccounts = (accounts: BusinessAccount[]) => {
    localStorage.setItem(BUSINESS_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
};
