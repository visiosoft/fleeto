import React from 'react';
import { Alert, Box, FormControlLabel, FormLabel, Radio, RadioGroup, Stack, Switch, Typography } from '@mui/material';
import { PaymentTerms } from '../../services/MarketplaceService';

/** Payment terms for one booking: when rent is paid, how the deposit is secured, auto-charge. */
const TermsPicker: React.FC<{ value: PaymentTerms; onChange: (t: PaymentTerms) => void; lockStructure?: boolean; deposit?: number }> = ({
  value, onChange, lockStructure, deposit,
}) => {
  const set = (patch: Partial<PaymentTerms>) => onChange({ ...value, ...patch });
  const needsCard = value.autoCharge || value.depositMode === 'card_on_file';
  return (
    <Stack spacing={2}>
      <Box>
        <FormLabel sx={{ fontSize: 13 }}>Rent is paid</FormLabel>
        <RadioGroup value={value.rentTiming} onChange={(e) => set({ rentTiming: e.target.value as PaymentTerms['rentTiming'] })}>
          <FormControlLabel value="advance" disabled={lockStructure} control={<Radio size="small" />}
            label={<Text title="In advance" sub="Each month is paid at its start. Month 1 is due before handover." />} />
          <FormControlLabel value="arrears" disabled={lockStructure} control={<Radio size="small" />}
            label={<Text title="After each month" sub="Each month is paid when it ends. Nothing for rent is due at handover." />} />
        </RadioGroup>
      </Box>
      <Box>
        <FormLabel sx={{ fontSize: 13 }}>Security deposit{deposit ? ` (AED ${deposit.toLocaleString()})` : ''}</FormLabel>
        <RadioGroup value={value.depositMode} onChange={(e) => set({ depositMode: e.target.value as PaymentTerms['depositMode'] })}>
          <FormControlLabel value="charge" disabled={lockStructure} control={<Radio size="small" />}
            label={<Text title="Charge it upfront" sub="Taken with the first payment and refunded after return." />} />
          <FormControlLabel value="card_on_file" disabled={lockStructure} control={<Radio size="small" />}
            label={<Text title="Keep card on file" sub="Nothing charged. You can deduct up to the deposit from the card after return." />} />
        </RadioGroup>
      </Box>
      <FormControlLabel
        control={<Switch checked={value.autoCharge} onChange={(e) => set({ autoCharge: e.target.checked })} />}
        label={<Text title="Auto-charge the client's card for rent" sub="The saved card is charged on each due date (one try a day, up to 3 tries). You can also charge it any time." />}
      />
      {needsCard && (
        <Alert severity="info" sx={{ py: 0 }}>
          The client saves a card in the app when they pay or confirm. A saved card is not a reserved amount - a charge can still be declined later.
        </Alert>
      )}
      {lockStructure && <Typography variant="caption" color="text.secondary">Payments have been taken, so only auto-charge can be changed.</Typography>}
    </Stack>
  );
};

const Text: React.FC<{ title: string; sub: string }> = ({ title, sub }) => (
  <Box py={0.5}>
    <Typography variant="body2" fontWeight={600}>{title}</Typography>
    <Typography variant="caption" color="text.secondary">{sub}</Typography>
  </Box>
);

export default TermsPicker;
