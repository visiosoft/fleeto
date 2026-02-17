# Landing Page Design System

## 🎨 Color Palette

### Primary Colors
```css
--primary-dark: #0B3C5D      /* Deep Navy - Main brand color */
--primary-medium: #1e5a7d     /* Medium Blue - Gradients */
--secondary: #328B9B          /* Teal - Accents and hover states */
```

### Background Colors
```css
--bg-white: #ffffff           /* Pure white */
--bg-gray-50: #f8fafb         /* Very light gray - sections */
--bg-gray-100: #f1f5f9        /* Light gray - cards */
--bg-gray-200: #e2e8f0        /* Borders */
```

### Text Colors
```css
--text-primary: #0B3C5D       /* Headings */
--text-secondary: #64748b     /* Body text */
--text-muted: rgba(255, 255, 255, 0.8)  /* Light text on dark bg */
```

### State Colors
```css
--success: #059669            /* Green - positive states */
--error: #dc2626              /* Red - alerts/warnings */
--warning: #f59e0b            /* Orange - caution */
--info: #328B9B               /* Blue - information */
--purple: #7c3aed             /* Purple - special features */
```

### Gradients
```css
/* Hero gradient */
background: linear-gradient(135deg, #0B3C5D 0%, #1e5a7d 50%, #328B9B 100%);

/* CTA gradient */
background: linear-gradient(135deg, #0B3C5D 0%, #328B9B 100%);
```

## 📐 Spacing System

Based on 8px grid:

```css
--space-1: 8px    (0.5rem)
--space-2: 16px   (1rem)
--space-3: 24px   (1.5rem)
--space-4: 32px   (2rem)
--space-5: 40px   (2.5rem)
--space-6: 48px   (3rem)
--space-8: 64px   (4rem)
--space-10: 80px  (5rem)
--space-12: 96px  (6rem)
--space-16: 128px (8rem)
```

### Section Spacing
```typescript
// Vertical padding for sections
py: { xs: 8, md: 12 }  // 64px mobile, 96px desktop
py: { xs: 10, md: 14 } // 80px mobile, 112px desktop
```

## 🔤 Typography

### Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Font Weights
```css
--weight-light: 300
--weight-regular: 400
--weight-medium: 500
--weight-semibold: 600
--weight-bold: 700
--weight-extrabold: 800
```

### Font Sizes (Responsive)

#### Headings
```typescript
// H1 - Hero headline
fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' }  // 40px → 56px → 72px

// H2 - Section titles
fontSize: { xs: '2rem', md: '3rem' }  // 32px → 48px

// H3 - Subsection titles
fontSize: { xs: '1.5rem', md: '2rem' }  // 24px → 32px

// H4
fontSize: { xs: '1.3rem', md: '1.5rem' }  // 21px → 24px

// H5
fontSize: { xs: '1.1rem', md: '1.3rem' }  // 18px → 21px

// H6
fontSize: { xs: '1rem', md: '1.2rem' }  // 16px → 19px
```

#### Body Text
```typescript
// Large body
fontSize: '1.1rem'  // 18px

// Regular body
fontSize: '1rem'    // 16px

// Small body
fontSize: '0.95rem' // 15px

// Caption/label
fontSize: '0.9rem'  // 14px
```

### Line Heights
```css
--line-height-tight: 1.1   /* Headings */
--line-height-snug: 1.2    /* Hero text */
--line-height-normal: 1.5  /* UI text */
--line-height-relaxed: 1.7 /* Body paragraphs */
--line-height-loose: 1.8   /* Long-form content */
```

## 🎯 Border Radius

```css
--radius-sm: 8px     /* Small elements */
--radius-md: 12px    /* Buttons, inputs */
--radius-lg: 16px    /* Cards */
--radius-xl: 20px    /* Large cards */
--radius-2xl: 24px   /* Hero elements */
--radius-full: 50px  /* Pills, badges */
--radius-circle: 50% /* Circular elements */
```

## 🌑 Shadows

### Elevation System
```typescript
// Small - Subtle lift
boxShadow: '0 2px 8px rgba(11, 60, 93, 0.08)'

// Medium - Cards
boxShadow: '0 8px 24px rgba(11, 60, 93, 0.1)'

// Large - Elevated cards
boxShadow: '0 12px 40px rgba(11, 60, 93, 0.12)'

// Extra Large - Modals, popovers
boxShadow: '0 20px 60px rgba(11, 60, 93, 0.15)'

// Button hover
boxShadow: '0 4px 12px rgba(11, 60, 93, 0.2)'
boxShadow: '0 6px 16px rgba(11, 60, 93, 0.3)'  // Active state
```

## 🎭 Transitions

### Standard Transitions
```css
transition: all 0.3s ease
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
```

### Transform Transitions
```typescript
// Hover lift
'&:hover': {
  transform: 'translateY(-4px)',
  transition: 'all 0.3s ease',
}

// Button hover
'&:hover': {
  transform: 'translateY(-2px)',
  transition: 'all 0.3s ease',
}
```

## 🎨 Component Styles

### Buttons

