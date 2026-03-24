import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ZakatRecord, ZakatItem } from '@/types';

const PKR = (n: number) => `PKR ${n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

function groupItems(items: ZakatItem[]): Record<string, ZakatItem[]> {
  const g: Record<string, ZakatItem[]> = {};
  for (const i of items) { (g[i.category] ??= []).push(i); }
  return g;
}

export function generateZakatPDF(record: ZakatRecord, userName: string) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const W = 210, M = 14, CW = W - 2 * M;
  let y = M;

  const BRAND = [22, 101, 52] as const;    // dark green
  const DARK = [30, 30, 30] as const;
  const GRAY = [100, 100, 100] as const;
  const LIGHT_BG = [245, 247, 250] as const;

  // ─── HEADER ─────────────────────────────────────────
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, W, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ZAKAT MANAGER', M, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Annual Zakat Calculation Report', M, 19);

  // Right side info
  doc.setFontSize(9);
  doc.text(`Prepared for: ${userName}`, W - M, 11, { align: 'right' });
  doc.text(`Year: ${record.yearHijri} AH / ${record.yearGregorian} CE`, W - M, 17, { align: 'right' });

  const dateStr = record.zakatDate
    ? new Date(record.zakatDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date(record.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  doc.text(`Zakat Date: ${dateStr}`, W - M, 23, { align: 'right' });

  y = 38;

  // ─── SUMMARY BOX ────────────────────────────────────
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(M, y, CW, 30, 2, 2, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(M, y, CW, 30, 2, 2, 'S');

  const isAbove = record.netAssets >= record.nisabValue;
  const summaryItems = [
    ['Total Assets', PKR(record.totalAssets)],
    ['Liabilities', PKR(record.liabilities)],
    ['Net Assets', PKR(record.netAssets)],
    ['Nisab Threshold', PKR(record.nisabValue)],
    ['Status', isAbove ? 'Above Nisab ✓' : 'Below Nisab'],
    ['ZAKAT DUE (2.5%)', PKR(record.zakatDue)],
  ];

  const colW = CW / 3;
  doc.setFontSize(7.5);
  for (let i = 0; i < summaryItems.length; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const sx = M + 4 + col * colW;
    const sy = y + 6 + row * 14;

    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'normal');
    doc.text(summaryItems[i][0], sx, sy);

    if (i === 5) {
      doc.setTextColor(...BRAND);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
    } else {
      doc.setTextColor(...DARK);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
    }
    doc.text(summaryItems[i][1], sx, sy + 5);
    doc.setFontSize(7.5);
  }

  y += 35;

  // ─── DETAILED BREAKDOWN HEADING ─────────────────────
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text('DETAILED BREAKDOWN', M, y);
  y += 2;
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.5);
  doc.line(M, y, M + 50, y);
  y += 4;

  const hasItems = record.items && record.items.length > 0;

  if (hasItems) {
    const grouped = groupItems(record.items!);
    y = renderItemsTables(doc, grouped, record, y, M, CW);
  } else {
    y = renderFlatBreakdown(doc, record, y, M, CW);
  }

  // ─── EXCHANGE RATES ─────────────────────────────────
  if (y > 260) { doc.addPage(); y = M; }
  y += 2;
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(M, y, CW, 14, 1, 1, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GRAY);
  doc.text('Exchange Rates Used:', M + 3, y + 5);
  doc.setFont('helvetica', 'normal');
  const ratesText = `SAR/PKR: ${record.srRate}  |  USD/PKR: ${record.usdRate}  |  CAD/PKR: ${record.cadRate}  |  Gold/g: ${PKR(record.goldPrice)}  |  Silver/g: ${PKR(record.silverPrice)}`;
  doc.text(ratesText, M + 3, y + 10);
  y += 18;

  // ─── FOOTER ─────────────────────────────────────────
  const footerY = 285;
  doc.setDrawColor(200, 200, 200);
  doc.line(M, footerY - 4, W - M, footerY - 4);
  doc.setFontSize(6.5);
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'italic');
  doc.text('This is an estimated zakat calculation for personal records. Please consult a scholar for precise rulings.', M, footerY);
  doc.text(`Generated on ${new Date().toLocaleString('en-GB')} by Zakat Manager`, W - M, footerY, { align: 'right' });

  // ─── SAVE ───────────────────────────────────────────
  doc.save(`Zakat_Report_${record.yearHijri}_${record.yearGregorian}.pdf`);
}

// ═══ ITEMS-BASED TABLES ═══════════════════════════════

function renderItemsTables(doc: jsPDF, grouped: Record<string, ZakatItem[]>, record: ZakatRecord, y: number, M: number, CW: number): number {
  const tableDefaults = {
    startY: y,
    margin: { left: M, right: M },
    styles: { fontSize: 7.5, cellPadding: 1.5, lineColor: [220, 220, 220] as [number, number, number], lineWidth: 0.2 },
    headStyles: { fillColor: [22, 101, 52] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontSize: 7, fontStyle: 'bold' as const },
    alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
    tableWidth: CW,
  };

  const sections: Array<{ key: string; title: string; heads: string[][]; bodyFn: (items: ZakatItem[]) => string[][] }> = [
    {
      key: 'CASH', title: 'Cash Holdings',
      heads: [['Description', 'Amount (PKR)']],
      bodyFn: items => items.map(i => [i.name, PKR(i.amount)]),
    },
    {
      key: 'BANK', title: 'Bank Accounts',
      heads: [['Bank Name', 'Type', 'Currency', 'Amount', 'PKR Value']],
      bodyFn: items => items.map(i => {
        const pkr = convertItem(i, record);
        return [i.name, i.type || '-', i.currency || 'PKR', i.amount.toLocaleString(), PKR(pkr)];
      }),
    },
    {
      key: 'INVESTMENT', title: 'Investments & Shares',
      heads: [['Name', 'Qty', 'Unit Price', 'Total (PKR)']],
      bodyFn: items => items.map(i => [i.name, i.quantity?.toString() || '-', i.unitPrice ? PKR(i.unitPrice) : '-', PKR(i.amount)]),
    },
    {
      key: 'GOLD_SILVER', title: 'Gold & Silver',
      heads: [['Type', 'Description', 'Weight (g)', 'Price/g', 'Total (PKR)']],
      bodyFn: items => items.map(i => [i.type || '-', i.name, i.quantity?.toString() || '-', i.unitPrice ? PKR(i.unitPrice) : '-', PKR(i.amount)]),
    },
    {
      key: 'PROPERTY', title: 'Properties & Real Estate',
      heads: [['Name', 'Type', 'Zakat Applicable', 'Value (PKR)']],
      bodyFn: items => items.map(i => [i.name, i.type || '-', i.zakatApplicable === false ? 'No' : 'Yes', PKR(i.amount)]),
    },
    {
      key: 'CURRENCY', title: 'Foreign Currencies',
      heads: [['Currency', 'Amount', 'Rate', 'PKR Value']],
      bodyFn: items => items.map(i => {
        const rate = i.currency === 'SR' ? record.srRate : i.currency === 'USD' ? record.usdRate : i.currency === 'CAD' ? record.cadRate : 1;
        return [i.currency || '-', i.amount.toLocaleString(), rate.toString(), PKR(i.amount * rate)];
      }),
    },
    {
      key: 'LIABILITY', title: 'Liabilities',
      heads: [['Description', 'Amount (PKR)']],
      bodyFn: items => items.map(i => [i.name, PKR(i.amount)]),
    },
  ];

  for (const sec of sections) {
    const items = grouped[sec.key];
    if (!items || items.length === 0) continue;

    // Section label
    if (y > 255) { doc.addPage(); y = 14; }
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52);
    doc.text(sec.title, M, y);
    y += 2;

    autoTable(doc, {
      ...tableDefaults,
      startY: y,
      head: sec.heads,
      body: sec.bodyFn(items),
    });

    y = (doc as any).lastAutoTable.finalY + 4;
  }

  return y;
}

// ═══ FLAT (LEGACY) BREAKDOWN ══════════════════════════

function renderFlatBreakdown(doc: jsPDF, record: ZakatRecord, y: number, M: number, CW: number): number {
  const goldVal = record.goldGrams * record.goldPrice;
  const silverVal = record.silverGrams * record.silverPrice;
  const srVal = record.srAmount * record.srRate;
  const usdVal = record.usdAmount * record.usdRate;
  const cadVal = record.cadAmount * record.cadRate;

  const rows = [
    ['Cash in Hand', PKR(record.cash)],
    ['Bank Balance', PKR(record.bank)],
    [`Gold (${record.goldGrams}g × ${PKR(record.goldPrice)}/g)`, PKR(goldVal)],
    [`Silver (${record.silverGrams}g × ${PKR(record.silverPrice)}/g)`, PKR(silverVal)],
    ['Business Assets', PKR(record.businessAssets)],
    ['Other Assets', PKR(record.otherAssets)],
    [`SAR (${record.srAmount.toLocaleString()} × ${record.srRate})`, PKR(srVal)],
    [`USD (${record.usdAmount.toLocaleString()} × ${record.usdRate})`, PKR(usdVal)],
    [`CAD (${record.cadAmount.toLocaleString()} × ${record.cadRate})`, PKR(cadVal)],
    ['', ''],
    ['Total Liabilities (deducted)', PKR(record.liabilities)],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['Asset', 'Value (PKR)']],
    body: rows,
    styles: { fontSize: 7.5, cellPadding: 1.5, lineColor: [220, 220, 220] as [number, number, number], lineWidth: 0.2 },
    headStyles: { fillColor: [22, 101, 52] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontSize: 7, fontStyle: 'bold' as const },
    alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
    tableWidth: CW,
  });

  return (doc as any).lastAutoTable.finalY + 4;
}

// ═══ HELPERS ══════════════════════════════════════════

function convertItem(item: ZakatItem, record: ZakatRecord): number {
  if (!item.currency || item.currency === 'PKR') return item.amount;
  const rate = item.currency === 'SR' ? record.srRate : item.currency === 'USD' ? record.usdRate : item.currency === 'CAD' ? record.cadRate : 1;
  return item.amount * rate;
}
