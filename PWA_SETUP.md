# Progressive Web App (PWA) Setup Guide

This document provides comprehensive information about the PWA implementation for the Fleet Management System.

## 🚀 Overview

The Fleet Management System has been converted into a fully functional Progressive Web App (PWA) with offline support, installability, and caching capabilities.

## ✨ Features

- ✅ **Offline Support**: App works without internet connection
- ✅ **Installable**: Can be installed on mobile and desktop devices
- ✅ **Auto-Caching**: Static assets, images, and API responses are cached
- ✅ **Service Worker**: Custom service worker with Workbox
- ✅ **Offline Fallback**: Beautiful offline page when no connection
- ✅ **Auto-Update**: Prompts users when new version is available
- ✅ **iOS & Android Support**: Works on both platforms

## 📁 PWA Files Structure

```
fleeto/
├── public/
│   ├── manifest.json          # PWA manifest file
│   ├── offline.html          # Offline fallback page
│   ├── index.html            # Updated with PWA meta tags
│   └── icons/                # PWA icons folder
│       ├── README.md
│       └── [icon files]      # 72x72 to 512x512 icons
├── src/
│   ├── service-worker.js           # Custom service worker
│   ├── serviceWorkerRegistration.js # SW registration logic
│   └── index.tsx                   # Updated with SW registration
└── config-overrides.js             # Webpack configuration
```

## 🔧 Configuration

### Manifest.json
Located at `public/manifest.json`:

```json
{
  "name": "Fleet Management System",
  "short_name": "Fleet",
  "description": "Fleet management system for vehicle tracking and monitoring",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "orientation": "portrait"
}
```

### Service Worker Features

The service worker (`src/service-worker.js`) includes:

1. **Precaching**: All build assets are precached
2. **Image Caching**: Cache First strategy for images (30 days)
3. **Static Resources**: Stale While Revalidate for CSS/JS (7 days)
4. **API Caching**: Network First for API calls (5 minutes)
5. **Google Fonts**: Cached with appropriate strategies
6. **Offline Fallback**: Shows offline.html when offline

### Caching Strategies

| Resource Type | Strategy | Cache Duration |
|--------------|----------|----------------|
| Images | Cache First | 30 days (max 60 entries) |
| CSS/JS | Stale While Revalidate | 7 days (max 60 entries) |
| API Calls | Network First | 5 minutes (max 50 entries) |
| Google Fonts (Styles) | Stale While Revalidate | - |
| Google Fonts (Files) | Cache First | 1 year (max 30 entries) |

## 🎨 Icons

### Required Sizes
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

### Generating Icons

You can generate icons using:

1. **Online Tools**:
   - [PWA Builder Image Generator](https://www.pwabuilder.com/imageGenerator)
   - [Real Favicon Generator](https://realfavicongenerator.net/)
   - [Favicon.io](https://favicon.io/favicon-converter/)

2. **Command Line** (ImageMagick):
   ```bash
   convert source-icon.png -resize 72x72 icon-72x72.png
   convert source-icon.png -resize 96x96 icon-96x96.png
   convert source-icon.png -resize 128x128 icon-128x128.png
   convert source-icon.png -resize 144x144 icon-144x144.png
   convert source-icon.png -resize 152x152 icon-152x152.png
   convert source-icon.png -resize 192x192 icon-192x192.png
   convert source-icon.png -resize 384x384 icon-384x384.png
   convert source-icon.png -resize 512x512 icon-512x512.png
   ```

3. **Node.js Script**: Use the included `generate-icons.js` script

### Icon Design Guidelines
- Use a square source image (1024x1024 recommended)
- Simple and recognizable design
- Works well at small sizes
- Transparent or solid background
- Follow platform-specific guidelines

## 🚀 Building and Deployment

### Development Mode
```bash
npm start
```
⚠️ Service worker is **disabled** in development mode for better developer experience.

### Production Build
```bash
npm run build
```

The build process will:
1. Create optimized production build
2. Generate service worker with Workbox
3. Precache all static assets
4. Create asset manifest

### Testing PWA Features

1. **Build for Production**:
   ```bash
   npm run build
   ```

2. **Serve Production Build**:
   ```bash
   npx serve -s build
   ```

3. **Open in Browser**: Navigate to `http://localhost:3000`

4. **Test PWA**:
   - Open Chrome DevTools > Application > Service Workers
   - Check "Offline" mode
   - Verify app still works
   - Check "Manifest" tab for PWA details
   - Use Lighthouse to audit PWA

## 📱 Installing on Mobile

### Android
1. Open the app in Chrome
2. Tap the three-dot menu
3. Select "Add to Home Screen" or "Install App"
4. Confirm installation

### iOS (Safari)
1. Open the app in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Name the app and tap "Add"

## 🔍 Testing Checklist

- [ ] App loads offline after first visit
- [ ] Install prompt appears (on supported devices)
- [ ] Icons display correctly on home screen
- [ ] Offline page shows when no connection
- [ ] Update notification appears for new versions
- [ ] Images load from cache
- [ ] API responses cached appropriately
- [ ] Lighthouse PWA score > 90

## 🛠️ Troubleshooting

### Service Worker Not Updating
1. Unregister old service worker:
   - Chrome DevTools > Application > Service Workers > Unregister
2. Clear cache:
   - Chrome DevTools > Application > Storage > Clear site data
3. Hard reload: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### App Not Installable
1. Check manifest.json is valid
2. Ensure HTTPS connection (or localhost)
3. Verify icons are accessible
4. Check browser console for errors
5. Use Lighthouse to diagnose issues

### Offline Mode Not Working
1. Visit app at least once while online
2. Wait for service worker to install
3. Check service worker status in DevTools
4. Verify network requests are being intercepted

### Icons Not Showing
1. Ensure all icon files exist in `public/icons/`
2. Check file paths in manifest.json
3. Verify icon sizes match manifest
4. Clear browser cache and reload

## 📊 Monitoring

### Service Worker Status
Check service worker status programmatically:

```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(registration => {
    console.log('Service Worker is ready:', registration);
  });
}
```

### Cache Storage
Inspect cached resources:

```javascript
caches.keys().then(names => {
  names.forEach(name => {
    console.log('Cache:', name);
  });
});
```

## 🔄 Update Strategy

When you deploy a new version:

1. Service worker detects new version
2. Downloads new assets in background
3. Shows update prompt to user
4. User confirms update
5. Service worker activates new version
6. Page reloads with new content

## 📚 Resources

- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Service Worker Lifecycle](https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

## 🎯 Best Practices

1. **Always use HTTPS** in production
2. **Test offline functionality** thoroughly
3. **Keep service worker updated** with app changes
4. **Monitor cache sizes** to avoid storage issues
5. **Provide clear update notifications** to users
6. **Test on multiple devices** and browsers
7. **Use Lighthouse** for regular PWA audits

## 📝 Notes

- Service worker only works in production builds
- HTTPS required for service workers (except localhost)
- Some features may not work on iOS Safari
- Cache storage limits vary by browser
- Consider implementing background sync for form submissions

## 🆘 Support

For issues or questions:
1. Check browser console for errors
2. Use Chrome DevTools Application tab
3. Run Lighthouse PWA audit
4. Check service worker logs
5. Verify manifest.json syntax

---

**Last Updated**: February 2026  
**PWA Version**: 1.0.0  
**Workbox Version**: 7.4.0
