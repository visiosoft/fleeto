import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TableFooter,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Snackbar,
} from '@mui/material';
import {
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  AccountBalance as ProfitIcon,
  DirectionsCar as VehicleIcon,
  Gavel as ContractIcon,
  ArrowBack as BackIcon,
  Info as InfoIcon,
  PictureAsPdf as PdfIcon,
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import moment from 'moment';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/environment';

interface Vehicle {
  _id: string;
  licensePlate: string;
  make: string;
  model: string;
  year: string;
}

interface Contract {
  _id: string;
  vehicleId: string;
  companyName: string;
  value: number;
  startDate: string;
  endDate: string;
  status: string;
  contractType: string;
}

interface ExpenseDetail {
  _id: string;
  vehicleId: string;
  expenseType: string;
  amount: number;
  date: string;
  description: string;
  paymentStatus: string;
  paymentMethod: string;
  vehicleName: string;
}

interface EnrichedExpense extends ExpenseDetail {
  vehiclePlate: string;
  customerName: string;
}

interface VehicleExpense {
  vehicleId: string;
  vehicleName: string;
  expenses: number;
  details: Omit<ExpenseDetail, 'vehicleName'>[];
}

const fmt = (n: number) =>
  n.toLocaleString('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 2 });

const ContractCycleReport: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [allVehicleExpenses, setAllVehicleExpenses] = useState<VehicleExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
  const [periodStart, setPeriodStart] = useState<moment.Moment>(moment().startOf('month'));
  const [periodEnd, setPeriodEnd] = useState<moment.Moment>(moment().endOf('month'));
  const [manualDates, setManualDates] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  // ── fetch everything on mount ────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const [vRes, cRes, eRes] = await Promise.all([
          axios.get(API_ENDPOINTS.vehicles, { headers }),
          axios.get(API_ENDPOINTS.contracts, { headers }),
          axios.get(API_ENDPOINTS.costs.all, { headers }),
        ]);
        setVehicles(vRes.data ?? []);
        setContracts(cRes.data ?? []);
        const expData = eRes.data;
        const list: VehicleExpense[] = Array.isArray(expData)
          ? expData
          : expData?.vehicles ?? [];
        setAllVehicleExpenses(list);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── all contracts for selected vehicles, sorted oldest → newest ──────────
  const allSelectedContracts = useMemo(
    () => contracts
      .filter(c => selectedVehicleIds.includes(c.vehicleId))
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
    [contracts, selectedVehicleIds]
  );

  // Contracts whose period overlaps the selected date range (used for income)
  const contractsInPeriod = useMemo(
    () => allSelectedContracts.filter(c => {
      const cStart = moment(c.startDate);
      const cEnd = c.endDate ? moment(c.endDate) : moment('9999-12-31');
      return cStart.isSameOrBefore(periodEnd, 'day') && cEnd.isSameOrAfter(periodStart, 'day');
    }),
    [allSelectedContracts, periodStart, periodEnd]
  );

  // Active contracts — used only for cycle auto-detection
  const activeContracts = useMemo(
    () => allSelectedContracts.filter(c => c.status === 'Active'),
    [allSelectedContracts]
  );

  // Contracts grouped by vehicle (all statuses, for the side panel)
  const contractsByVehicle = useMemo(() => {
    const map = new Map<string, Contract[]>();
    allSelectedContracts.forEach(c => {
      const list = map.get(c.vehicleId) ?? [];
      list.push(c);
      map.set(c.vehicleId, list);
    });
    return Array.from(map.entries());
  }, [allSelectedContracts]);

  // ── unique contract start days (from active only) ─────────────────────────
  const startDays = useMemo(() => {
    const days = activeContracts.map(c => moment(c.startDate).date());
    return days.filter((d, i) => days.indexOf(d) === i);
  }, [activeContracts]);

  const uniformStartDay: number | null = startDays.length === 1 ? startDays[0] : null;
  const hasConflictingDays = startDays.length > 1;

  // ── auto-compute billing period when contract start day is uniform ───────
  useEffect(() => {
    if (manualDates) return;
    if (uniformStartDay === null) return;

    const day = uniformStartDay;
    const today = moment();
    let cycleStart = moment().date(day).startOf('day');
    if (today.isBefore(cycleStart, 'day')) {
      cycleStart = cycleStart.clone().subtract(1, 'month');
    }
    let cycleEnd = cycleStart.clone().add(1, 'month').subtract(1, 'day').endOf('day');
    // Default to the last COMPLETED cycle (cycle end must be before today)
    if (cycleEnd.isAfter(today, 'day')) {
      cycleStart = cycleStart.clone().subtract(1, 'month');
      cycleEnd = cycleEnd.clone().subtract(1, 'month');
    }
    setPeriodStart(cycleStart);
    setPeriodEnd(cycleEnd);
  }, [uniformStartDay, manualDates]);

  // ── cycle navigation ─────────────────────────────────────────────────────
  const navigateCycle = (dir: 'prev' | 'next') => {
    const delta = dir === 'next' ? 1 : -1;
    setPeriodStart(s => s.clone().add(delta, 'month'));
    setPeriodEnd(e => e.clone().add(delta, 'month'));
    setManualDates(false);
  };

  // ── helper: find the active contract for a vehicle ───────────────────────
  const getContractForExpense = (exp: ExpenseDetail): Contract | undefined =>
    activeContracts.find(c => c.vehicleId === exp.vehicleId);

  // ── filtered & enriched expenses ─────────────────────────────────────────
  const enrichedExpenses = useMemo<EnrichedExpense[]>(() => {
    const result: EnrichedExpense[] = [];
    allVehicleExpenses.forEach(v => {
      if (!selectedVehicleIds.includes(v.vehicleId)) return;
      (v.details ?? []).forEach(exp => {
        if (!moment(exp.date).isBetween(periodStart, periodEnd, 'day', '[]')) return;
        const baseExp = { ...exp, vehicleName: v.vehicleName };
        const vehicle = vehicles.find(veh => veh._id === v.vehicleId);
        const contract = getContractForExpense(baseExp);
        result.push({
          ...baseExp,
          vehiclePlate: vehicle?.licensePlate ?? '',
          customerName: contract?.companyName ?? '—',
        });
      });
    });
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allVehicleExpenses, selectedVehicleIds, periodStart, periodEnd, vehicles, allSelectedContracts]);

  // ── pro-rated income breakdown ────────────────────────────────────────────
  // Each contract contributes (value / periodDays) × overlapDays
  // For in-progress periods (end > today) the overlap is capped at today
  const incomeBreakdown = useMemo(() => {
    const today = moment().endOf('day');
    const isOngoing = periodEnd.isAfter(today, 'day');
    // For completed periods use the full period length as denominator;
    // for in-progress periods use days elapsed so far
    const effectiveEnd = isOngoing ? today.clone() : periodEnd.clone();
    const periodDays = periodEnd.diff(periodStart, 'days') + 1;
    const elapsedDays = effectiveEnd.diff(periodStart, 'days') + 1;

    return contractsInPeriod.map(c => {
      const overlapStart = moment.max(moment(c.startDate), periodStart.clone().startOf('day'));
      const overlapEnd = c.endDate
        ? moment.min(moment(c.endDate), effectiveEnd.clone())
        : effectiveEnd.clone();
      const overlapDays = Math.max(0, overlapEnd.diff(overlapStart, 'days') + 1);
      // Daily rate is always based on full period (monthly rate / full cycle days)
      const dailyRate = (c.value || 0) / periodDays;
      const proratedValue = dailyRate * overlapDays;
      const vehicle = vehicles.find(v => v._id === c.vehicleId);
      return { contract: c, overlapDays, periodDays, elapsedDays, dailyRate, proratedValue, isOngoing, vehicle };
    });
  }, [contractsInPeriod, periodStart, periodEnd, vehicles]);

  // ── totals ───────────────────────────────────────────────────────────────
  const totalIncome = useMemo(
    () => incomeBreakdown.reduce((s, b) => s + b.proratedValue, 0),
    [incomeBreakdown]
  );

  const totalExpenses = useMemo(
    () => enrichedExpenses.reduce((s, e) => s + e.amount, 0),
    [enrichedExpenses]
  );

  const netProfit = totalIncome - totalExpenses;

  // ── expense type breakdown ───────────────────────────────────────────────
  const expenseByType = useMemo(() => {
    const map = new Map<string, number>();
    enrichedExpenses.forEach(e => {
      map.set(e.expenseType, (map.get(e.expenseType) ?? 0) + e.amount);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [enrichedExpenses]);

  // ── vehicle label helper ─────────────────────────────────────────────────
  const vehicleLabel = (id: string) => {
    const v = vehicles.find(v => v._id === id);
    return v ? `${v.make} ${v.model} — ${v.licensePlate}` : id;
  };

  const contractStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return { bg: '#f0fdf4', border: '#86efac', text: '#16a34a' };
      case 'Expired': return { bg: '#f9fafb', border: '#d1d5db', text: '#6b7280' };
      case 'Terminated': return { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626' };
      default: return { bg: '#fffbeb', border: '#fcd34d', text: '#d97706' };
    }
  };

  const buildPDFHtml = () => {
    const vehicleNames = selectedVehicleIds.map(id => vehicleLabel(id)).join(', ');

    const contractRows = incomeBreakdown.map(({ contract: c, overlapDays, periodDays, dailyRate, proratedValue }) => {
      const isPartial = overlapDays < periodDays;
      return `<tr>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-weight:600;">${c.companyName}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${vehicleLabel(c.vehicleId)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${moment(c.startDate).format('D MMM YYYY')}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${c.endDate ? moment(c.endDate).format('D MMM YYYY') : '—'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center;">${isPartial ? `${overlapDays}/${periodDays} days` : 'Full period'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${isPartial ? `${fmt(dailyRate)}/day` : `${fmt(c.value)}/mo`}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700;color:#15803d;">${fmt(proratedValue)}</td>
      </tr>`;
    }).join('');

    const expenseRows = enrichedExpenses.map(exp => `
      <tr>
        <td style="padding:5px 7px;border-bottom:1px solid #f3f4f6;">${moment(exp.date).format('D MMM YYYY')}</td>
        <td style="padding:5px 7px;border-bottom:1px solid #f3f4f6;">${exp.vehiclePlate}</td>
        <td style="padding:5px 7px;border-bottom:1px solid #f3f4f6;">${exp.vehicleName}</td>
        <td style="padding:5px 7px;border-bottom:1px solid #f3f4f6;">${exp.customerName}</td>
        <td style="padding:5px 7px;border-bottom:1px solid #f3f4f6;text-transform:capitalize;">${exp.expenseType}</td>
        <td style="padding:5px 7px;border-bottom:1px solid #f3f4f6;">${exp.description || ''}</td>
        <td style="padding:5px 7px;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:600;">${fmt(exp.amount)}</td>
        <td style="padding:5px 7px;border-bottom:1px solid #f3f4f6;">${exp.paymentStatus}</td>
      </tr>`).join('');

    const typeRows = expenseByType.map(([type, amount]) => `
      <tr>
        <td style="text-transform:capitalize;">${type}</td>
        <td style="text-align:right;font-weight:600;">${fmt(amount)}</td>
        <td>${totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0}%</td>
      </tr>`).join('');

    return `
      <div style="font-family:Arial,sans-serif;font-size:13px;color:#111827;background:white;margin:0;padding:0;">
        <!-- Header banner -->
        <div style="background:#1e40af;color:white;padding:20px 24px;border-radius:8px;margin-bottom:20px;">
          <div style="font-size:22px;font-weight:800;margin-bottom:4px;">${selectedVehicleIds.length === 1 ? `${vehicleLabel(selectedVehicleIds[0]).split(' — ')[0]} - Monthly Report` : `${selectedVehicleIds.length} Vehicles - Monthly Report`}</div>
          <div style="opacity:0.85;font-size:13px;">Period: ${periodLabel}</div>
          <div style="opacity:0.85;font-size:13px;">Vehicles: ${vehicleNames}</div>
          <div style="opacity:0.65;font-size:11px;margin-top:6px;">Generated: ${moment().format('D MMM YYYY, h:mm A')}</div>
        </div>

        <!-- Summary row -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr>
            <td style="width:33%;padding:14px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;text-align:center;">
              <div style="font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Total Income</div>
              <div style="font-size:20px;font-weight:800;color:#15803d;">${fmt(totalIncome)}</div>
              <div style="font-size:11px;color:#6b7280;">${incomeBreakdown.length} contract(s)${incomeBreakdown.some(b => b.overlapDays < b.periodDays) ? ' · pro-rated' : ''}</div>
            </td>
            <td style="width:4px;"></td>
            <td style="width:33%;padding:14px;background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;text-align:center;">
              <div style="font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Total Expenses</div>
              <div style="font-size:20px;font-weight:800;color:#b91c1c;">${fmt(totalExpenses)}</div>
              <div style="font-size:11px;color:#6b7280;">${enrichedExpenses.length} transaction(s)</div>
            </td>
            <td style="width:4px;"></td>
            <td style="width:33%;padding:14px;background:${netProfit >= 0 ? '#eff6ff' : '#fff7ed'};border:1px solid ${netProfit >= 0 ? '#93c5fd' : '#fdba74'};border-radius:8px;text-align:center;">
              <div style="font-size:11px;font-weight:700;color:${netProfit >= 0 ? '#2563eb' : '#ea580c'};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Net Profit</div>
              <div style="font-size:20px;font-weight:800;color:${netProfit >= 0 ? '#1d4ed8' : '#c2410c'};">${fmt(netProfit)}</div>
              <div style="font-size:11px;color:#6b7280;">${netProfit >= 0 ? 'Profitable' : 'Loss'}</div>
            </td>
          </tr>
        </table>

        ${incomeBreakdown.length > 0 ? `
        <!-- Income Breakdown -->
        <div style="margin-bottom:20px;">
          <div style="font-size:15px;font-weight:700;border-bottom:2px solid #e5e7eb;padding-bottom:6px;margin-bottom:10px;">Income Breakdown (Pro-rated)</div>
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="padding:7px 8px;text-align:left;color:#6b7280;border-bottom:1px solid #e5e7eb;">Customer</th>
                <th style="padding:7px 8px;text-align:left;color:#6b7280;border-bottom:1px solid #e5e7eb;">Vehicle</th>
                <th style="padding:7px 8px;text-align:left;color:#6b7280;border-bottom:1px solid #e5e7eb;">Start</th>
                <th style="padding:7px 8px;text-align:left;color:#6b7280;border-bottom:1px solid #e5e7eb;">End</th>
                <th style="padding:7px 8px;text-align:center;color:#6b7280;border-bottom:1px solid #e5e7eb;">Days</th>
                <th style="padding:7px 8px;text-align:right;color:#6b7280;border-bottom:1px solid #e5e7eb;">Rate</th>
                <th style="padding:7px 8px;text-align:right;color:#6b7280;border-bottom:1px solid #e5e7eb;">Income</th>
              </tr>
            </thead>
            <tbody style="font-size:12px;">${contractRows}
              <tr style="background:#f0fdf4;font-weight:700;">
                <td colspan="6" style="padding:7px 8px;border-top:2px solid #e5e7eb;">Total Income</td>
                <td style="padding:7px 8px;text-align:right;border-top:2px solid #e5e7eb;color:#15803d;">${fmt(totalIncome)}</td>
              </tr>
            </tbody>
          </table>
        </div>` : ''}

        ${expenseByType.length > 0 ? `
        <!-- By type -->
        <div style="margin-bottom:20px;">
          <div style="font-size:15px;font-weight:700;border-bottom:2px solid #e5e7eb;padding-bottom:6px;margin-bottom:10px;">Expense by Type</div>
          <table style="width:60%;border-collapse:collapse;font-size:12px;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="padding:7px 8px;text-align:left;color:#6b7280;border-bottom:1px solid #e5e7eb;">Type</th>
                <th style="padding:7px 8px;text-align:right;color:#6b7280;border-bottom:1px solid #e5e7eb;">Amount</th>
                <th style="padding:7px 8px;text-align:left;color:#6b7280;border-bottom:1px solid #e5e7eb;">Share</th>
              </tr>
            </thead>
            <tbody>${typeRows}</tbody>
          </table>
        </div>` : ''}

        <!-- Expense detail -->
        <div>
          <div style="font-size:15px;font-weight:700;border-bottom:2px solid #e5e7eb;padding-bottom:6px;margin-bottom:10px;">
            Expense Breakdown (${enrichedExpenses.length} records)
          </div>
          ${enrichedExpenses.length === 0
            ? '<p style="color:#6b7280;font-style:italic;">No expenses in this period.</p>'
            : `<table style="width:100%;border-collapse:collapse;font-size:11px;">
                <thead>
                  <tr style="background:#f9fafb;">
                    <th style="padding:5px 7px;text-align:left;color:#6b7280;border-bottom:1px solid #e5e7eb;">Date</th>
                    <th style="padding:5px 7px;text-align:left;color:#6b7280;border-bottom:1px solid #e5e7eb;">Plate No.</th>
                    <th style="padding:5px 7px;text-align:left;color:#6b7280;border-bottom:1px solid #e5e7eb;">Vehicle</th>
                    <th style="padding:5px 7px;text-align:left;color:#6b7280;border-bottom:1px solid #e5e7eb;">Customer</th>
                    <th style="padding:5px 7px;text-align:left;color:#6b7280;border-bottom:1px solid #e5e7eb;">Type</th>
                    <th style="padding:5px 7px;text-align:left;color:#6b7280;border-bottom:1px solid #e5e7eb;">Description</th>
                    <th style="padding:5px 7px;text-align:right;color:#6b7280;border-bottom:1px solid #e5e7eb;">Amount</th>
                    <th style="padding:5px 7px;text-align:left;color:#6b7280;border-bottom:1px solid #e5e7eb;">Status</th>
                  </tr>
                </thead>
                <tbody>${expenseRows}
                  <tr style="background:#f9fafb;font-weight:700;">
                    <td colspan="6" style="padding:7px 8px;border-top:2px solid #e5e7eb;">Total</td>
                    <td style="padding:7px 8px;text-align:right;border-top:2px solid #e5e7eb;color:#dc2626;">${fmt(totalExpenses)}</td>
                    <td style="border-top:2px solid #e5e7eb;"></td>
                  </tr>
                </tbody>
              </table>`}
        </div>
      </div>`;
  };

  const handleExportPDF = async () => {
    setExportingPdf(true);

    // position:absolute so the element can be taller than the viewport
    const container = document.createElement('div');
    container.style.cssText = [
      'position:absolute', 'top:0', 'left:0',
      'width:794px', 'background:white',
      'padding:24px', 'box-sizing:border-box',
      'z-index:999999', 'overflow:visible',
    ].join(';');
    container.innerHTML = buildPDFHtml();

    // Save current scroll, snap to top so element is in capture area
    const prevScrollX = window.scrollX;
    const prevScrollY = window.scrollY;
    window.scrollTo(0, 0);
    document.body.appendChild(container);

    try {
      // Let the browser fully paint all rows before capturing
      await new Promise(r => setTimeout(r, 500));

      const elW = container.offsetWidth;
      const elH = container.offsetHeight; // full natural height, not capped by viewport

      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const canvas = await (html2canvas as any)(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        x: 0,
        y: 0,
        width: elW,
        height: elH,
        windowWidth: elW,
        windowHeight: elH,
        scrollX: 0,
        scrollY: 0,
      });

      document.body.removeChild(container);
      window.scrollTo(prevScrollX, prevScrollY);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      // Slice full image across A4 pages
      let offset = 0;
      let first = true;
      while (offset < imgH) {
        if (!first) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, -offset, imgW, imgH);
        offset += pageH;
        first = false;
      }

      const plateStr = selectedVehicleIds
        .map(id => vehicles.find(v => v._id === id)?.licensePlate ?? id)
        .join('_');
      const filename = `${plateStr}-${periodStart.format('MMM-YYYY')}.pdf`;
      pdf.save(filename);
    } catch (err) {
      if (document.body.contains(container)) document.body.removeChild(container);
      window.scrollTo(prevScrollX, prevScrollY);
      console.error('PDF export failed:', err);
      setSnackbar({ open: true, message: 'PDF export failed — check console' });
    } finally {
      setExportingPdf(false);
    }
  };

  const handleShareWhatsApp = () => {
    const vehicleNames = selectedVehicleIds.map(id => vehicleLabel(id).split('—')[0].trim()).join(', ');
    const lines = [
      `📊 *Contract Cycle Report*`,
      `Period: ${periodLabel}`,
      `Vehicles: ${vehicleNames || 'None selected'}`,
      ``,
      `💰 *Total Income:* ${fmt(totalIncome)}`,
      `💸 *Total Expenses:* ${fmt(totalExpenses)}`,
      `${netProfit >= 0 ? '✅' : '⚠️'} *Net Profit:* ${fmt(netProfit)}`,
    ];

    if (expenseByType.length > 0) {
      lines.push('', '📋 *Expense Breakdown:*');
      expenseByType.forEach(([type, amount]) => {
        lines.push(`• ${type.charAt(0).toUpperCase() + type.slice(1)}: ${fmt(amount)}`);
      });
    }

    if (activeContracts.length > 0) {
      lines.push('', '📄 *Contracts:*');
      activeContracts.forEach(c => {
        lines.push(`• ${c.companyName}: ${fmt(c.value)} (starts ${moment(c.startDate).format('D MMM')})`);
      });
    }

    const text = lines.join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const periodLabel = `${periodStart.format('D MMM YYYY')} – ${periodEnd.format('D MMM YYYY')}`;

  return (
    <Box sx={{ p: 3 }}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/reports')}>
            <BackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {selectedVehicleIds.length === 1
                ? `${vehicleLabel(selectedVehicleIds[0]).split(' — ')[0]} - Monthly Report`
                : selectedVehicleIds.length > 1
                  ? `${selectedVehicleIds.length} Vehicles - Monthly Report`
                  : 'Monthly Report'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Income vs. expenses per billing cycle, aligned to contract start date
            </Typography>
          </Box>
        </Box>

        {selectedVehicleIds.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={exportingPdf ? <CircularProgress size={16} /> : <PdfIcon />}
              onClick={handleExportPDF}
              disabled={exportingPdf}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#DC2626',
                color: '#DC2626',
                '&:hover': { borderColor: '#B91C1C', bgcolor: '#FEF2F2' },
              }}
            >
              {exportingPdf ? 'Exporting…' : 'Export PDF'}
            </Button>
            <Button
              variant="contained"
              startIcon={<WhatsAppIcon />}
              onClick={handleShareWhatsApp}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: '#25D366',
                '&:hover': { bgcolor: '#1DA851' },
              }}
            >
              Share on WhatsApp
            </Button>
          </Box>
        )}
      </Box>

      {/* ── Filters Paper ── */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          Select Vehicles & Period
        </Typography>

        <Grid container spacing={2} alignItems="flex-start">
          {/* Vehicle multi-select */}
          <Grid item xs={12} md={5}>
            <FormControl fullWidth size="small">
              <InputLabel>Vehicles</InputLabel>
              <Select
                multiple
                value={selectedVehicleIds}
                onChange={e => {
                  setSelectedVehicleIds(e.target.value as string[]);
                  setManualDates(false);
                }}
                input={<OutlinedInput label="Vehicles" />}
                renderValue={ids => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(ids as string[]).map(id => (
                      <Chip
                        key={id}
                        label={vehicleLabel(id)}
                        size="small"
                        icon={<VehicleIcon sx={{ fontSize: '14px !important' }} />}
                      />
                    ))}
                  </Box>
                )}
              >
                {vehicles.map(v => (
                  <MenuItem key={v._id} value={v._id}>
                    <Checkbox checked={selectedVehicleIds.includes(v._id)} />
                    <ListItemText
                      primary={`${v.make} ${v.model}`}
                      secondary={v.licensePlate}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Contract badges */}
            {selectedVehicleIds.length > 0 && (
              <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selectedVehicleIds.map(id => {
                  const c = contracts.find(c => c.vehicleId === id && c.status === 'Active');
                  return c ? (
                    <Chip
                      key={id}
                      size="small"
                      icon={<ContractIcon sx={{ fontSize: '13px !important' }} />}
                      label={`${vehicleLabel(id).split('—')[0].trim()}: ${fmt(c.value)} (starts ${moment(c.startDate).format('D')}th)`}
                      color="primary"
                      variant="outlined"
                    />
                  ) : (
                    <Chip
                      key={id}
                      size="small"
                      label={`${vehicleLabel(id).split('—')[0].trim()}: no active contract`}
                      color="warning"
                      variant="outlined"
                    />
                  );
                })}
              </Box>
            )}

            {hasConflictingDays && (
              <Alert severity="warning" icon={<InfoIcon />} sx={{ mt: 1.5, py: 0.5 }}>
                Contracts have different start days ({startDays.join(', ')}). Set date range manually.
              </Alert>
            )}
          </Grid>

          {/* Period controls */}
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Cycle navigation — only when auto-mode is active */}
              {uniformStartDay !== null && !manualDates && (
                <>
                  <Tooltip title="Previous cycle">
                    <IconButton onClick={() => navigateCycle('prev')} size="small">
                      <PrevIcon />
                    </IconButton>
                  </Tooltip>
                  <Chip
                    icon={<CalendarIcon />}
                    label={periodLabel}
                    color="primary"
                    sx={{ fontWeight: 600 }}
                  />
                  <Tooltip title="Next cycle">
                    <IconButton onClick={() => navigateCycle('next')} size="small">
                      <NextIcon />
                    </IconButton>
                  </Tooltip>
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{ textTransform: 'none' }}
                    onClick={() => setManualDates(true)}
                  >
                    Custom dates
                  </Button>
                </>
              )}

              {/* Manual date pickers */}
              {(manualDates || uniformStartDay === null) && (
                <>
                  <DatePicker
                    label="Period start"
                    value={periodStart}
                    onChange={v => { if (v) { setPeriodStart(v); setManualDates(true); } }}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                  <DatePicker
                    label="Period end"
                    value={periodEnd}
                    onChange={v => { if (v) { setPeriodEnd(v); setManualDates(true); } }}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                  {uniformStartDay !== null && (
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ textTransform: 'none' }}
                      onClick={() => setManualDates(false)}
                    >
                      Reset to cycle
                    </Button>
                  )}
                </>
              )}

              {/* Quick filters */}
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', ml: 'auto' }}>
                {[
                  { label: 'This month', start: moment().startOf('month'), end: moment().endOf('month') },
                  { label: 'Last month', start: moment().subtract(1, 'month').startOf('month'), end: moment().subtract(1, 'month').endOf('month') },
                  { label: 'This year', start: moment().startOf('year'), end: moment().endOf('year') },
                ].map(q => (
                  <Chip
                    key={q.label}
                    label={q.label}
                    size="small"
                    variant="outlined"
                    clickable
                    onClick={() => {
                      setPeriodStart(q.start);
                      setPeriodEnd(q.end);
                      setManualDates(true);
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {selectedVehicleIds.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '2px dashed', borderColor: 'divider' }}>
          <VehicleIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">Select one or more vehicles to view the report</Typography>
        </Paper>
      ) : (
        <>
          {/* ── Summary Cards ── */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {[
              {
                label: 'Total Income',
                value: fmt(totalIncome),
                sub: incomeBreakdown.some(b => b.isOngoing)
                  ? `In progress — ${incomeBreakdown[0]?.elapsedDays ?? 0} of ${incomeBreakdown[0]?.periodDays ?? 0} days`
                  : incomeBreakdown.some(b => b.overlapDays < b.periodDays)
                  ? `Pro-rated (${incomeBreakdown.length} contract${incomeBreakdown.length !== 1 ? 's' : ''})`
                  : `${incomeBreakdown.length} contract${incomeBreakdown.length !== 1 ? 's' : ''} — full cycle`,
                icon: <IncomeIcon />,
                gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                glow: 'rgba(16, 185, 129, 0.3)',
                valueColor: '#059669',
              },
              {
                label: 'Total Expenses',
                value: fmt(totalExpenses),
                sub: `${enrichedExpenses.length} transaction${enrichedExpenses.length !== 1 ? 's' : ''}`,
                icon: <ExpenseIcon />,
                gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                glow: 'rgba(239, 68, 68, 0.3)',
                valueColor: '#DC2626',
              },
              {
                label: 'Net Profit',
                value: fmt(netProfit),
                sub: netProfit >= 0 ? 'Profitable period' : 'Running at a loss',
                icon: <ProfitIcon />,
                gradient: netProfit >= 0
                  ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                  : 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                glow: netProfit >= 0 ? 'rgba(59, 130, 246, 0.3)' : 'rgba(249, 115, 22, 0.3)',
                valueColor: netProfit >= 0 ? '#2563EB' : '#EA580C',
              },
            ].map(card => (
              <Grid item xs={12} md={4} key={card.label}>
                <Box sx={{
                  background: 'white',
                  borderRadius: '16px',
                  p: 3,
                  border: '1px solid #E5E7EB',
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(0,0,0,0.1)' },
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      width: 48, height: 48, borderRadius: '12px',
                      background: card.gradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 4px 14px ${card.glow}`,
                    }}>
                      {React.cloneElement(card.icon, { sx: { color: 'white', fontSize: 24 } })}
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {card.label}
                      </Typography>
                      <Typography sx={{ fontSize: '24px', fontWeight: 800, color: card.valueColor, lineHeight: 1 }}>
                        {card.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{card.sub}</Typography>
                    </Box>
                  </Box>

                  {/* Margin bar */}
                  {card.label === 'Net Profit' && totalIncome > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">Expense ratio</Typography>
                        <Typography variant="caption" fontWeight={700}>
                          {Math.min(100, Math.round((totalExpenses / totalIncome) * 100))}%
                        </Typography>
                      </Box>
                      <Box sx={{ height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.15), overflow: 'hidden' }}>
                        <Box sx={{
                          height: '100%',
                          borderRadius: 3,
                          width: `${Math.min(100, (totalExpenses / totalIncome) * 100)}%`,
                          bgcolor: netProfit >= 0 ? theme.palette.success.main : theme.palette.error.main,
                          transition: 'width 0.6s ease',
                        }} />
                      </Box>
                    </Box>
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={3}>
            {/* ── Expense Breakdown Table ── */}
            <Grid item xs={12} lg={8}>
              <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight={700}>Expense Breakdown</Typography>
                  <Chip label={`${enrichedExpenses.length} records`} size="small" color="primary" variant="outlined" />
                </Box>
                <Divider />
                <TableContainer sx={{ maxHeight: 500 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.05) } }}>
                        <TableCell>Date</TableCell>
                        <TableCell>Plate No.</TableCell>
                        <TableCell>Vehicle</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {enrichedExpenses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                            No expenses in this period
                          </TableCell>
                        </TableRow>
                      ) : (
                        enrichedExpenses.map(exp => (
                          <TableRow key={exp._id} sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.03) } }}>
                            <TableCell>
                              <Typography variant="body2">{moment(exp.date).format('D MMM YYYY')}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={exp.vehiclePlate || '—'} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>{exp.vehicleName}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 120 }}>
                                {exp.customerName}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={exp.expenseType}
                                size="small"
                                color={exp.expenseType === 'fuel' ? 'primary' : exp.expenseType === 'maintenance' ? 'secondary' : 'default'}
                                sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 160 }}>
                                {exp.description}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={700} color="error.main">
                                {fmt(exp.amount)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={exp.paymentStatus}
                                size="small"
                                color={exp.paymentStatus === 'paid' ? 'success' : exp.paymentStatus === 'pending' ? 'warning' : 'error'}
                                sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                    {enrichedExpenses.length > 0 && (
                      <TableFooter>
                        <TableRow sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.06),
                          '& td': { borderTop: `2px solid ${theme.palette.divider}`, fontWeight: 700, fontSize: '0.9rem' },
                        }}>
                          <TableCell colSpan={6}>Total Expenses for period</TableCell>
                          <TableCell align="right" sx={{ color: theme.palette.error.main }}>
                            {fmt(totalExpenses)}
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      </TableFooter>
                    )}
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            {/* ── Side panel ── */}
            <Grid item xs={12} lg={4}>
              {/* Income breakdown */}
              {incomeBreakdown.length > 0 && (
                <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', mb: 3 }}>
                  <Box sx={{ p: 2.5 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Income Breakdown</Typography>
                    {incomeBreakdown.map(({ contract: c, overlapDays, periodDays, elapsedDays, dailyRate, proratedValue, isOngoing }) => {
                      const isPartial = overlapDays < periodDays;
                      const bgColor = isOngoing ? '#eff6ff' : isPartial ? '#fffbeb' : '#f0fdf4';
                      const borderColor = isOngoing ? '#93c5fd' : isPartial ? '#fcd34d' : '#86efac';
                      const textColor = isOngoing ? '#1d4ed8' : isPartial ? '#d97706' : '#16a34a';
                      return (
                        <Box key={c._id} sx={{ mb: 1.5, p: 1.5, borderRadius: 2, bgcolor: bgColor, border: `1px solid ${borderColor}` }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" fontWeight={700} sx={{ maxWidth: 130 }} noWrap>{c.companyName}</Typography>
                            <Typography variant="body2" fontWeight={800} sx={{ color: textColor }}>
                              {fmt(proratedValue)}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary" display="block">{vehicleLabel(c.vehicleId)}</Typography>
                          {isOngoing ? (
                            <Typography variant="caption" sx={{ color: '#1d4ed8', fontWeight: 600 }}>
                              {overlapDays}/{periodDays} days elapsed · {fmt(dailyRate)}/day
                            </Typography>
                          ) : isPartial ? (
                            <Typography variant="caption" sx={{ color: '#d97706', fontWeight: 600 }}>
                              {overlapDays}/{periodDays} days × {fmt(dailyRate)}/day
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.secondary">Full cycle · {fmt(c.value)}/month</Typography>
                          )}
                        </Box>
                      );
                    })}
                    {incomeBreakdown.length > 1 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '2px solid #e5e7eb' }}>
                        <Typography variant="body2" fontWeight={700}>Total</Typography>
                        <Typography variant="body2" fontWeight={800} color="success.dark">{fmt(totalIncome)}</Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              )}

              {/* By type */}
              <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', mb: 3 }}>
                <Box sx={{ p: 2.5 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>By Expense Type</Typography>
                  {expenseByType.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No data</Typography>
                  ) : (
                    expenseByType.map(([type, amount]) => (
                      <Box key={type} sx={{ mb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>{type}</Typography>
                          <Typography variant="body2" fontWeight={700}>{fmt(amount)}</Typography>
                        </Box>
                        <Box sx={{ height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.1), overflow: 'hidden' }}>
                          <Box sx={{
                            height: '100%', borderRadius: 3, bgcolor: theme.palette.primary.main,
                            width: totalExpenses > 0 ? `${(amount / totalExpenses) * 100}%` : '0%',
                            transition: 'width 0.5s ease',
                          }} />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0}% of expenses
                        </Typography>
                      </Box>
                    ))
                  )}
                </Box>
              </Paper>

              {/* Active contracts only */}
              <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <Box sx={{ p: 2.5 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Active Contracts</Typography>
                  {activeContracts.length === 0 ? (
                    <Alert severity="warning" sx={{ py: 0.5 }}>No active contracts for selected vehicles</Alert>
                  ) : (
                    activeContracts.map(c => (
                      <Box key={c._id} sx={{
                        mb: 1.5, p: 2, borderRadius: 2,
                        bgcolor: alpha(theme.palette.success.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                      }}>
                        <Typography variant="body2" fontWeight={700}>{c.companyName}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {vehicleLabel(c.vehicleId)}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">Value</Typography>
                          <Typography variant="caption" fontWeight={700} color="success.main">{fmt(c.value)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">Start</Typography>
                          <Typography variant="caption" fontWeight={600}>
                            {moment(c.startDate).format('D MMM YYYY')} <span style={{ color: '#6b7280' }}>(day {moment(c.startDate).date()})</span>
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">End</Typography>
                          <Typography variant="caption" fontWeight={600}>{c.endDate ? moment(c.endDate).format('D MMM YYYY') : '—'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">Type</Typography>
                          <Chip label={c.contractType} size="small" sx={{ height: 16, fontSize: '0.65rem' }} />
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default ContractCycleReport;