#### Primary Button
```typescript
{
  bgcolor: '#0B3C5D',
  color: 'white',
  fontWeight: 700,
  fontSize: '1.15rem',
  px: 6,
  py: 2.5,
  borderRadius: '12px',
  textTransform: 'none',
  boxShadow: '0 4px 12px rgba(11, 60, 93, 0.2)',
  '&:hover': {
    bgcolor: '#328B9B',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(11, 60, 93, 0.3)',
  },
  transition: 'all 0.3s ease',
}
```

#### Secondary Button (Outlined)
```typescript
{
  color: '#0B3C5D',
  borderColor: '#0B3C5D',
  fontWeight: 600,
  fontSize: '1.15rem',
  px: 6,
  py: 2.5,
  borderRadius: '12px',
  textTransform: 'none',
  '&:hover': {
    borderColor: '#328B9B',
    bgcolor: 'rgba(11, 60, 93, 0.05)',
  },
  transition: 'all 0.3s ease',
}
```

### Cards

#### Standard Feature Card
```typescript
{
  p: 4,
  height: '100%',
  bgcolor: '#f8fafb',
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 32px rgba(11, 60, 93, 0.1)',
    bgcolor: 'white',
    borderColor: '#328B9B',
  },
}
```

#### Large Benefit Card
```typescript
{
  p: 5,
  height: '100%',
  bgcolor: '#f8fafb',
  border: '2px solid #e2e8f0',
  borderRadius: '20px',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-6px)',
    boxShadow: '0 16px 48px rgba(11, 60, 93, 0.12)',
    borderColor: 'accent-color',
  },
}
```

### Icon Boxes
```typescript
{
  width: 56,
  height: 56,
  borderRadius: '12px',
  bgcolor: '#e8f4f8',
  color: '#0B3C5D',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  mb: 3,
  transition: 'all 0.3s ease',
  '& svg': {
    fontSize: 28,
  },
}
```

### Badges/Pills
```typescript
{
  display: 'inline-flex',
  alignItems: 'center',
  gap: 1,
  bgcolor: 'rgba(255, 255, 255, 0.15)',
  backdropFilter: 'blur(10px)',
  px: 3,
  py: 1,
  borderRadius: '50px',
  border: '1px solid rgba(255, 255, 255, 0.2)',
}
```

## 📱 Responsive Patterns

### Container Max Widths
```typescript
maxWidth: 'lg'  // 1200px - Most sections
maxWidth: 'md'  // 900px - CTA and narrow content
```

### Grid Layouts
```typescript
// 3-column feature grid
<Grid container spacing={3}>
  <Grid item xs={12} sm={6} md={4}>
    // 1 col mobile, 2 col tablet, 3 col desktop

// 2-column layout
<Grid item xs={12} md={6}>
  // 1 col mobile, 2 col desktop

// Stats grid
<Grid item xs={6} md={3}>
  // 2 col mobile, 4 col desktop
```

### Spacing Adjustments
```typescript
py: { xs: 8, md: 12 }   // Vertical padding
px: { xs: 2, md: 4 }    // Horizontal padding
gap: { xs: 3, md: 6 }   // Gap between elements
```

## 🎯 Hover States

### Links
```typescript
{
  color: 'rgba(255, 255, 255, 0.8)',
  textDecoration: 'none',
  transition: 'all 0.2s ease',
  '&:hover': {
    color: 'white',
    pl: 0.5,  // Slight indent on hover
  },
}
```

### Icon Buttons
```typescript
{
  color: 'rgba(255, 255, 255, 0.7)',
  bgcolor: 'rgba(255, 255, 255, 0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    color: 'white',
    bgcolor: '#328B9B',
    transform: 'translateY(-2px)',
  },
}
```

## ✨ Animations

### Fade In Up
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

animation: fadeInUp 0.8s ease-out 0.2s both;
```

### Pulse (Background)
```css
@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

animation: pulse 8s ease-in-out infinite;
```

## 🎨 Usage Examples

### Hero Section Pattern
```typescript
<Box
  sx={{
    pt: { xs: 12, md: 16 },
    pb: { xs: 10, md: 14 },
    background: 'linear-gradient(135deg, #0B3C5D 0%, #328B9B 100%)',
  }}
>
  <Typography
    variant="h1"
    sx={{
      fontSize: { xs: '2.5rem', md: '4.5rem' },
      fontWeight: 800,
      lineHeight: 1.1,
    }}
  >
    Headline
  </Typography>
</Box>
```

### Section Header Pattern
```typescript
<Box sx={{ textAlign: 'center', mb: 8 }}>
  <Typography
    variant="h2"
    sx={{
      fontSize: { xs: '2rem', md: '3rem' },
      fontWeight: 700,
      color: '#0B3C5D',
      mb: 2,
    }}
  >
    Section Title
  </Typography>
  <Typography
    variant="h6"
    sx={{
      fontSize: { xs: '1rem', md: '1.2rem' },
      color: '#64748b',
      maxWidth: 700,
      mx: 'auto',
      lineHeight: 1.7,
    }}
  >
    Section description
  </Typography>
</Box>
```

---

**Use this design system to maintain consistency across all landing page components and future additions.**
