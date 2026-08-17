// Efficient Move brand header/footer for PDF documents (invoices, contracts)
const BRAND = {
  name: 'EFFICIENT MOVE NEW & USED FURNITURE REMOVAL L.L.C',
  shortName: 'Efficient Move',
  subName: 'New & Used Furniture Removal L.L.C',
  tagline: 'MOVING & PASSENGER TRANSPORT',
  social: '@efficientmove',
  website: 'www.efficientmove.ae',
  email: 'info@efficientmove.ae',
  phone: '+971 - 569420950',
  city: 'Dubai, UAE',
};

const brandCss = `
  .brand-header { position: relative; background: #fff; padding: 44px 40px 32px; overflow: hidden; min-height: 130px; }
  .hd-shape { position: absolute; top: 0; bottom: 0; }
  .hd-dark { right: 0; width: 100%; background: #232B38; clip-path: polygon(66% 0, 100% 0, 100% 100%); }
  .hd-blue { right: 0; width: 100%; background: #35A3EF; clip-path: polygon(56% 0, 66% 0, 96% 100%, 88% 100%); }
  .hd-gray { right: 0; width: 100%; background: #9CA3AB; clip-path: polygon(51% 0, 56% 0, 84% 100%, 80% 100%); }
  .hd-light { right: 0; width: 100%; background: #DDDFE2; clip-path: polygon(44% 0, 51% 0, 78% 100%, 72% 100%); }
  .brand-row { position: relative; display: flex; align-items: center; gap: 18px; }
  .brand-logo svg { width: 92px; height: auto; }
  .brand-title { font-size: 18px; font-weight: 800; color: #16181D; letter-spacing: 0.3px; }
  .brand-tagline { font-size: 12px; color: #232B38; letter-spacing: 6px; margin-top: 5px; font-weight: 500; }
  .brand-footer { position: relative; background: #fff; padding: 14px 40px 50px; overflow: hidden; margin-top: 14px; }
  .f-contacts { position: relative; z-index: 2; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; max-width: 520px; margin: 0 auto; }
  .f-item { display: flex; align-items: center; gap: 6px; font-size: 10px; color: #555; }
  .f-ic { width: 18px; height: 18px; border-radius: 50%; background: #16181D; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; flex-shrink: 0; }
  .ft-shape { position: absolute; bottom: 0; left: 0; right: 0; height: 40px; }
  .ft-dark { background: #232B38; clip-path: polygon(0 40%, 14% 0, 26% 100%, 0 100%); }
  .ft-blue { background: #35A3EF; clip-path: polygon(12% 55%, 24% 8%, 46% 100%, 22% 100%); }
  .ft-gray { background: #9CA3AB; clip-path: polygon(36% 65%, 46% 25%, 64% 100%, 44% 100%); }
  .ft-light { background: #DDDFE2; clip-path: polygon(54% 75%, 62% 40%, 76% 100%, 58% 100%); }
`;

const TRUCK_SVG = `<svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg" fill="#16181D">
  <rect x="30" y="14" width="52" height="30" rx="3"/>
  <path d="M82 22h16l10 12v10h-26z"/>
  <circle cx="46" cy="48" r="7"/><circle cx="46" cy="48" r="3" fill="#fff"/>
  <circle cx="94" cy="48" r="7"/><circle cx="94" cy="48" r="3" fill="#fff"/>
  <rect x="6" y="18" width="20" height="4" rx="2"/>
  <rect x="0" y="26" width="26" height="4" rx="2"/>
  <rect x="10" y="34" width="16" height="4" rx="2"/>
</svg>`;

const brandHeaderHtml = `
  <div class="brand-header">
    <div class="hd-shape hd-light"></div>
    <div class="hd-shape hd-gray"></div>
    <div class="hd-shape hd-blue"></div>
    <div class="hd-shape hd-dark"></div>
    <div class="brand-row">
      <div class="brand-logo">${TRUCK_SVG}</div>
      <div>
        <div class="brand-title">${BRAND.name}</div>
        <div class="brand-tagline">${BRAND.tagline}</div>
      </div>
    </div>
  </div>`;

const brandFooterHtml = `
  <div class="brand-footer">
    <div class="f-contacts">
      <div class="f-item"><span class="f-ic">@</span>${BRAND.social}</div>
      <div class="f-item"><span class="f-ic">&#9993;</span>${BRAND.email}</div>
      <div class="f-item"><span class="f-ic">&#127760;</span>${BRAND.website}</div>
      <div class="f-item"><span class="f-ic">&#9742;</span>${BRAND.phone}</div>
    </div>
    <div class="ft-shape ft-dark"></div>
    <div class="ft-shape ft-blue"></div>
    <div class="ft-shape ft-gray"></div>
    <div class="ft-shape ft-light"></div>
  </div>`;

module.exports = { BRAND, brandCss, brandHeaderHtml, brandFooterHtml };
