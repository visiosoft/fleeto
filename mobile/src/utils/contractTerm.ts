// Contract rate periods and expiry countdown.
//
// Contracts are not always monthly - short rentals are quoted per day or per
// week - so the rate unit travels with the contract and drives every label.

export type RateUnit = 'day' | 'week' | 'month';

// Whether the rental includes a driver. This used to be typed free-hand into
// contractType ("Monthly Without Driver"), so legacy text is inferred rather
// than discarded.
export const CONTRACT_TYPES = ['With Driver', 'Without Driver'] as const;
export type ContractType = typeof CONTRACT_TYPES[number];

export const normaliseContractType = (value: any): ContractType => {
  const text = String(value ?? '').toLowerCase();
  if (text.includes('without driver') || text.includes('self drive') || text.includes('self-drive')) {
    return 'Without Driver';
  }
  if (text.includes('with driver') || text.includes('with-driver') || text.includes('chauffeur')) {
    return 'With Driver';
  }
  // Nothing recognisable (unset, or values like "Monthly" / "2002")
  return 'Without Driver';
};

// True only when the stored value actually said something about a driver, so
// the UI can avoid asserting a default it merely guessed.
export const hasExplicitContractType = (value: any): boolean => {
  const text = String(value ?? '').toLowerCase();
  return ['without driver', 'with driver', 'with-driver', 'self drive', 'self-drive', 'chauffeur']
    .some((token) => text.includes(token));
};

export const RATE_UNITS: RateUnit[] = ['day', 'week', 'month'];

const RATE_LABELS: Record<RateUnit, { rate: string; per: string; short: string; adjective: string }> = {
  day: { rate: 'Daily Rate', per: 'per day', short: '/day', adjective: 'DAILY' },
  week: { rate: 'Weekly Rate', per: 'per week', short: '/wk', adjective: 'WEEKLY' },
  month: { rate: 'Monthly Rate', per: 'per month', short: '/mo', adjective: 'MONTHLY' },
};

// Older contracts have no rateUnit; they were all monthly by assumption.
export const normaliseRateUnit = (unit: any): RateUnit =>
  (RATE_UNITS.includes(unit) ? unit : 'month');

export const rateLabel = (unit: any) => RATE_LABELS[normaliseRateUnit(unit)].rate;
export const ratePer = (unit: any) => RATE_LABELS[normaliseRateUnit(unit)].per;
export const rateShort = (unit: any) => RATE_LABELS[normaliseRateUnit(unit)].short;
export const rateAdjective = (unit: any) => RATE_LABELS[normaliseRateUnit(unit)].adjective;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Contract length expressed in whole units of its own rate period, so a 10-day
 * rental reads "10 days" rather than being rounded to a month.
 */
export const termLength = (contract: any): string | null => {
  const start = new Date(contract?.startDate);
  const end = new Date(contract?.endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

  const days = Math.max(0, Math.round((end.getTime() - start.getTime()) / DAY_MS));
  const unit = normaliseRateUnit(contract?.rateUnit);
  if (unit === 'day') return `${days} day${days === 1 ? '' : 's'}`;
  if (unit === 'week') {
    const weeks = Math.max(1, Math.round(days / 7));
    return `${weeks} week${weeks === 1 ? '' : 's'}`;
  }
  const months = Math.max(1, Math.round(days / 30));
  return `${months} month${months === 1 ? '' : 's'}`;
};

export interface RemainingTerm {
  label: string;      // "2 months left"
  days: number;       // whole days remaining (negative once expired)
  expired: boolean;
  urgent: boolean;    // under a week - worth colouring
}

/**
 * Human countdown to the contract end date, scaled to the largest sensible
 * unit so the UI stays short: months, then weeks, then days.
 */
export const remainingTerm = (endDate: any): RemainingTerm | null => {
  if (!endDate) return null;
  const end = new Date(endDate);
  if (isNaN(end.getTime())) return null;

  // Compare whole days so "today" never reads as "0 days" mid-afternoon
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(end) - startOfDay(new Date())) / DAY_MS);

  if (days < 0) {
    const past = Math.abs(days);
    if (past >= 30) {
      const months = Math.round(past / 30);
      return { label: `Expired ${months} month${months === 1 ? '' : 's'} ago`, days, expired: true, urgent: false };
    }
    return { label: `Expired ${past} day${past === 1 ? '' : 's'} ago`, days, expired: true, urgent: false };
  }

  if (days === 0) return { label: 'Expires today', days, expired: false, urgent: true };
  if (days === 1) return { label: '1 day left', days, expired: false, urgent: true };
  if (days < 14) return { label: `${days} days left`, days, expired: false, urgent: days <= 7 };

  if (days < 60) {
    const weeks = Math.round(days / 7);
    return { label: `${weeks} weeks left`, days, expired: false, urgent: false };
  }

  const months = Math.round(days / 30);
  if (months < 12) return { label: `${months} months left`, days, expired: false, urgent: false };

  const years = Math.floor(months / 12);
  const rest = months % 12;
  return {
    label: rest ? `${years}y ${rest}m left` : `${years} year${years === 1 ? '' : 's'} left`,
    days,
    expired: false,
    urgent: false,
  };
};
