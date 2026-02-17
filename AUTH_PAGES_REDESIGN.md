# Authentication Pages - Modern Design

## Overview
The Login and Registration pages have been redesigned with a clean, minimalist Apple-style aesthetic to match the landing page design. The new design emphasizes simplicity, clarity, and a premium feel.

## Design Philosophy
- **Minimalist & Clean**: Inspired by Apple's design language
- **White Background**: Clean, bright, and modern
- **SF Pro Fonts**: Apple's system fonts for typography
- **No Gradients/Shadows**: Flat, minimal design approach
- **Subtle Interactions**: Smooth, fast animations (0.2s ease)

## Color Palette

### Primary Colors
- **Apple Blue**: `#0071e3` (primary action color)
- **Apple Blue Hover**: `#0077ed`
- **Dark Text**: `#1d1d1f` (primary text)
- **Medium Gray**: `#6e6e73` (secondary text, icons)

### Backgrounds
- **White**: `#ffffff` (main background)
- **Light Border**: `#e5e5e7` (borders, dividers)
- **Disabled Background**: `#e5e5e7`

## Typography

### Fonts
- **Headings**: SF Pro Display
- **Body Text**: SF Pro Text
- **Fallbacks**: -apple-system, BlinkMacSystemFont, sans-serif

### Font Weights
- **Headings**: 600 (Semibold)
- **Body**: 400 (Regular)
- **Buttons**: 500 (Medium)

### Font Sizes
- **Hero Heading**: 32px (mobile) / 44px (desktop)
- **Card Heading**: 28px (mobile) / 32px (desktop)
- **Body Text**: 17px
- **Small Text**: 15px

### Letter Spacing
- **Headings**: -0.015em (tight, Apple-style)

## Components Updated

### 1. Login Page (`src/pages/Login/Login.tsx`)

#### Features
- Clean white background
- Centered layout with company logo
- Single-column form with email and password fields
- Password visibility toggle
- Loading state with circular progress
- Error alerts with rounded corners
- Link to registration page

