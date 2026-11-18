/**
 * Per-company marketplace settings (mp_settings, one document per organization):
 *  - protectionPlans: optional cover on top of the included third-party insurance, priced per month
 *  - durations: booking packages (months) with a % discount on the monthly rent
 * Companies without a saved document get DEFAULTS (editable from the web admin).
 */
const { col } = require('./store');

const DEFAULTS = Object.freeze({
  includedCover: {
    name: 'Third-party insurance',
    description: 'Included. Covers damage to other people and vehicles. Damage to the rented van is paid by the renter.',
  },
  protectionPlans: [
    { id: 'full', name: 'Full Cover', tagline: 'Comprehensive insurance', monthlyPrice: 350, excess: 2000, excessLabel: 'AED 2,000 excess per claim', recommended: false, active: true },
    { id: 'full_plus', name: 'Full Cover Plus', tagline: 'Comprehensive, 50% less excess', monthlyPrice: 450, excess: 1000, excessLabel: 'AED 1,000 excess per claim', recommended: true, active: true },
    { id: 'full_pro', name: 'Full Cover Pro', tagline: 'Comprehensive, zero excess', monthlyPrice: 550, excess: 0, excessLabel: 'No excess to pay', recommended: false, active: true },
  ],
  durations: [
    { months: 1, label: 'Monthly', discountPct: 0 },
    { months: 3, label: '3 Months', discountPct: 5 },
    { months: 6, label: '6 Months', discountPct: 8 },
    { months: 12, label: 'Yearly', discountPct: 12 },
  ],
});

const clone = (o) => JSON.parse(JSON.stringify(o));

async function getSettings(organizationId) {
  const settings = await col('settings');
  const doc = organizationId ? await settings.findOne({ organizationId: String(organizationId) }) : null;
  return {
    includedCover: doc?.includedCover || clone(DEFAULTS.includedCover),
    protectionPlans: doc?.protectionPlans || clone(DEFAULTS.protectionPlans),
    durations: (doc?.durations || clone(DEFAULTS.durations)).slice().sort((a, b) => a.months - b.months),
    isDefault: !doc,
  };
}

/** Discount % for a number of months: the best package at or below it. */
function discountFor(durations, months) {
  let pct = 0;
  for (const d of durations) if (months >= d.months) pct = Math.max(pct, Number(d.discountPct) || 0);
  return pct;
}

function publicPlans(settings) {
  return settings.protectionPlans.filter((p) => p.active).map((p) => ({
    id: p.id, name: p.name, tagline: p.tagline, monthlyPrice: p.monthlyPrice, excess: p.excess, excessLabel: p.excessLabel, recommended: !!p.recommended,
  }));
}

function validate(input) {
  const errors = [];
  const out = {};
  if (input.includedCover !== undefined) {
    const name = String(input.includedCover?.name || '').trim().slice(0, 60);
    const description = String(input.includedCover?.description || '').trim().slice(0, 300);
    if (!name) errors.push('includedCover.name is required');
    out.includedCover = { name, description };
  }
  if (input.protectionPlans !== undefined) {
    if (!Array.isArray(input.protectionPlans) || input.protectionPlans.length > 6) errors.push('protectionPlans must be a list of up to 6 plans');
    else {
      const ids = new Set();
      out.protectionPlans = input.protectionPlans.map((p, i) => {
        const id = String(p.id || `plan_${i + 1}`).toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 30);
        if (ids.has(id)) errors.push(`duplicate plan id ${id}`);
        ids.add(id);
        const monthlyPrice = Math.round(Number(p.monthlyPrice) * 100) / 100;
        const excess = Math.round(Number(p.excess) * 100) / 100;
        if (!String(p.name || '').trim()) errors.push(`plan ${i + 1}: name is required`);
        if (!(monthlyPrice > 0 && monthlyPrice < 100000)) errors.push(`plan ${i + 1}: monthly price must be more than 0`);
        if (!(excess >= 0 && excess < 1000000)) errors.push(`plan ${i + 1}: excess must be 0 or more`);
        return {
          id, name: String(p.name || '').trim().slice(0, 40), tagline: String(p.tagline || '').trim().slice(0, 80),
          monthlyPrice, excess, excessLabel: String(p.excessLabel || (excess ? `AED ${excess.toLocaleString('en-US')} excess per claim` : 'No excess to pay')).trim().slice(0, 60),
          recommended: !!p.recommended, active: p.active !== false,
        };
      });
    }
  }
  if (input.durations !== undefined) {
    if (!Array.isArray(input.durations) || !input.durations.length || input.durations.length > 6) errors.push('durations must be a list of 1-6 packages');
    else {
      const seen = new Set();
      out.durations = input.durations.map((d, i) => {
        const months = Number(d.months);
        const discountPct = Number(d.discountPct) || 0;
        if (!Number.isInteger(months) || months < 1 || months > 12) errors.push(`package ${i + 1}: months must be 1-12`);
        if (seen.has(months)) errors.push(`package ${months} months is listed twice`);
        seen.add(months);
        if (!(discountPct >= 0 && discountPct <= 50)) errors.push(`package ${i + 1}: discount must be 0-50%`);
        return { months, label: String(d.label || (months === 1 ? 'Monthly' : months === 12 ? 'Yearly' : `${months} Months`)).trim().slice(0, 20), discountPct };
      }).sort((a, b) => a.months - b.months);
      if (!seen.has(1)) errors.push('include a 1-month package');
    }
  }
  return { errors, value: out };
}

async function saveSettings(organizationId, input, by) {
  const { errors, value } = validate(input || {});
  if (errors.length) {
    const err = new Error(errors.join('; '));
    err.status = 400;
    throw err;
  }
  const current = await getSettings(organizationId);
  const next = {
    includedCover: value.includedCover || current.includedCover,
    protectionPlans: value.protectionPlans || current.protectionPlans,
    durations: value.durations || current.durations,
  };
  const settings = await col('settings');
  const existing = await settings.findOne({ organizationId: String(organizationId) });
  if (existing) await settings.updateOne({ _id: existing._id }, { $set: { ...next, updatedAt: new Date(), updatedBy: by } });
  else await settings.insertOne({ organizationId: String(organizationId), ...next, createdAt: new Date(), updatedBy: by });
  return getSettings(organizationId);
}

module.exports = { DEFAULTS, getSettings, saveSettings, discountFor, publicPlans };
