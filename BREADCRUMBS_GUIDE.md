# 🧭 Breadcrumbs Implementation Guide

## Overview
A comprehensive breadcrumb navigation system has been implemented across the Fleet Management application using Material-UI components and React Router.

## Features
- ✅ **Automatic breadcrumb generation** from route paths
- ✅ **Dynamic breadcrumbs** for pages with IDs (invoices, vehicles, drivers, etc.)
- ✅ **Custom breadcrumb labels** when needed
- ✅ **Hierarchical navigation** with parent-child relationships
- ✅ **Modern design** following the app's design system
- ✅ **Icons support** for home/dashboard breadcrumbs
- ✅ **Responsive** and mobile-friendly

## File Structure

```
src/
├── components/
│   └── Breadcrumbs/
│       ├── Breadcrumbs.tsx          # Main breadcrumb component
│       └── index.ts                 # Exports
├── hooks/
│   └── useBreadcrumbs.ts            # Custom hook for breadcrumb logic
└── examples/
    └── BreadcrumbExamples.tsx       # Usage examples
```

## Usage

### 1. Automatic Breadcrumbs (Recommended)

Breadcrumbs are **automatically displayed** on all pages via the Navigation component. No additional code needed!

```tsx
// Navigation component already includes breadcrumbs
<Box component="main">
  <Breadcrumbs />  {/* Automatically added */}
  {children}
</Box>
```

### 2. Custom Breadcrumbs

For pages that need custom breadcrumb labels (e.g., showing invoice numbers):

```tsx
import Breadcrumbs from '@/components/Breadcrumbs';

const InvoiceDetails = () => {
  const customCrumbs = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Invoice Management', path: '/beta-invoices' },
    { label: 'Invoice #INV-2024-001' }, // Current page
  ];

  return (
    <Box>
      <Breadcrumbs customCrumbs={customCrumbs} />
      {/* Rest of your page */}
    </Box>
  );
};
```

### 3. Dynamic Breadcrumbs with Hook

Use the `useBreadcrumbs` hook for more control:

```tsx
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';

const InvoiceDetails = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);

  // Pass dynamic labels
  const breadcrumbs = useBreadcrumbs({
    dynamicLabels: {
      [id]: `Invoice #${invoice?.invoiceNumber || id}`,
    },
  });

  return <Box>{/* Your content */}</Box>;
};
```

## Configuration

### Route Mapping

Breadcrumbs are configured in [src/components/Breadcrumbs/Breadcrumbs.tsx](../src/components/Breadcrumbs/Breadcrumbs.tsx):

```tsx
export const defaultBreadcrumbConfig: BreadcrumbConfig = {
  '/dashboard': { 
    label: 'Dashboard', 
    icon: <HomeIcon /> 
  },
  '/vehicles': { 
    label: 'Vehicles', 
    parent: '/dashboard' 
  },
  '/beta-invoices': { 
    label: 'Invoice Management', 
    parent: '/dashboard' 
  },
  '/beta-invoices/new': { 
    label: 'Create Invoice', 
    parent: '/beta-invoices' 
  },
  // ... more routes
};
```

### Adding New Routes

To add breadcrumbs for a new page:

1. Add the route to `defaultBreadcrumbConfig`:

```tsx
'/my-new-page': { 
  label: 'My Page', 
  parent: '/dashboard',  // Optional parent route
  icon: <MyIcon />       // Optional icon
}
```

2. **That's it!** Breadcrumbs will automatically appear on that page.

## Styling

Breadcrumbs follow the app's design system:

```css
/* Link color (non-active) */
color: #64748B

/* Hover state */
color: #2563EB

/* Active/current page */
color: #0F172A
font-weight: 600

/* Font size */
font-size: 14px

/* Icon size */
font-size: 18px
```

### Customizing Styles

You can customize breadcrumb styles by modifying the styled components in `Breadcrumbs.tsx`:

```tsx
const BreadcrumbLink = styled(Link)(({ theme }) => ({
  color: '#64748B',           // Change link color
  fontSize: '14px',           // Change font size
  // ... other styles
}));
```

## Design System Integration

Breadcrumbs are fully integrated with the app's modern design system:

- **Typography**: 14px, weight 500/600
- **Colors**: Gray → Blue → Dark on hover
- **Spacing**: 3 units (24px) margin bottom
- **Icons**: MUI NavigateNext separator
- **Transitions**: Smooth 0.2s ease

## Examples

### Example 1: Dashboard
```
Dashboard
```
*(No breadcrumbs shown - it's the root page)*

### Example 2: Vehicles Page
```
Dashboard > Vehicles
```

### Example 3: Edit Invoice
```
Dashboard > Invoice Management > Edit Invoice
```

### Example 4: Invoice with Custom Label
```
Dashboard > Invoice Management > Invoice #INV-2024-001
```

## Hooks

### `useBreadcrumbs(options)`

Returns breadcrumb items for the current route.

```tsx
const breadcrumbs = useBreadcrumbs({
  config: customConfig,      // Optional custom config
  dynamicLabels: {           // Optional dynamic labels
    'some-id': 'Display Name'
  }
});
```

**Returns:**
```tsx
Array<{
  label: string;
  path?: string;  // Undefined for current page
  icon?: ReactNode;
}>
```

### `usePageTitle(options)`

Returns the current page title from breadcrumbs.

```tsx
const pageTitle = usePageTitle();
// Returns: "Invoice Management"
```

### `useShouldShowBreadcrumbs()`

Determines if breadcrumbs should be shown on current page.

```tsx
const showBreadcrumbs = useShouldShowBreadcrumbs();
// Returns: false on /login, /register, etc.
```

## Best Practices

### ✅ Do's
- Let breadcrumbs auto-generate from routes
- Use custom breadcrumbs for dynamic content (invoices, vehicles, etc.)
- Keep breadcrumb labels short and clear
- Maintain hierarchical relationships (parent → child)

### ❌ Don'ts
- Don't show breadcrumbs on login/register pages
- Don't create overly deep hierarchies (max 3-4 levels)
- Don't use breadcrumbs as the only navigation method
- Don't forget to add new routes to the config

## Testing

Breadcrumbs automatically adapt to your routes. Test by:

1. Navigate to a page
2. Check breadcrumb trail appears
3. Click breadcrumb links to navigate back
4. Verify styling matches design system

## Troubleshooting

### Breadcrumbs not showing?

1. Check if route is in `defaultBreadcrumbConfig`
2. Verify route is not in excluded paths (login, register, etc.)
3. Ensure Navigation component is rendering properly

### Wrong breadcrumb labels?

1. Update the label in `defaultBreadcrumbConfig`
2. Use `customCrumbs` prop for dynamic content
3. Use `useBreadcrumbs` hook with `dynamicLabels`

### Styling issues?

1. Check MUI theme is properly loaded
2. Verify design system CSS is imported
3. Inspect styled components in Breadcrumbs.tsx

## Future Enhancements

Potential improvements:

- [ ] Add keyboard navigation support
- [ ] Add breadcrumb collapsing for deep hierarchies
- [ ] Add schema.org structured data for SEO
- [ ] Add breadcrumb analytics tracking
- [ ] Add RTL (right-to-left) language support
- [ ] Add breadcrumb dropdown menus for siblings

## Resources

- **MUI Breadcrumbs**: https://mui.com/material-ui/react-breadcrumbs/
- **React Router**: https://reactrouter.com/
- **Design System**: `UI_DESIGN_SYSTEM.md`

---

**Last Updated:** February 15, 2026  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
