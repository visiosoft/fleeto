import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, MenuItem,
  Paper, Stack, Step, StepLabel, Stepper, TextField, Typography,
} from '@mui/material';
import {
  ArrowBack as BackIcon, CheckCircleOutline as ApproveIcon, LocalShipping as DispatchIcon, AssignmentReturn as ReturnIcon,
  Payments as PaymentIcon, Visibility as ViewIcon, Block as RejectIcon, PhoneIphone as AppIcon, CreditCard as CardIcon,
} from '@mui/icons-material';
import TermsPicker from './TermsPicker';
import ChargesCard from './ChargesCard';
import PaymentLinksCard from './PaymentLinksCard';
import { Checkbox, FormControlLabel } from '@mui/material';
import {
  BookingStatus, FleetVehicle, METHOD_LABEL, MarketplaceService, MpBooking, MpDocument, PaymentTerms, STATUS_META, aed, errorMessage, fmtDate, fmtDateTime, mediaUrl, termsSummary,
} from '../../services/MarketplaceService';

type Detail = Awaited<ReturnType<typeof MarketplaceService.booking>>;
type DialogKind = null | 'payment' | 'dispatch' | 'return' | 'deposit' | 'cardDeposit' | 'terms' | 'override' | 'declineRefund' | 'reject' | 'cancel' | 'close';

const FUEL = ['full', '3/4', '1/2', '1/4', 'empty'];
const CANCELLABLE: BookingStatus[] = ['pending_verification', 'approved', 'contract_pending', 'payment_pending', 'confirmed', 'handover_pending'];
const ON_HIRE: BookingStatus[] = ['active', 'overdue', 'return_pending', 'inspection_pending', 'closed', 'disputed'];
// Clients book and pay first; documents are uploaded and checked after payment, before dispatch.
const STEPS: { label: string; reached: BookingStatus[]; docs?: boolean }[] = [
  { label: 'Booked', reached: ['pending_verification', 'approved', 'contract_pending', 'payment_pending', 'confirmed', 'handover_pending', ...ON_HIRE] },
  { label: 'Paid', reached: ['confirmed', 'handover_pending', ...ON_HIRE] },
  { label: 'Documents verified', reached: ON_HIRE, docs: true },
  { label: 'Dispatched · contract started', reached: ['active', 'overdue', 'return_pending', 'inspection_pending', 'closed', 'disputed'] },
  { label: 'Returned · contract ended', reached: ['inspection_pending', 'closed', 'disputed'] },
  { label: 'Closed', reached: ['closed'] },
];

