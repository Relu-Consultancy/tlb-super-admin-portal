import { listTransactions, parseAmount, type ListTransactionsParams, type TransactionListItem } from '../../../shared/lib/api';

const PAGE_SIZE = 100;
const MAX_PAGES = 50; // safety cap (5,000 transactions) — avoids a runaway loop on "Till date" style ranges

/**
 * Fetch every transaction matching `params`, following pagination. Used to derive
 * per-vertical totals (revenue, ticket count, unique buyers) that the backend doesn't
 * aggregate directly — `getFinanceSummary()`/`getFinanceDashboard()` are platform-wide only.
 */
export async function fetchAllTransactions(params: ListTransactionsParams): Promise<TransactionListItem[]> {
  const all: TransactionListItem[] = [];
  let page = 1;
  while (page <= MAX_PAGES) {
    const res = await listTransactions({ ...params, page, page_size: PAGE_SIZE });
    const rows = res.results ?? [];
    all.push(...rows);
    if (all.length >= res.count || rows.length === 0) break;
    page += 1;
  }
  return all;
}

export function sumAmount(rows: TransactionListItem[]): number {
  return rows.reduce((total, r) => total + (parseAmount(r.amount) ?? 0), 0);
}

export function uniqueCustomerCount(rows: TransactionListItem[]): number {
  return new Set(rows.map((r) => r.customer_email).filter(Boolean)).size;
}
