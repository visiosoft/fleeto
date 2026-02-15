# PWA Icon Assets

This folder contains icons for the Progressive Web App (PWA) at various sizes.

## Required Icon Sizes

- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

## How to Generate Icons

You can use the following tools to generate PWA icons from a source image:

1. **Online Tools:**
   - https://www.pwabuilder.com/imageGenerator
   - https://realfavicongenerator.net/
   - https://favicon.io/favicon-converter/

2. **Command Line:**
   ```bash
   # Using ImageMagick
   convert source-icon.png -resize 72x72 icon-72x72.png
   convert source-icon.png -resize 96x96 icon-96x96.png
   convert source-icon.png -resize 128x128 icon-128x128.png
   convert source-icon.png -resize 144x144 icon-144x144.png
   convert source-icon.png -resize 152x152 icon-152x152.png
   convert source-icon.png -resize 192x192 icon-192x192.png
   convert source-icon.png -resize 384x384 icon-384x384.png
   convert source-icon.png -resize 512x512 icon-512x512.png
   ```

## Icon Design Guidelines

- Use a square source image (recommended: 1024x1024 or higher)
- Ensure the icon looks good at small sizes
- Use a transparent background or solid color matching your brand
- Keep the design simple and recognizable
- Follow platform-specific guidelines for iOS and Android

## Current Status

⚠️ **Action Required:** Please add your custom icons to this folder.

If you don't have custom icons yet, you can use placeholder icons or generate them from your logo.