const VanBookingDetail: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setDetail(await MarketplaceService.booking(id));
      setError(null);
    } catch (e) {
      setError(errorMessage(e, 'Could not load the booking'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const run = async (fn: () => Promise<unknown>, close = true) => {
    setBusy(true);
    setActionError(null);
    try {
      await fn();
      await load();
      if (close) setDialog(null);
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Box p={6} textAlign="center"><CircularProgress /></Box>;
  if (error || !detail) return <Alert severity="error">{error || 'Booking not found'}</Alert>;

  const { booking: b, verification, payments } = detail;
  const status = b.status;
  const meta = STATUS_META[status];
  const requiredDocs = verification.items.filter((i) => i.required && !(i.type === 'driving_licence' && b.driver === 'with_driver'));
  const docsApproved = requiredDocs.every((i) => i.status === 'approved');
  const stepDone = (s: (typeof STEPS)[number]) => s.reached.includes(status) || (!!s.docs && docsApproved);
  const activeStep = STEPS.reduce((acc, s, i) => (stepDone(s) ? i : acc), -1);
  const docsMissing = requiredDocs.filter((i) => i.status !== 'approved').map((i) => `${i.label} (${i.status === 'missing' ? 'not uploaded' : i.status.replace('_', ' ')})`);
  const next = b.payment.nextDue;
  const terms = b.payment.terms;
  const card = b.payment.card;
  const upfrontDue = b.payment.upfront && b.payment.upfront.status !== 'paid' ? b.payment.upfront : null;
  const cardMissing = b.payment.cardRequired && !card;
  const cardDepositOpen = terms.depositMode === 'card_on_file' && !(b.depositDetail && ['settled_with_deductions', 'released'].includes(b.depositDetail.status));
  const chargedDepositOpen = !!b.depositDetail && b.depositDetail.mode !== 'card_on_file' && ['held', 'partially_refunded'].includes(b.depositDetail.status);
  const chargeNow = () => run(() => MarketplaceService.chargeCard(b.id), false);
  const depInfo = b.payment.deposit;
  const refundReq = b.depositRefundRequest?.status === 'requested' ? b.depositRefundRequest : null;
  const depositWhen = depInfo?.availableOn ? (depInfo.availableNow ? '' : ` (held until ${fmtDate(depInfo.availableOn)})`) : '';
  const setStatus = (s: BookingStatus, note?: string) => run(() => MarketplaceService.setStatus(b.id, s, note));
  const openDialog = (d: DialogKind) => { setActionError(null); setDialog(d); };

  return (
    <Box>
      <Button startIcon={<BackIcon />} onClick={() => navigate('/van-bookings')} sx={{ mb: 1 }}>Van bookings</Button>

      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} mb={2}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="h5" fontWeight={700}>{b.reference}</Typography>
            <Chip label={meta?.label || status} color={meta?.color || 'default'} />
            <Chip size="small" variant="outlined" label={b.source === 'admin' ? 'Booked by staff' : 'Booked in app'} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {b.vehicle.title} · {b.driver === 'with_driver' ? 'with driver' : 'self-drive'} · {fmtDate(b.quote.startDate)} - {fmtDate(b.quote.endDate)}
          </Typography>
        </Box>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 2, overflowX: 'auto' }}>
        <Stepper activeStep={activeStep + 1} alternativeLabel sx={{ minWidth: 640 }}>
          {STEPS.map((s) => <Step key={s.label} completed={stepDone(s)}><StepLabel>{s.label}</StepLabel></Step>)}
        </Stepper>
      </Paper>

      {refundReq && (
        <Alert severity="warning" sx={{ mb: 2 }} action={
          <Stack direction="row" spacing={1}>
            <Button color="inherit" size="small" onClick={() => openDialog(terms.depositMode === 'card_on_file' ? 'cardDeposit' : 'deposit')}>
              {terms.depositMode === 'card_on_file' ? 'Release / deduct' : 'Approve & refund'}
            </Button>
            <Button color="inherit" size="small" onClick={() => openDialog('declineRefund')}>Decline</Button>
          </Stack>
        }>
          <b>Deposit {terms.depositMode === 'card_on_file' ? 'release' : 'refund'} requested</b> {fmtDateTime(refundReq.requestedAt)}
          {depInfo ? ` - about ${aed(depInfo.estimate)} after open Salik / fines (${aed(depInfo.openCharges)})` : ''}.
          {refundReq.iban ? <> Bank transfer to <b>{refundReq.iban}</b> ({refundReq.accountName}).</> : terms.depositMode === 'charge' ? ' Goes back to the card it was paid with.' : ''}
        </Alert>
      )}
      {b.depositRefundRequest?.status === 'declined' && (
        <Alert severity="info" sx={{ mb: 2 }}>Refund request declined {fmtDateTime(b.depositRefundRequest.decidedAt)}: {b.depositRefundRequest.note}</Alert>
      )}

      {/* What to do next */}
      <Paper variant="outlined" sx={{ p: 2.5, mb: 2, borderColor: 'primary.light', bgcolor: 'action.hover' }}>
        <Typography variant="subtitle2" color="text.secondary" mb={1}>Next step</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} flexWrap="wrap" useFlexGap>
          {status === 'pending_verification' && (<>
            <Typography variant="body2" flex={1}>
              {docsApproved ? 'Documents approved. Approve the booking.' : 'Check the client\'s documents below, then approve.'}
            </Typography>
            <Button variant="contained" startIcon={<ApproveIcon />} disabled={busy} onClick={() => setStatus('approved', docsApproved ? '' : 'Approved by staff')}>Approve booking</Button>
            <Button color="error" startIcon={<RejectIcon />} onClick={() => openDialog('reject')}>Reject</Button>
          </>)}
          {(status === 'approved' || status === 'contract_pending') && (<>
            <Typography variant="body2" flex={1}>
              {status === 'approved' ? 'Send the rental agreement, or ask the client to pay in the app.' : 'Agreement sent. Once signed, ask for payment.'}
            </Typography>
            {status === 'approved' && <Button variant="outlined" disabled={busy} onClick={() => setStatus('contract_pending')}>Mark contract sent</Button>}
            <Button variant="outlined" disabled={busy} onClick={() => setStatus('payment_pending')}>{upfrontDue ? 'Request payment in app' : 'Ask client to add card'}</Button>
            {upfrontDue && <Button variant="contained" startIcon={<PaymentIcon />} onClick={() => openDialog('payment')}>Record payment</Button>}
          </>)}
          {status === 'payment_pending' && (<>
            <Typography variant="body2" flex={1}>
              {upfrontDue
                ? `Waiting for ${aed(upfrontDue.total)} (${upfrontDue.label.toLowerCase()}) - the client can pay by card in the app, or record a cash / transfer payment.`
                : cardMissing ? 'Waiting for the client to add a card in the app (nothing to pay upfront).' : 'Ready to confirm.'}
            </Typography>
            {upfrontDue && <Button variant="contained" startIcon={<PaymentIcon />} onClick={() => openDialog('payment')}>Record payment</Button>}
            {!upfrontDue && cardMissing && terms.depositMode === 'card_on_file' && (
              <Button variant="outlined" onClick={() => openDialog('override')}>Confirm without card</Button>
            )}
          </>)}
          {(status === 'confirmed' || status === 'handover_pending') && (<>
            <Typography variant="body2" flex={1}>
              {docsApproved
                ? 'Paid and documents approved. Hand over a vehicle to start the contract.'
                : `Paid. Waiting on documents before dispatch: ${docsMissing.join(', ')}. Review uploads in Documents below.`}
            </Typography>
            <Button variant="contained" startIcon={<DispatchIcon />} onClick={() => openDialog('dispatch')}>Dispatch vehicle</Button>
          </>)}
          {['active', 'overdue', 'return_pending'].includes(status) && (<>
            <Typography variant="body2" flex={1}>
              On hire since {fmtDateTime(b.handover?.at)} · {b.handover?.vehicle.plate}. Contract ends {fmtDate(b.quote.endDate)}.
            </Typography>
            {next && card && <Button variant="outlined" startIcon={<CardIcon />} disabled={busy} onClick={chargeNow}>Charge {card.brand} •••• {card.last4} {aed(next.total)}</Button>}
            {next && <Button variant="outlined" startIcon={<PaymentIcon />} onClick={() => openDialog('payment')}>Record {next.label.toLowerCase()} payment</Button>}
            {status === 'active' && <Button variant="outlined" color="warning" disabled={busy} onClick={() => setStatus('overdue')}>Mark overdue</Button>}
            <Button variant="contained" startIcon={<ReturnIcon />} onClick={() => openDialog('return')}>Mark returned</Button>
          </>)}
          {status === 'inspection_pending' && (<>
            <Typography variant="body2" flex={1}>
              Returned {fmtDateTime(b.returnInspection?.at)}. {depInfo?.availableOn && !depInfo.availableNow
              ? `The deposit is held until ${fmtDate(depInfo.availableOn)} (${depInfo.holdDays} days) for late Salik / fines - the client can request the refund from then.`
              : 'Settle the deposit, then close.'}
            </Typography>
            {chargedDepositOpen && <Button variant={depInfo?.availableNow ? 'contained' : 'outlined'} onClick={() => openDialog('deposit')}>Settle deposit{depositWhen}</Button>}
            {cardDepositOpen && <Button variant={depInfo?.availableNow ? 'contained' : 'outlined'} startIcon={<CardIcon />} onClick={() => openDialog('cardDeposit')}>Settle card deposit{depositWhen}</Button>}
            {next && card && <Button variant="outlined" startIcon={<CardIcon />} disabled={busy} onClick={chargeNow}>Charge {next.label.toLowerCase()} {aed(next.total)}</Button>}
            <Button variant={chargedDepositOpen || cardDepositOpen ? 'outlined' : 'contained'} onClick={() => openDialog('close')}>Close booking</Button>
            <Button color="error" disabled={busy} onClick={() => setStatus('disputed', 'Marked disputed by staff')}>Dispute</Button>
          </>)}
          {['closed', 'cancelled', 'rejected', 'expired'].includes(status) && (
            <>
              <Typography variant="body2" flex={1}>
                This booking is {meta?.label.toLowerCase()}.{(chargedDepositOpen || cardDepositOpen) ? ` Deposit still to settle${depositWhen}.` : ' No further steps.'}
              </Typography>
              {chargedDepositOpen && <Button variant="outlined" onClick={() => openDialog('deposit')}>Settle deposit</Button>}
              {cardDepositOpen && <Button variant="outlined" startIcon={<CardIcon />} onClick={() => openDialog('cardDeposit')}>Settle card deposit</Button>}
            </>
          )}
          {status === 'disputed' && (<>
            <Typography variant="body2" flex={1}>Disputed. Close it once resolved.</Typography>
            <Button variant="outlined" onClick={() => openDialog('close')}>Close booking</Button>
          </>)}
          {CANCELLABLE.includes(status) && <Button color="inherit" onClick={() => openDialog('cancel')}>Cancel booking</Button>}
        </Stack>
        {actionError && !dialog && <Alert severity="error" sx={{ mt: 2 }}>{actionError}</Alert>}
      </Paper>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems="flex-start">
        <Stack spacing={2} flex={1} width="100%">
          <Card title="Client">
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <Typography fontWeight={700}>{b.customer.fullName || '-'}</Typography>
              <Chip
                size="small"
                icon={<AppIcon />}
                label={b.customer.appActivated ? 'Using the app' : 'Not signed in yet'}
                color={b.customer.appActivated ? 'success' : 'default'}
                variant="outlined"
              />
            </Stack>
            <Info label="Mobile" value={b.customer.phone} />
            {b.customer.businessName && <Info label="Company" value={b.customer.businessName} />}
            {b.customer.email && <Info label="Email" value={b.customer.email} />}
            {!b.customer.appActivated && (
              <Typography variant="caption" color="text.secondary">They see this booking after signing in to VANLY with {b.customer.phone}.</Typography>
            )}
          </Card>

          <Card title="Documents">
            {verification.items.map((d) => <DocRow key={d.type} doc={d} onChanged={load} optional={!d.required || (d.type === 'driving_licence' && b.driver === 'with_driver')} />)}
          </Card>

          <Card title="Payments">
            {b.payment.totals && (
              <Stack direction="row" spacing={1} mb={1.5}>
                <Money label="Booking total" value={b.payment.totals.total} />
                <Money label="Paid" value={b.payment.totals.paid} tone="success" />
                <Money label="Remaining" value={b.payment.totals.remaining} tone={b.payment.totals.remaining > 0 ? 'warning' : 'success'} />
              </Stack>
            )}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1} spacing={1}>
              <Typography variant="body2" color="text.secondary">{termsSummary(terms)}</Typography>
              {!['closed', 'cancelled', 'rejected', 'expired'].includes(status) && <Button size="small" onClick={() => openDialog('terms')}>Change</Button>}
            </Stack>
            {b.payment.cardRequired && (
              <Alert severity={card ? 'success' : 'warning'} icon={<CardIcon fontSize="small" />} sx={{ mb: 1, py: 0 }}>
                {card ? `${card.brand.toUpperCase()} •••• ${card.last4} saved${card.expMonth ? ` (exp ${card.expMonth}/${String(card.expYear).slice(-2)})` : ''}${terms.autoCharge ? ' - rent is charged automatically' : ''}` : 'No card saved yet - the client adds it in the app.'}
              </Alert>
            )}
            {b.payment.installments.map((i) => (
              <Stack key={i.n} direction="row" justifyContent="space-between" alignItems="center" py={0.75}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>{i.label}{i.upfront ? ' · before handover' : ''}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    due {fmtDate(i.dueDate)}{i.rent ? ` · rent ${aed(i.rent)}` : ''}{i.delivery ? ` + delivery ${aed(i.delivery)}` : ''}{i.vat ? ` + VAT ${aed(i.vat)}` : ''}{i.deposit ? ` + deposit ${aed(i.deposit)}` : ''}{i.method ? ` · ${METHOD_LABEL[i.method] || i.method}` : ''}
                  </Typography>
                  {i.status !== 'paid' && i.lastAttempt?.status === 'failed' && (
                    <Typography variant="caption" color="error" display="block">Card charge failed {fmtDateTime(i.lastAttempt.at)}: {i.lastAttempt.error}</Typography>
                  )}
                </Box>
                <Stack alignItems="flex-end">
                  <Typography variant="body2" fontWeight={700}>{aed(i.total)}</Typography>
                  <Chip size="small" label={i.status === 'paid' ? `Paid ${fmtDate(i.paidAt)}` : ['closed', 'cancelled', 'rejected', 'expired'].includes(status) ? 'Not charged' : next?.n === i.n ? 'Next' : 'Upcoming'} color={i.status === 'paid' ? 'success' : next?.n === i.n && !['closed', 'cancelled', 'rejected', 'expired'].includes(status) ? 'warning' : 'default'} />
                </Stack>
              </Stack>
            ))}
            {payments.length > 0 && (<>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="caption" color="text.secondary">Payment records</Typography>
              {payments.map((p) => (
                <Typography key={p.id} variant="body2" sx={{ mt: 0.5 }}>
                  {fmtDateTime(p.createdAt)} · {p.linkId ? `link: ${p.description || 'payment link'}` : p.installment ? `#${p.installment}` : 'deposit'} · {aed(p.amount)} · {METHOD_LABEL[p.method] || p.method}{p.reference ? ` · ${p.reference}` : ''}{p.status !== 'paid' ? ` · ${p.status}` : ''}
                </Typography>
              ))}
            </>)}
            {b.depositDetail && (<>
              <Divider sx={{ my: 1.5 }} />
              <Info label="Deposit" value={b.depositDetail.mode === 'card_on_file'
                ? `${aed(b.depositDetail.amount)} on card · ${b.depositDetail.status === 'released' ? 'released, nothing charged' : `${aed(b.depositDetail.deductions)} charged`}`
                : `${aed(b.depositDetail.amount)} · ${b.depositDetail.status.replace(/_/g, ' ')}${b.depositDetail.refunded ? ` · ${aed(b.depositDetail.refunded)} refunded` : ''}`} />
              {b.depositDetail.deductionNote && <Info label="Deductions" value={`${aed(b.depositDetail.deductions)} - ${b.depositDetail.deductionNote}`} />}
            </>)}
          </Card>
        </Stack>

        <Stack spacing={2} width={{ xs: '100%', lg: 380 }}>
          <PaymentLinksCard booking={b} onChanged={load} />
          <ChargesCard booking={b} onChanged={load} />
          <Card title="Booking">
            {b.vehicle.image && <Box component="img" src={mediaUrl(b.vehicle.image) || ''} alt="" sx={{ width: '100%', borderRadius: 2, mb: 1.5 }} />}
            <Info label="Van" value={b.vehicle.title} />
            <Info label="Driver" value={b.driver === 'with_driver' ? 'Provided by us' : 'Self-drive'} />
            <Info label="Dates" value={`${fmtDate(b.quote.startDate)} - ${fmtDate(b.quote.endDate)}`} />
            <Info label={b.driver === 'with_driver' ? 'Driver reports to' : b.fulfilment === 'delivery' ? 'Deliver to' : 'Pickup'} value={b.deliveryAddress || b.vehicle.pickupBranch || b.vehicle.city} />
            <Info label="Insurance" value={b.quote.protection ? `${b.quote.protection.name} (${aed(b.quote.protection.monthlyPrice)}/mo, ${b.quote.protection.excessLabel})` : 'Third-party (included)'} />
            {!!b.quote.discountPct && <Info label="Package" value={`${b.quote.discountPct}% off ${aed(b.quote.listRate)}/mo`} />}
            {b.quote.coupon && <Info label="Coupon" value={`${b.quote.coupon.code} (-${aed(b.quote.coupon.discount)})`} />}
            <Info label="Rental total" value={`${aed(b.quote.payableNow)} + ${aed(b.quote.lines.deposit)} deposit`} />
            {b.notes && <Info label="Notes" value={b.notes} />}
            {b.requests.filter((r) => r.status === 'requested').map((r) => (
              <Alert key={r.id} severity="info" sx={{ mt: 1 }}>
                Client asked to {r.type === 'extension' ? 'extend to' : 'return on'} {fmtDate(r.preferredDate)}{r.notes ? ` - ${r.notes}` : ''}
              </Alert>
            ))}
          </Card>

          {b.handover && (
            <Card title="Vehicle on hire">
              <Info label="Vehicle" value={`${b.handover.vehicle.plate} · ${[b.handover.vehicle.make, b.handover.vehicle.model, b.handover.vehicle.year].filter(Boolean).join(' ')}`} />
              <Info label="Contract started" value={fmtDateTime(b.contractStartedAt || b.handover.at)} />
              <Info label="Odometer out" value={`${b.handover.odometer.toLocaleString()} km · fuel ${b.handover.fuelLevel}`} />
              {b.handover.driver && <Info label="Driver" value={`${b.handover.driver.name}${b.handover.driver.phone ? ` · ${b.handover.driver.phone}` : ''}`} />}
              {b.handover.notes && <Info label="Handover notes" value={b.handover.notes} />}
              {b.returnInspection && (<>
                <Divider sx={{ my: 1 }} />
                <Info label="Contract ended" value={fmtDateTime(b.contractEndedAt || b.returnInspection.at)} />
                <Info label="Odometer in" value={`${b.returnInspection.odometer.toLocaleString()} km · ${b.returnInspection.distance ?? '-'} km driven · fuel ${b.returnInspection.fuelLevel}`} />
                {b.returnInspection.damageNotes && <Info label="Damage" value={b.returnInspection.damageNotes} />}
              </>)}
            </Card>
          )}

          <Card title="Messages to client">
            {!(detail.messages && detail.messages.length) ? (
              <Typography variant="body2" color="text.secondary">No messages yet.</Typography>
            ) : detail.messages.map((m) => (
              <Box key={m.id} py={0.75}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" color="text.secondary" flex={1}>{fmtDateTime(m.createdAt)}{m.channel ? ` · ${m.channel}` : ''}</Typography>
                  <Chip
                    size="small"
                    label={{ sent: 'Sent', failed: 'Failed', logged: 'Not sent (messaging off)', skipped: 'Skipped' }[m.status] || m.status}
                    color={m.status === 'sent' ? 'success' : m.status === 'failed' ? 'error' : 'default'}
                    variant="outlined"
                  />
                </Stack>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{m.body}</Typography>
                {m.error && <Typography variant="caption" color="error">{m.error}</Typography>}
              </Box>
            ))}
          </Card>

          <Card title="History">
            {[...b.statusHistory].reverse().map((h, i) => (
              <Box key={i} py={0.5}>
                <Typography variant="body2" fontWeight={600}>{STATUS_META[h.status]?.label || h.status}</Typography>
                <Typography variant="caption" color="text.secondary">{fmtDateTime(h.at)}{h.note ? ` · ${h.note}` : ''}</Typography>
              </Box>
            ))}
          </Card>
        </Stack>
      </Stack>

      <PaymentDialog open={dialog === 'payment'} booking={b} busy={busy} error={actionError} onClose={() => setDialog(null)}
        onSubmit={(body) => run(() => MarketplaceService.recordPayment(b.id, body))} />
      <DispatchDialog open={dialog === 'dispatch'} booking={b} busy={busy} error={actionError} onClose={() => setDialog(null)}
        docsMissing={docsApproved ? [] : docsMissing}
        onSubmit={(body) => run(() => MarketplaceService.dispatch(b.id, body))} />
      <ReturnDialog open={dialog === 'return'} booking={b} busy={busy} error={actionError} onClose={() => setDialog(null)}
        onSubmit={(body) => run(() => MarketplaceService.markReturned(b.id, body))} />
      <DepositDialog open={dialog === 'deposit'} booking={b} busy={busy} error={actionError} onClose={() => setDialog(null)}
        onSubmit={(body) => run(() => MarketplaceService.refundDeposit(b.id, body))} />
      <TermsDialog open={dialog === 'terms'} booking={b} busy={busy} error={actionError} onClose={() => setDialog(null)}
        onSubmit={(t) => run(() => MarketplaceService.setTerms(b.id, t))} />
      <CardDepositDialog open={dialog === 'cardDeposit'} booking={b} busy={busy} error={actionError} onClose={() => setDialog(null)}
        onSubmit={(body) => run(() => MarketplaceService.settleCardDeposit(b.id, body))} />
      <NoteDialog
        open={dialog === 'declineRefund'}
        title="Decline refund request"
        label="Reason (shown to the client)"
        confirm="Decline request"
        required
        busy={busy}
        error={actionError}
        onClose={() => setDialog(null)}
        onSubmit={(note) => run(() => MarketplaceService.declineRefund(b.id, note))}
      />
      <NoteDialog
        open={dialog === 'override'}
        title="Confirm without a card"
        label="Why (e.g. deposit paid in cash, trusted client)"
        confirm="Confirm booking"
        required
        warning="There will be no card to deduct damage from."
        busy={busy}
        error={actionError}
        onClose={() => setDialog(null)}
        onSubmit={(note) => run(() => MarketplaceService.setStatus(b.id, 'confirmed', note, true))}
      />
      <NoteDialog
        open={dialog === 'reject' || dialog === 'cancel' || dialog === 'close'}
        title={dialog === 'reject' ? 'Reject booking' : dialog === 'cancel' ? 'Cancel booking' : 'Close booking'}
        label={dialog === 'close' ? 'Closing note (optional)' : 'Reason (shown in history)'}
        confirm={dialog === 'reject' ? 'Reject' : dialog === 'cancel' ? 'Cancel booking' : 'Close booking'}
        required={dialog !== 'close'}
        warning={dialog === 'close' && b.depositDetail && ['held', 'partially_refunded'].includes(b.depositDetail.status) ? 'The deposit has not been settled yet.' : undefined}
        busy={busy}
        error={actionError}
        onClose={() => setDialog(null)}
        onSubmit={(note) => setStatus(dialog === 'reject' ? 'rejected' : dialog === 'cancel' ? 'cancelled' : 'closed', note)}
      />
    </Box>
  );
};

