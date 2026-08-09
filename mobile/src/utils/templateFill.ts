// Shared placeholder filling for message templates ({{clientName}} etc).
// Dependency-free on purpose: used by the Templates screen and anywhere a
// saved template needs to be turned into a real message.

export const PLACEHOLDERS = [
  'clientName', 'contactPerson', 'companyName', 'contractNumber',
  'startDate', 'endDate', 'vehiclePlate',
  'invoiceNumber', 'amount', 'dueDate', 'balance',
];

/** Replaces every {{key}} with values[key]. Unknown keys collapse to '' so the
 *  raw braces are never shown to a client. */
export const fillTemplate = (body: string, values: Record<string, string>): string =>
  String(body || '').replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key: string) => {
    const v = values?.[key];
    return v === undefined || v === null ? '' : String(v);
  });

/** "15 Jan 2026" — blank when the date is missing or unparsable. */
export const fmtShortDate = (d: any): string => {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const valuesFromContract = (contract: any, companyName?: string): Record<string, string> => {
  const c = contract || {};
  return {
    clientName: c.companyName || c.customerName || '',
    contactPerson: c.contactPerson || '',
    companyName: companyName || '',
    contractNumber: c.contractNumber || '',
    startDate: fmtShortDate(c.startDate),
    endDate: fmtShortDate(c.endDate),
    vehiclePlate: c.vehicleName || c.vehiclePlate || '',
  };
};

export const valuesFromInvoice = (invoice: any, companyName?: string): Record<string, string> => {
  const inv = invoice || {};
  const total = Number(inv.total || 0);
  const paid = Number(inv.totalPaid || 0);
  return {
    ...valuesFromContract(inv.contract, companyName),
    invoiceNumber: inv.invoiceNumber || '',
    amount: total.toLocaleString(),
    dueDate: fmtShortDate(inv.dueDate),
    balance: (total - paid).toLocaleString(),
  };
};
