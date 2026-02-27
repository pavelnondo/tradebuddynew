/**
 * Parser for MetaTrader 5 (MT4/MT5) broker report files.
 * Supports HTML and XML report formats.
 * Extracts deals and positions to pre-fill Add Trade form.
 */

export interface ParsedDeal {
  symbol: string;
  type: 'buy' | 'sell' | 'long' | 'short';
  quantity: number;
  entryPrice: number;
  exitPrice: number | null;
  pnl: number;
  entryTime: Date | null;
  exitTime: Date | null;
  stopLoss: number | null;
  takeProfit: number | null;
  comment: string | null;
  /** Raw row/deal index for display */
  dealId?: string;
}

function parseNum(v: unknown): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  let s = String(v).trim();
  // European format: 1.234,56 -> 1234.56
  if (/^\d{1,3}(\.\d{3})*,\d+$/.test(s)) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    s = s.replace(/,/g, '.');
  }
  s = s.replace(/[^\d.-]/g, '');
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

function parseDate(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}

function normType(s: string): 'buy' | 'sell' | 'long' | 'short' {
  const lower = String(s || '').toLowerCase();
  if (lower.includes('buy') || lower.includes('long') || lower === '0') return 'buy';
  if (lower.includes('sell') || lower.includes('short') || lower === '1') return 'sell';
  return 'buy';
}