// ---------- small building blocks ----------

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Paper variant="outlined" sx={{ p: 2.5 }}>
    <Typography variant="subtitle1" fontWeight={700} mb={1.5}>{title}</Typography>
    {children}
  </Paper>
);

const Info: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <Stack direction="row" spacing={2} py={0.5} justifyContent="space-between">
    <Typography variant="body2" color="text.secondary" flexShrink={0}>{label}</Typography>
    <Typography variant="body2" fontWeight={500} textAlign="right">{value || '-'}</Typography>
  </Stack>
);

const DOC_COLOR: Record<string, 'default' | 'success' | 'error' | 'info' | 'warning'> = {
  missing: 'default', submitted: 'info', under_review: 'info', approved: 'success', rejected: 'error', expired: 'error',
};

const DocRow: React.FC<{ doc: MpDocument; optional: boolean; onChanged: () => void }> = ({ doc, optional, onChanged }) => {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const d = doc.document;
  const review = async (status: 'approved' | 'rejected') => {
    let note: string | undefined;
    if (status === 'rejected') {
      note = window.prompt('What should the client fix? (shown in the app)') || undefined;
      if (!note) return;
    }
    setBusy(true);
    setErr(null);
    try { await MarketplaceService.reviewDocument(d!.id, status, note); onChanged(); } catch (e) { setErr(errorMessage(e)); } finally { setBusy(false); }
  };
  const view = async () => {
    try { window.open(await MarketplaceService.documentFileUrl(d!.id), '_blank'); } catch (e) { setErr(errorMessage(e, 'Could not open file')); }
  };
  return (
    <Box py={0.75}>
      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
        <Typography variant="body2" fontWeight={600} flex={1} minWidth={160}>
          {doc.label}{optional && <Typography component="span" variant="caption" color="text.secondary"> · optional</Typography>}
        </Typography>
        <Chip size="small" label={doc.status === 'missing' ? 'Not uploaded' : doc.status.replace('_', ' ')} color={DOC_COLOR[doc.status]} />
        {d?.file && <Button size="small" startIcon={<ViewIcon />} onClick={view}>View</Button>}
        {d && ['submitted', 'under_review'].includes(d.status) && (<>
          <Button size="small" color="success" disabled={busy} onClick={() => review('approved')}>Approve</Button>
          <Button size="small" color="error" disabled={busy} onClick={() => review('rejected')}>Reject</Button>
        </>)}
      </Stack>
      {d?.reviewNote && doc.status === 'rejected' && <Typography variant="caption" color="error">{d.reviewNote}</Typography>}
      {err && <Typography variant="caption" color="error" display="block">{err}</Typography>}
    </Box>
  );
};

