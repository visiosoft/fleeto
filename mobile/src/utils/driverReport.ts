// Monthly driver salary report — branded PDF built from the logged hours and
// the payroll entry for that month. Shares the Efficient Move letterhead used
// by invoices and letters so every document that leaves the office matches.
import { brandCss, brandHeaderHtml, brandFooterHtml } from './brandTemplate';

const esc = (v: any) => (v === undefined || v === null ? '' : String(v).replace(/</g, '&lt;'));

const num = (v: any) => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

const money = (v: any) => num(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d: any) => {
  const date = new Date(d);
  return isNaN(date.getTime()) ? esc(d) : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtWeekday = (d: any) => {
  const date = new Date(d);
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB', { weekday: 'short' });
};

export interface DriverReportInput {
  driver: any;
  monthLabel: string;
  hourEntries: any[];
  totalHours: number;
  payroll?: any | null;
}

export const buildDriverReportHtml = ({ driver, monthLabel, hourEntries, totalHours, payroll }: DriverReportInput) => {
  const displayName = driver?.name
    || [driver?.firstName, driver?.lastName].filter(Boolean).join(' ')
    || 'Driver';

  const entries = (Array.isArray(hourEntries) ? [...hourEntries] : []).sort(
    (a, b) => new Date(a?.date).getTime() - new Date(b?.date).getTime()
  );
  const hoursTotal = num(totalHours) || entries.reduce((s, e) => s + num(e?.hours), 0);

  // Without a payslip for the month we fall back to the driver record so the
  // figures are still useful — flagged as indicative on the document.
  const hasPayroll = !!payroll;
  const baseSalary = hasPayroll ? num(payroll.baseSalary) : num(driver?.salary);
  const otRate = hasPayroll ? num(payroll.overtimeRate) || num(driver?.overtimeRate) : num(driver?.overtimeRate);
  const otHours = hasPayroll ? num(payroll.overtimeHours) : hoursTotal;
  const otPay = hasPayroll ? (num(payroll.overtimePay) || otHours * otRate) : otHours * otRate;
  const bonuses = hasPayroll ? num(payroll.bonuses) : 0;
  const deductions = hasPayroll ? num(payroll.deductions) : 0;
  const advances = Array.isArray(payroll?.advances) ? payroll.advances : [];
  const payments = Array.isArray(payroll?.payments) ? payroll.payments : [];
  const totalAdvances = hasPayroll
    ? (num(payroll.totalAdvances) || advances.reduce((s: number, a: any) => s + num(a?.amount), 0))
    : 0;
  const totalPaid = hasPayroll
    ? (num(payroll.totalPaid) || payments.reduce((s: number, p: any) => s + num(p?.amount), 0))
    : 0;
  const netPay = hasPayroll && payroll.netPay !== undefined && payroll.netPay !== null
    ? num(payroll.netPay)
    : baseSalary + otPay + bonuses - deductions - totalAdvances;
  const balanceDue = hasPayroll && payroll.balanceDue !== undefined && payroll.balanceDue !== null
    ? num(payroll.balanceDue)
    : netPay - totalPaid;

  const infoItems = [
    ['Employee ID', esc(driver?.employeeId) || '—'],
    ['Licence No', esc(driver?.licenseNumber) || '—'],
    ['Phone', esc(driver?.contact?.phone || driver?.phone) || '—'],
    ['Monthly Salary', `AED ${money(driver?.salary)}`],
    ['Overtime Rate', `AED ${money(driver?.overtimeRate)} / hour`],
  ];
  const infoHtml = infoItems
    .map(([k, v]) => `<div class="info-item"><div class="info-k">${k}</div><div class="info-v">${v}</div></div>`)
    .join('');

  const hoursHtml = entries.length === 0
    ? `<div class="muted">No hours logged for this month.</div>`
    : `<table>
      <thead><tr><td>Date</td><td>Day</td><td class="num">Hours</td><td>Note</td></tr></thead>
      <tbody>
        ${entries.map((e: any) => `<tr>
          <td>${fmtDate(e?.date)}</td>
          <td>${fmtWeekday(e?.date)}</td>
          <td class="num">${num(e?.hours)}</td>
          <td>${esc(e?.note)}</td>
        </tr>`).join('')}
        <tr class="bold-row"><td colspan="2">Total hours</td><td class="num">${hoursTotal}</td><td></td></tr>
      </tbody>
    </table>`;

  const salaryRow = (label: string, value: string, cls = '') =>
    `<tr class="${cls}"><td>${label}</td><td class="num">${value}</td></tr>`;

  const salaryHtml = `<table>
    <thead><tr><td>Description</td><td class="num">Amount (AED)</td></tr></thead>
    <tbody>
      ${salaryRow('Base Salary', money(baseSalary))}
      ${salaryRow(`Overtime (${otHours} h &times; AED ${money(otRate)})`, money(otPay))}
      ${salaryRow('Bonuses', money(bonuses))}
      ${salaryRow('Deductions', `-${money(deductions)}`)}
      ${salaryRow('Advances taken', `-${money(totalAdvances)}`)}
      ${salaryRow('Net Pay', money(netPay), 'bold-row')}
      ${salaryRow('Paid', money(totalPaid))}
      ${salaryRow('Balance Due', money(balanceDue), 'bold-row')}
    </tbody>
  </table>`;

  const listTable = (title: string, rows: any[], secondCol: string, secondOf: (r: any) => string) =>
    rows.length === 0 ? '' : `
    <div class="sub-head">${title}</div>
    <table class="small">
      <thead><tr><td>Date</td><td>${secondCol}</td><td class="num">Amount (AED)</td></tr></thead>
      <tbody>
        ${rows.map((r: any) => `<tr>
          <td>${fmtDate(r?.date)}</td>
          <td>${esc(secondOf(r))}</td>
          <td class="num">${money(r?.amount)}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;

  const advancesHtml = listTable('Advances', advances, 'Note', (a: any) => a?.note || '—');
  const paymentsHtml = listTable('Payments', payments, 'Method', (p: any) => [p?.method, p?.note].filter(Boolean).join(' — ') || '—');

  const generated = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&display=swap');
  @page { margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Bricolage Grotesque', serif; color: #333; min-height: 100vh; display: flex; flex-direction: column; }
  ${brandCss}
  .body { flex: 1; padding: 30px 40px 16px; }
  .doc-title { font-size: 24px; font-weight: 800; color: #232B38; text-transform: uppercase; }
  .doc-sub { font-size: 12px; color: #666; margin: 4px 0 16px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px 16px; background: #f7f7f9; border-radius: 8px; padding: 14px 16px; margin-bottom: 18px; }
  .info-k { font-size: 10px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.6px; }
  .info-v { font-size: 12px; color: #232B38; font-weight: 600; margin-top: 2px; }
  .sec-head { font-size: 13px; font-weight: 800; color: #232B38; text-transform: uppercase; letter-spacing: 0.5px; margin: 18px 0 8px; }
  .sub-head { font-size: 11px; font-weight: 700; color: #555; margin: 14px 0 6px; }
  table { width: 100%; border-collapse: collapse; }
  thead td { font-size: 11px; font-weight: 700; padding: 8px 6px; border-bottom: 2px solid #333; }
  tbody td { font-size: 11px; padding: 8px 6px; border-bottom: 1px solid #eee; color: #444; }
  table.small tbody td, table.small thead td { font-size: 10px; padding: 6px; }
  td.num, thead td.num { text-align: right; }
  tr.bold-row td { font-weight: 800; color: #232B38; border-bottom: 2px solid #232B38; }
  .muted { font-size: 11px; color: #999; padding: 10px 0; }
  .note { font-size: 10px; color: #b45309; background: #fff7ed; border-radius: 6px; padding: 8px 10px; margin-top: 10px; }
  .sign-row { display: flex; gap: 60px; margin-top: 44px; }
  .sign { flex: 1; border-top: 1px solid #999; padding-top: 6px; font-size: 10px; color: #666; }
</style></head><body>
  ${brandHeaderHtml}
  <div class="body">
    <div class="doc-title">Driver Salary Report</div>
    <div class="doc-sub">${esc(displayName)} • ${esc(monthLabel)} • Generated ${generated}</div>

    <div class="info-grid">${infoHtml}</div>

    <div class="sec-head">Daily Hours Logged</div>
    ${hoursHtml}

    <div class="sec-head">Salary Summary</div>
    ${salaryHtml}
    ${hasPayroll ? '' : '<div class="note">No payslip created for this month — figures are indicative.</div>'}
    ${advancesHtml}
    ${paymentsHtml}

    <div class="sign-row">
      <div class="sign">Employee signature</div>
      <div class="sign">Authorised signature</div>
    </div>
  </div>
  ${brandFooterHtml}
</body></html>`;
};

export default buildDriverReportHtml;