/** Check if string looks like a trading symbol (e.g. EURUSD, AAPL, BTCUSD) */
function looksLikeSymbol(s: string): boolean {
  const t = s.replace(/[\s#]/g, '');
  return t.length >= 2 && t.length <= 20 && /^[A-Za-z0-9._-]+$/.test(t) && /[A-Za-z]/.test(t);
}

/** Parse volume - MT5 can use "0.1/1.0" (partial/total); use first part for closed amount */
function parseVolume(v: unknown): number | null {
  if (v == null || v === '') return null;
  const s = String(v).trim();
  const slash = s.indexOf('/');
  const part = slash >= 0 ? s.slice(0, slash).trim() : s;
  return parseNum(part);
}

function cleanHeader(h: string): string {
  return h.toLowerCase().replace(/\s+/g, ' ').replace(/\u00a0/g, ' ').trim();
}

function isLikelyPositionsHeader(headers: string[]): boolean {
  const h = headers.map(cleanHeader);
  const hasSymbol = h.some(v => /symbol|instrument|pair|asset|ticker/.test(v));
  const hasType = h.some(v => /(^|\s)(type|direction|action)(\s|$)/.test(v));
  const hasVolume = h.some(v => /volume|lots|size|quantity|vol/.test(v));
  const hasProfit = h.some(v => /profit|p\/l|pl|result/.test(v));
  const timeCount = h.filter(v => /time|date/.test(v)).length;
  const priceCount = h.filter(v => /price|rate|entry|exit/.test(v)).length;
  return hasSymbol && hasType && hasVolume && hasProfit && timeCount >= 1 && priceCount >= 1;
}

function parsePositionsRows(rows: string[][]): ParsedDeal[] {
  if (rows.length < 2) return [];
  const headers = rows[0].map(cleanHeader);

  const idxSymbol = headers.findIndex(v => /symbol|instrument|pair|asset|ticker/.test(v));
  const idxType = headers.findIndex(v => /(^|\s)(type|direction|action)(\s|$)/.test(v));
  const idxVolume = headers.findIndex(v => /volume|lots|size|quantity|vol/.test(v));
  const idxSl = headers.findIndex(v => /s\s*\/\s*l|stop loss|^sl$|stop\s*loss|stop/.test(v));
  const idxTp = headers.findIndex(v => /t\s*\/\s*p|take profit|^tp$|take\s*profit|target/.test(v));
  const idxProfit = headers.reduce((last, v, i) => (/profit|p\/l|pl|result/.test(v) ? i : last), -1);
  const timeIdxs = headers
    .map((v, i) => ({ v, i }))
    .filter(x => /time|date/.test(x.v))
    .map(x => x.i);
  const priceIdxs = headers
    .map((v, i) => ({ v, i }))
    .filter(x => /price|rate|entry|exit/.test(x.v))
    .map(x => x.i);

  if (idxSymbol < 0 || idxType < 0 || idxVolume < 0 || idxProfit < 0 || priceIdxs.length < 1) return [];

  const entryTimeIdx = timeIdxs[0] ?? -1;
  const exitTimeIdx = timeIdxs[1] ?? -1;
  const entryPriceIdx = priceIdxs[0];
  const exitPriceIdx = priceIdxs[1] ?? -1;

  const parsed: ParsedDeal[] = [];
  for (let i = 1; i < rows.length; i++) {
    const vals = rows[i];
    if (!vals || vals.length < 3) continue;

    const symbolRaw = (vals[idxSymbol] || "").trim();
    const symbol = symbolRaw.replace(/[\s#]/g, "");
    if (!symbol || !looksLikeSymbol(symbol)) continue;
    if (/^(symbol|time|type|volume|price|profit|s\/l|t\/p)$/i.test(symbol)) continue;

    const type = normType(vals[idxType] || "buy");
    if (/^(type|direction|action)$/i.test((vals[idxType] || "").trim())) continue;
    const quantity = parseVolume(vals[idxVolume]) ?? 0;
    if (quantity <= 0) continue;

    const pnl = parseNum(vals[idxProfit]) ?? 0;
    const entryPrice = parseNum(vals[entryPriceIdx]) ?? (exitPriceIdx >= 0 ? parseNum(vals[exitPriceIdx]) : null) ?? (pnl !== 0 ? 1 : 0);
    if (!entryPrice || entryPrice <= 0) continue;
    const exitPrice = exitPriceIdx >= 0 ? parseNum(vals[exitPriceIdx]) : null;
    const entryTime = entryTimeIdx >= 0 ? parseDate(vals[entryTimeIdx]) : null;
    const exitTime = exitTimeIdx >= 0 ? parseDate(vals[exitTimeIdx]) : entryTime;
    const stopLoss = idxSl >= 0 ? parseNum(vals[idxSl]) : null;
    const takeProfit = idxTp >= 0 ? parseNum(vals[idxTp]) : null;

    parsed.push({
      symbol,
      type,
      quantity,
      entryPrice,
      exitPrice,
      pnl,
      entryTime,
      exitTime,
      stopLoss,
      takeProfit,
      comment: null,
      dealId: String(i),
    });
  }

  return parsed;
}

function parseMt5HtmlPositionsTable(table: Element): ParsedDeal[] {
  const rows = Array.from(table.querySelectorAll("tr"));
  if (rows.length < 2) return [];

  let headerIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    const cells = Array.from(rows[i].querySelectorAll("th, td")).map((c) => cleanHeader(c.textContent || ""));
    if (
      cells.some((c) => c === "position") &&
      cells.some((c) => c === "symbol") &&
      cells.some((c) => c === "type") &&
      cells.some((c) => c.includes("volume")) &&
      cells.some((c) => c.includes("profit"))
    ) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx < 0) return [];

  const parsed: ParsedDeal[] = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const rowText = cleanHeader(rows[i].textContent || "");
    if (rows[i].querySelector("th") && /(orders|deals|results|balance graph)/.test(rowText)) break;

    const tds = rows[i].querySelectorAll("td");
    if (tds.length < 10) continue;
    // MT5 positions rows keep Profit in a merged last cell
    if (!rows[i].querySelector('td[colspan="2"]')) continue;

    const vals = Array.from(tds).map((c) => (c.textContent || "").trim());

    const symbol = (vals[2] || "").replace(/[\s#]/g, "");
    if (!symbol || !looksLikeSymbol(symbol) || /^(symbol|time|type|volume|price|profit)$/i.test(symbol)) continue;
    if (!/^\d+$/.test((vals[1] || "").trim())) continue; // Position id

    const type = normType(vals[3] || "");
    if (!/(buy|sell|long|short|0|1)/i.test(vals[3] || "")) continue;
    const n = vals.length;
    // MT5 positions rows often include hidden colspan cells; parse from the tail.
    const volume = parseVolume(vals[n - 9]) ?? 0;
    const entryPrice = parseNum(vals[n - 8]) ?? 0;
    const stopLoss = parseNum(vals[n - 7]);
    const takeProfit = parseNum(vals[n - 6]);
    const exitTime = parseDate(vals[n - 5]);
    const exitPrice = parseNum(vals[n - 4]);
    const pnl = parseNum(vals[n - 1]) ?? 0;
    const entryTime = parseDate(vals[0]);

    if (volume <= 0 || entryPrice <= 0) continue;

    parsed.push({
      symbol,
      type,
      quantity: volume,
      entryPrice,
      exitPrice,
      pnl,
      entryTime,
      exitTime: exitTime ?? entryTime,
      stopLoss,
      takeProfit,
      comment: null,
      dealId: vals[1] || String(i),
    });
  }

  return parsed;
}

/**
 * Parse HTML report (MT4/MT5 ReportHistory)
 * Looks for tables with Deals/Positions and extracts rows
 */
function parseHtmlReport(html: string): ParsedDeal[] {
  const deals: ParsedDeal[] = [];
  const normalizedHtml = html.replace(/\u0000/g, "");
  const parser = new DOMParser();
  const doc = parser.parseFromString(normalizedHtml, 'text/html');
  const tables = doc.querySelectorAll('table');

  for (const table of tables) {
    const mt5 = parseMt5HtmlPositionsTable(table);
    if (mt5.length > 0) return mt5;
  }

  // Positions-first parsing:
  // Time | Type | Volume | Price | S/L | T/P | Time | Price | Profit
  for (const table of tables) {
    const rows = Array.from(table.querySelectorAll("tr")).map((tr) =>
      Array.from(tr.querySelectorAll("th, td")).map((c) => (c.textContent || "").trim())
    );
    if (rows.length < 2) continue;

    for (let r = 0; r < Math.min(rows.length - 1, 4); r++) {
      const header = rows[r];
      if (!isLikelyPositionsHeader(header)) continue;
      const candidate = parsePositionsRows(rows.slice(r));
      if (candidate.length > 0) return candidate;
    }
  }
  return [];
}

/**
 * Parse XML report (MT5 XML 2007 style)
 */
function parseXmlReport(xmlText: string): ParsedDeal[] {
  const deals: ParsedDeal[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'text/xml');
  const parseErr = doc.querySelector('parsererror');
  if (parseErr) return [];

  const dealNodes = doc.querySelectorAll('Position, position');
  for (const node of dealNodes) {
    const getText = (name: string) => {
      const el = node.querySelector(name) || node.getAttribute(name);
      return el ? (typeof el === 'string' ? el : (el as Element).textContent) : '';
    };
    const symbol = (getText('Symbol') || getText('symbol') || '').trim();
    if (!symbol) continue;

    const typeStr = getText('Type') || getText('type') || getText('Action') || 'buy';
    const type = normType(typeStr);
    const volume = parseVolume(getText('Volume') || getText('volume') || getText('Lots')) ?? parseNum(getText('Volume') || getText('volume') || getText('Lots')) ?? 0;
    if (volume <= 0) continue;

    const openPrice = parseNum(getText('OpenPrice') || getText('open_price') || getText('Price'));
    const closePrice = parseNum(getText('ClosePrice') || getText('close_price'));
    const profit = parseNum(getText('Profit') || getText('profit')) ?? 0;
    const openTime = parseDate(getText('OpenTime') || getText('open_time') || getText('Time'));
    const closeTime = parseDate(getText('CloseTime') || getText('close_time'));
    const sl = parseNum(getText('StopLoss') || getText('sl'));
    const tp = parseNum(getText('TakeProfit') || getText('tp'));
    const comment = (getText('Comment') || getText('comment') || '').trim() || null;

    deals.push({
      symbol,
      type,
      quantity: volume,
      entryPrice: openPrice ?? closePrice ?? 0,
      exitPrice: closePrice ?? null,
      pnl: profit,
      entryTime: openTime,
      exitTime: closeTime ?? openTime,
      stopLoss: sl,
      takeProfit: tp,
      comment,
      dealId: getText('Deal') || getText('Position') || undefined,
    });
  }

  return deals;
}

/**
 * Parse XLSX report (MT5 Excel export)
 */
async function parseXlsxReport(data: ArrayBuffer): Promise<ParsedDeal[]> {
  const deals: ParsedDeal[] = [];
  try {
    const XLSX = await import('xlsx');
    const wb = XLSX.read(data, { type: 'array' });
    for (const name of wb.SheetNames) {
      const sheet = wb.Sheets[name];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false }) as unknown[][];
      if (rows.length < 2) continue;

      // Positions-first for XLSX
      const textRows = rows.map((row) => row.map((v) => String(v ?? "").trim()));
      const maxScan = Math.min(textRows.length - 1, 250);

      // 1) Direct header detection anywhere in top part of sheet
      for (let r = 0; r < maxScan; r++) {
        if (!isLikelyPositionsHeader(textRows[r])) continue;
        const candidate = parsePositionsRows(textRows.slice(r));
        if (candidate.length > 0) return candidate;
      }

      // 2) If sheet has a "Positions" section title, probe following rows as header
      for (let r = 0; r < maxScan; r++) {
        const rowText = cleanHeader(textRows[r].join(" "));
        if (!/\bpositions?\b/.test(rowText)) continue;
        for (let k = 1; k <= 4; k++) {
          const hIdx = r + k;
          if (hIdx >= textRows.length - 1) break;
          const h = textRows[hIdx];
          const looksHeader =
            h.some((c) => /symbol|instrument|pair|asset|ticker/i.test(c)) &&
            h.some((c) => /type|direction|action/i.test(c)) &&
            h.some((c) => /volume|lots|size|quantity|vol/i.test(c)) &&
            h.some((c) => /profit|p\/l|pl|result/i.test(c));
          if (!looksHeader) continue;
          const candidate = parsePositionsRows(textRows.slice(hIdx));
          if (candidate.length > 0) return candidate;
        }
      }
    }
  } catch {
    // ignore
  }
  return deals;
}

/** Normalize type to buy/sell for comparison */
function dirOf(t: ParsedDeal['type']): 'buy' | 'sell' {
  return t === 'sell' || t === 'short' ? 'sell' : 'buy';
}

/**
 * Combine multiple partial deals (same symbol, same direction) into one trade.
 * Sums quantity and P&L; uses first entry time and last exit time.
 */
export function combineParsedDeals(deals: ParsedDeal[]): ParsedDeal | null {
  if (!deals.length) return null;
  const symbol = deals[0].symbol;
  const dir = dirOf(deals[0].type);
  for (const d of deals) {
    if (d.symbol !== symbol || dirOf(d.type) !== dir) return null;
  }
  const totalQty = deals.reduce((s, d) => s + d.quantity, 0);
  const totalPnl = deals.reduce((s, d) => s + d.pnl, 0);
  const first = deals[0];
  const last = deals[deals.length - 1];
  const entryPrice = first.entryPrice || (last.exitPrice ?? 1);
  const exitPrice = last.exitPrice ?? first.exitPrice ?? null;
  return {
    symbol,
    type: deals[0].type,
    quantity: totalQty,
    entryPrice,
    exitPrice,
    pnl: totalPnl,
    entryTime: first.entryTime ?? last.entryTime ?? null,
    exitTime: last.exitTime ?? first.exitTime ?? null,
    stopLoss: first.stopLoss,
    takeProfit: first.takeProfit,
    comment: deals.length > 1 ? `Combined ${deals.length} partials` : first.comment,
    dealId: deals.map(d => d.dealId).filter(Boolean).join(','),
  };
}

/**
 * Parse a broker report file (HTML, XML, or XLSX).
 * Returns array of deals that can be used to pre-fill the Add Trade form.
 */
export function parseBrokerReport(file: File): Promise<ParsedDeal[]> {
  const name = (file.name || '').toLowerCase();
  const isXlsx = name.endsWith('.xlsx') || name.endsWith('.xls');

  if (isXlsx) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const data = reader.result as ArrayBuffer;
          if (!data) {
            reject(new Error('Failed to read file'));
            return;
          }
          const deals = await parseXlsxReport(data);
          resolve(deals);
        } catch (e) {
          reject(e instanceof Error ? e : new Error('Failed to parse XLSX'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = reader.result as string;
        let deals: ParsedDeal[] = [];

        if (name.endsWith('.xml')) {
          deals = parseXmlReport(content);
        } else if (name.endsWith('.htm') || name.endsWith('.html')) {
          deals = parseHtmlReport(content);
        } else {
          if (content.trim().startsWith('<?xml') || content.trim().startsWith('<')) {
            deals = parseXmlReport(content);
          }
          if (deals.length === 0) {
            deals = parseHtmlReport(content);
          }
        }

        resolve(deals);
      } catch (e) {
        reject(e instanceof Error ? e : new Error('Failed to parse report'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file, 'UTF-8');
  });
}
