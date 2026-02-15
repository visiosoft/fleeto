# Vehicle Document Upload Feature

## Overview
This feature allows users to upload, view, and download documents (images and PDFs) for each vehicle. Documents are stored in the `public/vehicles/{vehicleId}` folder.

## Features Implemented

### Backend
1. **File Upload Middleware** (`fleet-api/middleware/upload.js`)
   - Uses `multer` for handling multipart/form-data
   - Stores files in `public/vehicles/{vehicleId}/` directory
   - Accepts images (JPEG, PNG, GIF) and PDF files
   - Maximum file size: 10MB
   - Generates unique filenames with timestamps

2. **Vehicle Controller** (`fleet-api/controllers/vehicleController.js`)
   - `uploadDocument()` - Upload a new document
   - `getDocuments()` - Get all documents for a vehicle
   - `deleteDocument()` - Delete a document (removes file and database record)

3. **API Routes** (`fleet-api/routes/vehicleRoutes.js`)
   - `POST /api/vehicles/:id/upload-document` - Upload document (requires admin/manager role)
   - `GET /api/vehicles/:id/get-documents` - Get all documents
   - `DELETE /api/vehicles/:id/delete-document/:documentId` - Delete document (requires admin/manager role)

4. **Static File Serving** (`fleet-api/app.js`)
   - Serves uploaded files from `/vehicles/*` endpoint

### Frontend
1. **VehicleDocuments Component** (`src/components/VehicleDocuments/`)
   - Dialog-based interface for managing vehicle documents
   - File upload with drag-and-drop
   - Document type selection (Registration, Insurance, Inspection, Maintenance, License, Other)
   - Image preview with thumbnails
   - PDF file icon display
   - Download functionality
   - Delete with confirmation

2. **VehicleManagement Integration** (`src/pages/VehicleManagement.tsx`)
   - Added "Documents" button (📎) to each vehicle row
   - Opens document management dialog
   - Integrated with existing vehicle actions

## Document Structure

Each document stored in the Vehicle model includes:
```javascript
{
  type: String,        // Document type (registration, insurance, etc.)
  title: String,       // Document title/name
  url: String,         // Relative URL to the file
  uploadDate: Date,    // Timestamp when uploaded
  expiryDate: Date     // Optional expiry date
}
```

## File Storage Structure
```
public/
  vehicles/
    {vehicleId}/
      registration-1234567890.pdf
      insurance-1234567891.jpg
      inspection-1234567892.png
```

## Usage

### Upload a Document
1. Click the 📎 (Documents) button on any vehicle row
2. Click "Choose File" button
3. Select an image or PDF file (max 10MB)
4. Enter document title
5. Select document type from dropdown
6. Click "Upload Document"

### View Documents
- Images are displayed as thumbnails
- PDFs show a file icon
- Click the download icon to open/download
- Upload date is shown below each document

### Delete Documents
1. Click the delete icon on any document
2. Confirm deletion in the popup
3. File is removed from server and database

## Security
- All routes require authentication
- Upload/delete require admin or manager role
- Files are scoped to company via vehicle ownership
- File type validation prevents malicious uploads
- File size limit prevents resource exhaustion

## API Examples

### Upload Document
```bash
POST /api/vehicles/123/upload-document
Content-Type: multipart/form-data
Authorization: Bearer {token}

Form Data:
  document: <file>
  type: "insurance"
  title: "Insurance Certificate 2026"
```

### Get Documents
```bash
GET /api/vehicles/123/get-documents
Authorization: Bearer {token}
```

### Delete Document
```bash
DELETE /api/vehicles/123/delete-document/documentId
Authorization: Bearer {token}
```

## Supported File Types
- **Images**: JPEG, JPG, PNG, GIF
- **Documents**: PDF

## Future Enhancements
- Support for more file types (DOCX, XLSX)
- Bulk upload capability
- Document expiry notifications
- OCR for automatic data extraction
- Version history for documents
- Document tagging and search
