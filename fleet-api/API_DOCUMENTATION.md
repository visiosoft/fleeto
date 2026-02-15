# 📚 API Documentation Access Guide

## Quick Access

### Swagger UI (Interactive Documentation)
```
http://localhost:5000/api-docs
```

### JSON API Specification
```
http://localhost:5000/api-docs.json
```

## Starting the Backend Server

### Option 1: Development Mode (with auto-reload)
```bash
cd fleet-api
npm run dev
```

### Option 2: Production Mode
```bash
cd fleet-api
npm start
```

## Verifying the `/get-documents` Endpoint

### Endpoint Details
- **URL**: `GET /api/vehicles/:id/get-documents`
- **Full Path**: `http://localhost:5000/api/vehicles/:id/get-documents`
- **Authentication**: Required (Bearer Token)
- **Description**: Retrieves all documents for a specific vehicle

### Testing the Endpoint

#### 1. Via Swagger UI (Recommended)
1. Start the backend server
2. Open `http://localhost:5000/api-docs` in your browser
3. Find the "Vehicles" section
4. Locate `GET /api/vehicles/{id}/get-documents`
5. Click "Try it out"
6. Enter a vehicle ID
7. Add your JWT token in the "Authorize" button at top
8. Click "Execute"

#### 2. Via cURL
```bash
curl -X GET "http://localhost:5000/api/vehicles/YOUR_VEHICLE_ID/get-documents" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 3. Via Postman
1. Import the collection from `postman/Fleet_Management_API.postman_collection.json`
2. Set your token in the environment
3. Send GET request to `/api/vehicles/:id/get-documents`

#### 4. Via Browser (if you have a valid session)
```
http://localhost:5000/api/vehicles/YOUR_VEHICLE_ID/get-documents
```

## Available Endpoints

### Vehicle Document Endpoints
- `GET /api/vehicles/:id/get-documents` - Get all documents
- `POST /api/vehicles/:id/upload-document` - Upload new document
- `DELETE /api/vehicles/:id/delete-document/:documentId` - Delete document
- `GET /api/vehicles/file/:vehicleId/:filename` - Serve document file

### Driver Document Endpoints
- `GET /api/drivers/:id/get-documents` - Get all driver documents

## Response Format

### Success Response (200)
```json
{
  "status": "success",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Vehicle Registration",
      "type": "registration",
      "filename": "reg_12345.pdf",
      "uploadDate": "2024-02-15T10:30:00.000Z"
    }
  ]
}
```

### Error Response (404)
```json
{
  "status": "error",
  "message": "Vehicle not found"
}
```

## Authentication

All endpoints require authentication via JWT token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Getting a Token

1. **Login Endpoint**: `POST /api/auth/login`
```bash
curl -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

2. Use the returned token in subsequent requests

## Swagger UI Features

### Interactive Testing
- ✅ Try endpoints directly from the browser
- ✅ See request/response formats
- ✅ View all available parameters
- ✅ Test authentication
- ✅ Download API specification

### Sections Available
1. **Auth** - Login, register, token management
2. **Vehicles** - Vehicle CRUD and document management
3. **Drivers** - Driver management and documents
4. **Invoices** - Invoice operations
5. **Receipts** - Receipt management
6. **Costs** - Cost tracking
7. **Fuel** - Fuel records
8. **Maintenance** - Maintenance tracking
9. **Dashboard** - Statistics and analytics
10. **Company** - Company settings

## Troubleshooting

### Server Not Starting?
```bash
cd fleet-api
npm install
npm start
```

### Can't Access Swagger UI?
1. Verify server is running: Check console for "Server is running on port 5000"
2. Check the URL: `http://localhost:5000/api-docs` (not https)
3. Clear browser cache

### Endpoint Returns 401 Unauthorized?
1. Make sure you're logged in
2. Add token to Swagger by clicking "Authorize" button
3. Token format: `Bearer YOUR_TOKEN_HERE`

### Endpoint Returns 404?
1. Verify the vehicle ID exists in your database
2. Check you're using the correct endpoint path
3. Ensure you're accessing the right server (localhost:5000)

## Production Endpoints

If you're accessing production server:
```
https://api.mypaperlessoffice.com/api/vehicles/:id/get-documents
```

## Additional Resources

- **Postman Collection**: `postman/Fleet_Management_API.postman_collection.json`
- **Environment Variables**: `fleet-api/.env`
- **Route Definitions**: `fleet-api/routes/vehicleRoutes.js`
- **Controller Logic**: `fleet-api/controllers/vehicleController.js`

---

**Last Updated**: February 15, 2026  
**API Version**: 1.0.0  
**Server Status**: ✅ Running
