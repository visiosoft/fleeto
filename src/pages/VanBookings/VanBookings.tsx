import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Chip, CircularProgress, InputAdornment, Paper, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, PhoneIphone as AppIcon, SupportAgent as StaffIcon } from '@mui/icons-material';
import { MarketplaceService, MpBooking, STATUS_META, aed, errorMessage, fmtDate } from '../../services/MarketplaceService';

type Tab = 'action' | 'live' | 'all' | 'closed';
const TABS: { value: Tab; label: string; statuses?: string[] }[] = [
  { value: 'action', label: 'Needs action', statuses: ['pending_verification', 'approved', 'contract_pending', 'payment_pending', 'confirmed', 'handover_pending', 'inspection_pending', 'overdue'] },
  { value: 'live', label: 'On hire', statuses: ['active', 'overdue', 'return_pending'] },
  { value: 'closed', label: 'Closed / cancelled', statuses: ['closed', 'cancelled', 'rejected', 'expired'] },
  { value: 'all', label: 'All' },
];

const VanBookings: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<MpBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('action');
  const [q, setQ] = useState('');

  useEffect(() => {
    MarketplaceService.bookings()
      .then((b) => { setRows(b); setError(null); })
      .catch((e) => setError(errorMessage(e, 'Failed to load bookings')))
      .finally(() => setLoading(false));
  }, []);

  // A refund request (or a deposit whose 21-day hold is over) needs action even on a closed booking.
  const depositAction = (r: MpBooking) => r.payment.deposit?.request?.status === 'requested' || (!!r.payment.deposit?.settleable && !!r.payment.deposit?.availableNow);
  const inTab = (t: typeof TABS[number], r: MpBooking) => !t.statuses || t.statuses.includes(r.status) || (t.value === 'action' && depositAction(r));
  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.value, rows.filter((r) => inTab(t, r)).length])), [rows]);

  const shown = useMemo(() => {
    const t = TABS.find((x) => x.value === tab)!;
    const needle = q.trim().toLowerCase();
    return rows
      .filter((r) => inTab(t, r))
      .filter((r) => !needle || [r.reference, r.customer.fullName, r.customer.phone, r.customer.businessName, r.vehicle.title, r.handover?.vehicle.plate]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(needle)));
  }, [rows, tab, q]);

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Van bookings</Typography>
          <Typography variant="body2" color="text.secondary">
            Bookings from the VANLY app and bookings your team makes for clients.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/van-bookings/new')}>
          New booking
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between" mb={2}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {TABS.map((t) => (
            <Chip
              key={t.value}
              label={`${t.label} (${counts[t.value] ?? 0})`}
              color={tab === t.value ? 'primary' : 'default'}
              variant={tab === t.value ? 'filled' : 'outlined'}
              onClick={() => setTab(t.value)}
            />
          ))}
        </Stack>
        <TextField
          size="small"
          placeholder="Search name, phone, ref, plate"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ minWidth: 280 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Booking</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Van</TableCell>
              <TableCell>Dates</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Paid / next</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><CircularProgress size={28} /></TableCell></TableRow>
            ) : shown.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                {rows.length ? 'No bookings match.' : 'No van bookings yet. Create one for a client, or wait for app bookings.'}
              </TableCell></TableRow>
            ) : shown.map((b) => (
              <TableRow key={b.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/van-bookings/${b.id}`)}>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {b.source === 'admin'
                      ? <StaffIcon fontSize="small" color="action" titleAccess="Booked by staff" />
                      : <AppIcon fontSize="small" color="action" titleAccess="Booked in the app" />}
                    <Typography variant="body2" fontWeight={600}>{b.reference}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{b.customer.fullName || '-'}</Typography>
                  <Typography variant="caption" color="text.secondary">{b.customer.phone}{b.customer.businessName ? ` · ${b.customer.businessName}` : ''}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{b.vehicle.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {b.driver === 'with_driver' ? 'With driver' : 'Self-drive'}{b.handover ? ` · ${b.handover.vehicle.plate}` : ''}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{fmtDate(b.quote.startDate)}</Typography>
                  <Typography variant="caption" color="text.secondary">to {fmtDate(b.quote.endDate)}</Typography>
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5} alignItems="flex-start">
                    <Chip size="small" label={STATUS_META[b.status]?.label || b.status} color={STATUS_META[b.status]?.color || 'default'} />
                    {b.payment.deposit?.request?.status === 'requested' && <Chip size="small" color="warning" variant="outlined" label="Refund requested" />}
                    {b.payment.deposit?.request?.status !== 'requested' && b.payment.deposit?.settleable && b.payment.deposit?.availableOn && (
                      <Typography variant="caption" color="text.secondary">
                        Deposit {b.payment.deposit.availableNow ? 'refundable now' : `refundable ${fmtDate(b.payment.deposit.availableOn)}`}
                      </Typography>
                    )}
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">{aed(b.payment.paidTotal)}</Typography>
                  {b.payment.nextDue && !['closed', 'cancelled', 'rejected', 'expired'].includes(b.status) && (
                    <Typography variant="caption" color="text.secondary">next {aed(b.payment.nextDue.total)} · {fmtDate(b.payment.nextDue.dueDate)}</Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default VanBookings;
