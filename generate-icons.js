const fs = require('fs');
const path = require('path');

/**
 * PWA Icon Generator Script
 * 
 * This script helps create placeholder SVG icons for the PWA.
 * For production, replace these with actual PNG icons generated from your logo.
 * 
 * Usage:
 *   node generate-icons.js
 * 
 * To create actual PNG icons from SVG, use tools like:
 *   - ImageMagick: convert icon.svg -resize 192x192 icon-192x192.png
 *   - Online tools: pwabuilder.com/imageGenerator
 */

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const ICONS_DIR = path.join(__dirname, 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
  console.log('✅ Created icons directory');
}

// Generate SVG icon template
function generateSVGIcon(size) {
  const strokeWidth = Math.max(2, size / 64);
  const fontSize = size / 10;
  const radius = size / 25;
  
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#000000"/>
  <g transform="translate(${size/2},${size/2})">
    <!-- Truck Icon -->
    <path d="M${-size*0.23},${-size*0.12} L${-size*0.23},${size*0.12} L${size*0.23},${size*0.12} L${size*0.23},${-size*0.12} L${size*0.16},${-size*0.12} L${size*0.16},${-size*0.16} L${-size*0.16},${-size*0.16} L${-size*0.16},${-size*0.12} Z" 
          fill="none" stroke="#ffffff" stroke-width="${strokeWidth}"/>
    <rect x="${-size*0.23}" y="${size*0.04}" width="${size*0.31}" height="${size*0.08}" fill="none" stroke="#ffffff" stroke-width="${strokeWidth}"/>
    <rect x="${size*0.08}" y="${-size*0.12}" width="${size*0.15}" height="${size*0.16}" fill="none" stroke="#ffffff" stroke-width="${strokeWidth}"/>
    <circle cx="${-size*0.16}" cy="${size*0.16}" r="${radius}" fill="#ffffff"/>
    <circle cx="${size*0.16}" cy="${size*0.16}" r="${radius}" fill="#ffffff"/>
    <line x1="${-size*0.23}" y1="${size*0.04}" x2="${size*0.08}" y2="${size*0.04}" stroke="#ffffff" stroke-width="${strokeWidth/2}"/>
    <text x="0" y="${size*0.23}" font-family="Arial, sans-serif" font-size="${fontSize}" fill="#ffffff" text-anchor="middle" font-weight="bold">FLEET</text>
  </g>
</svg>`;
}

// Generate placeholder icons
console.log('🎨 Generating placeholder PWA icons...\n');

ICON_SIZES.forEach(size => {
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(ICONS_DIR, filename);
  const svgContent = generateSVGIcon(size);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`✅ Created ${filename}`);
});

console.log('\n📝 Icon generation complete!\n');
console.log('⚠️  IMPORTANT: These are placeholder SVG icons.');
console.log('   For production, please generate PNG icons from your logo.\n');
console.log('💡 Recommended tools:');
console.log('   - https://www.pwabuilder.com/imageGenerator');
console.log('   - https://realfavicongenerator.net/');
console.log('   - ImageMagick: convert logo.png -resize 192x192 icon-192x192.png\n');
console.log('📁 Icons location: public/icons/\n');