const openCharges = (booking: MpBooking) =>
  (booking.payment.charges || []).filter((c) => c.status === 'pending' || c.status === 'billed');
const sumTotals = (list: { total: number }[]) => Math.round(list.reduce((t, c) => t + c.total, 0) * 100) / 100;

interface DialogProps<T> { open: boolean; booking: MpBooking; busy: boolean; error: string | null; onClose: () => void; onSubmit: (body: T) => void }

const PaymentDialog: React.FC<DialogProps<{ method: string; reference?: string; note?: string; includeCharges?: boolean }>> = ({ open, booking, busy, error, onClose, onSubmit }) => {
  const [method, setMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [includeCharges, setIncludeCharges] = useState(true);
  const next = booking.payment.nextDue;
  const extras = next && !next.upfront ? next.pendingExtras || 0 : 0;
  const amount = next ? Math.round((next.total + (includeCharges ? extras : 0)) * 100) / 100 : 0;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Record payment</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {next ? `${next.label}: ${aed(next.total)}` : 'Nothing due.'}
          {next?.upfront ? ' Recording it confirms the booking.' : ''}
        </Typography>
        {extras > 0 && (
          <FormControlLabel sx={{ mb: 1 }} control={<Checkbox checked={includeCharges} onChange={(e) => setIncludeCharges(e.target.checked)} />}
            label={`Include pending ${booking.payment.pendingCharges.label} (${aed(extras)})`} />
        )}
        <Stack spacing={2}>
          <TextField select label="Paid by" value={method} onChange={(e) => setMethod(e.target.value)}>
            <MenuItem value="bank_transfer">Bank transfer</MenuItem>
            <MenuItem value="cash">Cash</MenuItem>
            <MenuItem value="card_terminal">Card machine</MenuItem>
            <MenuItem value="cheque">Cheque</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </TextField>
          <TextField label={method === 'cash' ? 'Receipt no. (optional)' : 'Reference'} value={reference} onChange={(e) => setReference(e.target.value)} required={method !== 'cash'} />
          <TextField label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={busy || !next || (method !== 'cash' && !reference.trim())} onClick={() => onSubmit({ method, reference: reference.trim(), note: note.trim(), includeCharges })}>
          Record {next ? aed(amount) : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DispatchDialog: React.FC<DialogProps<{ vehicleId: string; odometer: number; fuelLevel: string; notes?: string; driverName?: string; driverPhone?: string; overrideDocuments?: boolean }> & { docsMissing: string[] }> = ({ open, booking, busy, error, onClose, onSubmit, docsMissing }) => {
  const [override, setOverride] = useState(false);
  const [vehicles, setVehicles] = useState<FleetVehicle[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState('');
  const [odometer, setOdometer] = useState('');
  const [fuelLevel, setFuelLevel] = useState('full');
  const [notes, setNotes] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const withDriver = booking.driver === 'with_driver';

  useEffect(() => {
    if (!open || vehicles) return;
    MarketplaceService.fleetVehicles().then(setVehicles).catch((e) => setLoadErr(errorMessage(e, 'Could not load vehicles')));
  }, [open, vehicles]);

  const chosen = vehicles?.find((v) => v._id === vehicleId);
  useEffect(() => { if (chosen?.mileage && !odometer) setOdometer(String(chosen.mileage)); }, [chosen, odometer]);

  const valid = vehicleId && /^\d+$/.test(odometer) && (!withDriver || driverName.trim()) && (!docsMissing.length || override);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Dispatch vehicle</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {booking.vehicle.title} for {booking.customer.fullName}. Dispatching starts the contract; the client sees the plate in the app.
        </Typography>
        <Stack spacing={2}>
          <TextField select label="Fleet vehicle" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} disabled={!vehicles} helperText={loadErr || (vehicles && !vehicles.length ? 'No vehicles in your fleet yet.' : undefined)} error={!!loadErr}>
            {(vehicles || []).map((v) => (
              <MenuItem key={v._id} value={v._id}>{v.licensePlate || 'No plate'} · {[v.make, v.model, v.year].filter(Boolean).join(' ')}{v.status && v.status !== 'Active' ? ` (${v.status})` : ''}</MenuItem>
            ))}
          </TextField>
          <Stack direction="row" spacing={2}>
            <TextField label="Odometer (km)" value={odometer} onChange={(e) => setOdometer(e.target.value.replace(/\D/g, ''))} fullWidth required />
            <TextField select label="Fuel" value={fuelLevel} onChange={(e) => setFuelLevel(e.target.value)} sx={{ minWidth: 120 }}>
              {FUEL.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
            </TextField>
          </Stack>
          {withDriver && (
            <Stack direction="row" spacing={2}>
              <TextField label="Driver name" value={driverName} onChange={(e) => setDriverName(e.target.value)} fullWidth required />
              <TextField label="Driver phone" value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} fullWidth />
            </Stack>
          )}
          <TextField label="Handover notes (existing damage, accessories)" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={2} />
          {docsMissing.length > 0 && (
            <Alert severity="warning">
              Documents not approved yet: {docsMissing.join(', ')}.
              <FormControlLabel sx={{ display: 'flex', mt: 0.5 }} control={<Checkbox size="small" checked={override} onChange={(e) => setOverride(e.target.checked)} />} label="I checked the documents in person - dispatch anyway" />
            </Alert>
          )}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={busy || !valid} onClick={() => onSubmit({ vehicleId, odometer: Number(odometer), fuelLevel, notes: notes.trim(), driverName: driverName.trim(), driverPhone: driverPhone.trim(), ...(docsMissing.length ? { overrideDocuments: override } : {}) })}>
          Dispatch & start contract
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ReturnDialog: React.FC<DialogProps<{ odometer: number; fuelLevel: string; damageNotes?: string; notes?: string }>> = ({ open, booking, busy, error, onClose, onSubmit }) => {
  const [odometer, setOdometer] = useState('');
  const [fuelLevel, setFuelLevel] = useState('full');
  const [damageNotes, setDamageNotes] = useState('');
  const out = booking.handover?.odometer || 0;
  const km = Number(odometer) - out;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Vehicle returned</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {booking.handover?.vehicle.plate} went out at {out.toLocaleString()} km, fuel {booking.handover?.fuelLevel}. This ends the contract.
        </Typography>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2}>
            <TextField label="Odometer (km)" value={odometer} onChange={(e) => setOdometer(e.target.value.replace(/\D/g, ''))} fullWidth required
              helperText={odometer && km >= 0 ? `${km.toLocaleString()} km driven` : undefined} error={!!odometer && km < 0} />
            <TextField select label="Fuel" value={fuelLevel} onChange={(e) => setFuelLevel(e.target.value)} sx={{ minWidth: 120 }}>
              {FUEL.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
            </TextField>
          </Stack>
          <TextField label="New damage (leave empty if none)" value={damageNotes} onChange={(e) => setDamageNotes(e.target.value)} multiline minRows={2} />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={busy || !odometer || km < 0} onClick={() => onSubmit({ odometer: Number(odometer), fuelLevel, damageNotes: damageNotes.trim() })}>
          Mark returned & end contract
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DepositDialog: React.FC<DialogProps<{ amount?: number; note?: string; method?: string; reference?: string; coverCharges?: boolean; early?: boolean }>> = ({ open, booking, busy, error, onClose, onSubmit }) => {
  const dep = booking.depositDetail;
  const remaining = dep ? dep.amount - (dep.refunded || 0) : 0;
  const offline = !!dep?.method && !['stripe', 'card_online'].includes(dep.method);
  const open$ = openCharges(booking);
  const chargesTotal = sumTotals(open$);
  const [cover, setCover] = useState(true);
  const covered = cover ? chargesTotal : 0;
  const maxRefund = Math.max(0, Math.round((remaining - covered) * 100) / 100);
  const [amount, setAmount] = useState(String(maxRefund));
  const [note, setNote] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  useEffect(() => { if (open) { setCover(true); setAmount(String(Math.max(0, Math.round((remaining - chargesTotal) * 100) / 100))); } }, [open, remaining, chargesTotal]);
  useEffect(() => { setAmount(String(maxRefund)); }, [maxRefund]);
  const n = Number(amount);
  const partial = n < maxRefund;
  const remainingForRefund = maxRefund;
  const early = !!booking.payment.deposit?.availableOn && !booking.payment.deposit?.availableNow;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Settle deposit</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {aed(remaining)} held. {offline ? `Paid by ${dep?.method?.replace('_', ' ')} - return it the same way.` : 'Refunded to the client\'s card through Stripe.'}
        </Typography>
        <Stack spacing={2}>
          {early && <Alert severity="warning" sx={{ py: 0 }}>Held until {fmtDate(booking.payment.deposit?.availableOn)} for late Salik / fines. Refunding now is an early refund.</Alert>}
          {chargesTotal > 0 && (
            <FormControlLabel control={<Checkbox checked={cover} onChange={(e) => setCover(e.target.checked)} disabled={chargesTotal > remaining} />}
              label={chargesTotal > remaining
                ? `Open Salik / fines ${aed(chargesTotal)} are more than the deposit - bill them instead`
                : `Take open Salik / fines (${aed(chargesTotal)}) from the deposit`} />
          )}
          <TextField label="Refund amount (AED)" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            helperText={partial ? `Deducting ${aed(remainingForRefund - n)} more` : covered ? `Deposit minus ${aed(covered)} Salik / fines` : 'Full refund'} error={n > remainingForRefund} />
          {partial && <TextField label="Reason for deduction (damage, fuel, fines)" value={note} onChange={(e) => setNote(e.target.value)} required multiline />}
          {offline && (
            <Stack direction="row" spacing={2}>
              <TextField select label="Returned by" value={method} onChange={(e) => setMethod(e.target.value)} fullWidth>
                <MenuItem value="bank_transfer">Bank transfer</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="cheque">Cheque</MenuItem>
              </TextField>
              <TextField label="Reference" value={reference} onChange={(e) => setReference(e.target.value)} fullWidth />
            </Stack>
          )}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={busy || !(n >= 0) || n > remainingForRefund || (partial && note.trim().length < 5) || (cover && chargesTotal > remaining)}
          onClick={() => onSubmit({ amount: n, note: note.trim(), coverCharges: cover && chargesTotal > 0, early, ...(offline ? { method, reference: reference.trim() } : {}) })}>
          Refund {aed(n)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const NoteDialog: React.FC<{ open: boolean; title: string; label: string; confirm: string; required: boolean; warning?: string; busy: boolean; error: string | null; onClose: () => void; onSubmit: (note: string) => void }> = ({
  open, title, label, confirm, required, warning, busy, error, onClose, onSubmit,
}) => {
  const [note, setNote] = useState('');
  useEffect(() => { if (open) setNote(''); }, [open]);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {warning && <Alert severity="warning" sx={{ mb: 2 }}>{warning}</Alert>}
        <TextField label={label} value={note} onChange={(e) => setNote(e.target.value)} fullWidth multiline minRows={2} autoFocus sx={{ mt: 1 }} />
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Back</Button>
        <Button variant="contained" color={['Close booking', 'Confirm booking'].includes(confirm) ? 'primary' : 'error'} disabled={busy || (required && note.trim().length < 3)} onClick={() => onSubmit(note.trim())}>{confirm}</Button>
      </DialogActions>
    </Dialog>
  );
};

const TermsDialog: React.FC<DialogProps<Partial<PaymentTerms>>> = ({ open, booking, busy, error, onClose, onSubmit }) => {
  const [terms, setTerms] = useState<PaymentTerms>(booking.payment.terms);
  useEffect(() => { if (open) setTerms(booking.payment.terms); }, [open, booking.payment.terms]);
  const locked = booking.payment.installments.some((i) => i.status === 'paid');
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Payment terms</DialogTitle>
      <DialogContent>
        <TermsPicker value={terms} onChange={setTerms} lockStructure={locked} deposit={booking.quote.lines.deposit} />
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={busy} onClick={() => onSubmit(locked ? { autoCharge: terms.autoCharge } : terms)}>Save terms</Button>
      </DialogActions>
    </Dialog>
  );
};

const CardDepositDialog: React.FC<DialogProps<{ amount: number; note?: string; coverCharges?: boolean; early?: boolean }>> = ({ open, booking, busy, error, onClose, onSubmit }) => {
  const max = booking.quote.lines.deposit;
  const card = booking.payment.card;
  const chargesTotal = sumTotals(openCharges(booking));
  const [amount, setAmount] = useState('0');
  const [note, setNote] = useState('');
  useEffect(() => { if (open) { setAmount(String(Math.min(chargesTotal, max))); setNote(''); } }, [open, chargesTotal, max]);
  const n = Number(amount);
  const cover = chargesTotal > 0 && chargesTotal <= max;
  const early = !!booking.payment.deposit?.availableOn && !booking.payment.deposit?.availableNow;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Settle card deposit</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          The {aed(max)} deposit is a card on file{card ? ` (${card.brand} •••• ${card.last4})` : ' - no card saved'}. Charge a deduction, or enter 0 to release it.
        </Typography>
        <Stack spacing={2}>
          <TextField label="Deduction to charge (AED)" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            helperText={n > 0 ? `Charges ${aed(n)} to the card now` : 'Nothing charged - card released'} error={n > max} />
          {early && <Alert severity="warning" sx={{ py: 0 }}>Held until {fmtDate(booking.payment.deposit?.availableOn)} for late Salik / fines. Settling now is early.</Alert>}
          {cover && <Alert severity="info" sx={{ py: 0 }}>Includes open Salik / fines {aed(chargesTotal)}. Add damage or fuel on top if needed.</Alert>}
          {chargesTotal > max && <Alert severity="warning" sx={{ py: 0 }}>Open Salik / fines {aed(chargesTotal)} are more than the deposit - bill them instead.</Alert>}
          {n > (cover ? chargesTotal : 0) && <TextField label="Reason for the extra deduction (damage, fuel)" value={note} onChange={(e) => setNote(e.target.value)} required multiline />}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={busy || !(n >= 0) || n > max || (cover && n < chargesTotal) || (n > (cover ? chargesTotal : 0) && note.trim().length < 5) || (n > 0 && !card)}
          onClick={() => onSubmit({ amount: n, note: note.trim(), coverCharges: cover, early })}>
          {n > 0 ? `Charge ${aed(n)}` : 'Release deposit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/** Booking total / paid / remaining tile at the top of the Payments card. */
const Money: React.FC<{ label: string; value: number; tone?: 'success' | 'warning' }> = ({ label, value, tone }) => (
  <Box sx={{ flex: 1, p: 1.25, borderRadius: 2, bgcolor: tone === 'success' ? '#EEF8F0' : tone === 'warning' ? '#FFF6E5' : 'grey.100', border: 1, borderColor: tone === 'success' ? 'success.light' : tone === 'warning' ? 'warning.light' : 'divider' }}>
    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
    <Typography variant="subtitle1" fontWeight={700} color={tone === 'success' ? 'success.dark' : tone === 'warning' ? 'warning.dark' : 'text.primary'}>{aed(value)}</Typography>
  </Box>
);

export default VanBookingDetail;
