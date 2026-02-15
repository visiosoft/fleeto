# Image Authentication Fix

## Problem
Images and documents weren't loading/downloading because:
1. Browser `<img>` tags can't send Authorization headers
2. Static file route required authentication but couldn't receive the token

## Solution Implemented

### Backend Changes

1. **Removed unauthenticated static serving** (`fleet-api/app.js`)
   - Removed: `app.use('/vehicles', express.static(...))`
   - Static files now only served through authenticated endpoint

2. **Added authenticated file serving endpoint** (`fleet-api/controllers/vehicleController.js`)
   - New method: `serveDocument(req, res)`
   - Verifies user authentication
   - Checks vehicle belongs to user's company
   - Sends file with proper headers

3. **New route** (`fleet-api/routes/vehicleRoutes.js`)
   - `GET /api/vehicles/file/:vehicleId/:filename`
   - Protected with auth middleware
   - Company-scoped access control

### Frontend Changes

1. **Updated image loading** (`src/components/VehicleDocuments/VehicleDocuments.tsx`)
   - Created `DocumentImage` component
   - Loads images using authenticated axios request
   - Converts blob to object URL for display
   - Proper cleanup on unmount

2. **Updated download function**
   - Uses axios with Authorization header
   - Downloads file as blob
   - Creates download link programmatically
   - Proper cleanup of blob URLs

## How It Works

### Image Display
```tsx
// Old (broken):
<CardMedia image={`${API_CONFIG.BASE_URL}${doc.url}`} />

// New (working):
<DocumentImage doc={doc} />
// Internally:
// 1. Fetches blob with auth token
// 2. Creates object URL
// 3. Displays in CardMedia
// 4. Cleans up on unmount
```

### File Download
```tsx
// Old (broken):
window.open(`${API_CONFIG.BASE_URL}${doc.url}`, '_blank');

// New (working):
const response = await axios.get(url, {
  headers: { Authorization: `Bearer ${token}` },
  responseType: 'blob'
});
// Creates download link and triggers download
```

## URL Format

### Old Format
```
/vehicles/vehicleId/filename.jpg
```

### New Format
```
/api/vehicles/file/vehicleId/filename.jpg
```

The component automatically converts old URLs to new format using:
```typescript
doc.url.replace('/vehicles/', '/vehicles/file/')
```

## Security Benefits

✅ **Authentication Required** - All file access requires valid JWT token
✅ **Company Scoping** - Users can only access files for vehicles in their company
✅ **No Public Access** - Files are not publicly accessible
✅ **Token in Header** - Secure transmission of credentials

## Testing

1. **Upload a document** - Should upload successfully
2. **View image thumbnail** - Should load with auth
3. **Download file** - Should download properly
4. **Try without login** - Should get auth error

## Files Modified

- `fleet-api/app.js` - Removed static serving
- `fleet-api/controllers/vehicleController.js` - Added `serveDocument()`
- `fleet-api/routes/vehicleRoutes.js` - Added `/file/:vehicleId/:filename` route
- `src/components/VehicleDocuments/VehicleDocuments.tsx` - Added auth loading

## Server Restart

✅ Backend server has been restarted with new changes
✅ Frontend can now load images with authentication
✅ Downloads work with proper auth headers