#### Key Elements
- **Logo**: Fleet icon + "fleeto" text in Apple blue
- **Form Container**: White card with subtle border (1px #e5e5e7)
- **Text Fields**: Rounded (12px), clean borders, Apple blue focus
- **Button**: Pill-shaped (980px radius), Apple blue background
- **Password Toggle**: Eye icon for show/hide password

#### Layout
```
┌─────────────────────────────────┐
│         Logo + "fleeto"         │
├─────────────────────────────────┤
│      "welcome back"             │
│   "sign in to your fleet..."    │
├─────────────────────────────────┤
│   [Email Field with Icon]       │
│   [Password Field with Icon]    │
│   [  Sign In Button  ]          │
│   don't have an account? sign up│
└─────────────────────────────────┘
```

### 2. Registration Page (`src/pages/Register/Register.tsx`)

#### Features
- Clean white background with centered layout
- Multi-step wizard (3 steps)
- Step 1: Company Details
- Step 2: Address Information
- Step 3: Admin Account
- Progress stepper at top
- Navigation buttons (Back/Next/Complete)
- Success/error alerts

#### Key Elements
- **Logo**: Fleet icon + "fleeto" text
- **Hero Text**: "get started for free" + "no credit card required"
- **Stepper**: Apple blue for active/completed steps
- **Form Container**: White card with subtle border
- **Text Fields**: Consistent with login page styling
- **Buttons**: 
  - **Back**: Outlined with light border
  - **Next/Complete**: Pill-shaped, Apple blue
- **Password Field**: Visibility toggle

#### Step Breakdown

**Step 1: Company Details**
- Company Name (with Business icon)
- Registration Number
- Company Email
- Phone Number

**Step 2: Address Information**
- Street Address (with Location icon)
- City
- State/Emirate
- Country
- Postal Code

**Step 3: Admin Account**
- First Name (with Person icon)
- Last Name
- Email
- Password (with visibility toggle)

#### Layout
```
┌─────────────────────────────────┐
│         Logo + "fleeto"         │
│   "get started for free"        │
│   "no credit card required"     │
├─────────────────────────────────┤
│   [Stepper: 1 → 2 → 3]         │
├─────────────────────────────────┤
│   [Form Fields for Current Step]│
│                                  │
│   [ Back ]    [ Next/Complete ] │
└─────────────────────────────────┘
│   already have an account? sign in│
└─────────────────────────────────┘
```

## Styling Specifications

### Text Fields
```tsx
sx={{
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: '17px',
    '& fieldset': {
      borderColor: '#e5e5e7',
    },
    '&:hover fieldset': {
      borderColor: '#0071e3',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#0071e3',
      borderWidth: '2px',
    },
  },
}}
```

### Primary Button (Sign In / Next / Complete)
```tsx
sx={{
  py: 1.75,
  borderRadius: '980px',
  textTransform: 'none',
  fontSize: '17px',
  fontWeight: 500,
  fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
  bgcolor: '#0071e3',
  color: '#ffffff',
  boxShadow: 'none',
  transition: 'all 0.2s ease',
  '&:hover': {
    bgcolor: '#0077ed',
    boxShadow: 'none',
    transform: 'translateY(-1px)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  '&.Mui-disabled': {
    bgcolor: '#e5e5e7',
    color: '#6e6e73',
  },
}}
```

### Secondary Button (Back)
```tsx
sx={{
  py: 1.5,
  px: 4,
  borderRadius: '980px',
  textTransform: 'none',
  fontSize: '17px',
  fontWeight: 500,
  fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
  color: '#0071e3',
  bgcolor: 'transparent',
  border: '1px solid #e5e5e7',
  transition: 'all 0.2s ease',
  '&:hover': {
    bgcolor: '#f5f5f7',
    border: '1px solid #0071e3',
  },
}}
```

### Form Container
```tsx
sx={{
  width: '100%',
  maxWidth: 440,  // Login page
  maxWidth: 'md',  // Register page (wider for multi-column)
  p: 5,
  border: '1px solid #e5e5e7',
  borderRadius: '18px',
  bgcolor: '#ffffff',
}}
```

## User Experience Improvements

1. **Visual Clarity**: Clean white background reduces visual noise
2. **Focus States**: Clear blue border on active fields (2px)
3. **Password Visibility**: Toggle to show/hide password
4. **Loading States**: Circular progress indicator during submission
5. **Error Handling**: Clean alerts with rounded corners
6. **Smooth Animations**: 0.2s transitions for hover effects
7. **Responsive Design**: Mobile-optimized with adjusted font sizes
8. **Accessibility**: Proper labels, placeholders, and focus states

## Technical Implementation

### Dependencies
- Material-UI v5 components
- React Router for navigation
- AuthContext for authentication

### Key Features
- Form validation (required fields)
- Loading states during API calls
- Error message display
- Auto-redirect after successful login/registration
- Password strength requirements (Registration)

## Files Modified
1. `src/pages/Login/Login.tsx` - Complete redesign
2. `src/pages/Register/Register.tsx` - Complete redesign

## Consistency with Landing Page
Both authentication pages now match the landing page design:
- Same color palette (Apple blue #0071e3, dark text #1d1d1f)
- Same typography (SF Pro fonts)
- Same button styles (pill-shaped, 980px radius)
- Same form field styles (12px border radius)
- Same animation timing (0.2s ease)
- Lowercase text for headings and buttons
- No shadows or gradients
- Clean, minimalist aesthetic

## Testing Checklist
- [x] Login page renders without errors
- [x] Registration page renders without errors
- [x] All text fields accept input
- [x] Password visibility toggle works
- [x] Form validation works
- [x] Loading states display correctly
- [x] Error messages display correctly
- [x] Navigation between pages works
- [x] Responsive design works on mobile
- [x] Consistent with landing page design

## Future Enhancements
- Add "Forgot Password" link
- Add social login options (Google, Apple)
- Add password strength indicator
- Add company logo upload in registration
- Add email verification step
- Add terms & conditions checkbox
