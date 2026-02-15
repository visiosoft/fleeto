# 📋 Complete API Endpoints Reference

## Base URL
```
http://localhost:5000
```

## 🔐 Authentication Endpoints
**Base Path:** `/api/auth`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | User login | ❌ |
| POST | `/api/auth/register` | User registration | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |
| POST | `/api/auth/refresh` | Refresh token | ✅ |
| POST | `/api/auth/logout` | User logout | ✅ |

---

## 🚗 Vehicle Endpoints
**Base Path:** `/api/vehicles`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/vehicles` | Get all vehicles | ✅ |
| GET | `/api/vehicles/:id` | Get vehicle by ID | ✅ |
| POST | `/api/vehicles` | Create new vehicle | ✅ |
| PUT | `/api/vehicles/:id` | Update vehicle | ✅ |
| DELETE | `/api/vehicles/:id` | Delete vehicle | ✅ |
| GET | `/api/vehicles/search` | Search vehicles | ✅ |
| GET | `/api/vehicles/:id/documents` | Get vehicle documents (old) | ✅ |
| POST | `/api/vehicles/:id/documents` | Add document (old) | ✅ |
| DELETE | `/api/vehicles/:id/documents/:documentId` | Delete document (old) | ✅ |
| **POST** | **`/api/vehicles/:id/upload-document`** | **Upload document with file** | ✅ |
| **GET** | **`/api/vehicles/:id/get-documents`** | **Get all documents** | ✅ |
| **DELETE** | **`/api/vehicles/:id/delete-document/:documentId`** | **Delete document** | ✅ |
| GET | `/api/vehicles/file/:vehicleId/:filename` | Serve document file | ✅ |
| GET | `/api/vehicles/:id/maintenance` | Get maintenance records | ✅ |
| POST | `/api/vehicles/:id/maintenance` | Add maintenance record | ✅ |
| PUT | `/api/vehicles/:id/maintenance/:maintenanceId` | Update maintenance | ✅ |
| DELETE | `/api/vehicles/:id/maintenance/:maintenanceId` | Delete maintenance | ✅ |

---

## 👨‍✈️ Driver Endpoints
**Base Path:** `/api/drivers`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/drivers` | Get all drivers | ✅ |
| GET | `/api/drivers/search` | Search drivers | ✅ |
| GET | `/api/drivers/:id` | Get driver by ID | ✅ |
| POST | `/api/drivers` | Create new driver | ✅ |
| PUT | `/api/drivers/:id` | Update driver | ✅ |
| DELETE | `/api/drivers/:id` | Delete driver | ✅ |
| **POST** | **`/api/drivers/:id/upload-document`** | **Upload driver document** | ✅ |
| **GET** | **`/api/drivers/:id/get-documents`** | **Get driver documents** | ✅ |
| **DELETE** | **`/api/drivers/:id/delete-document/:documentId`** | **Delete driver document** | ✅ |
| GET | `/api/drivers/file/:driverId/:filename` | Serve driver document | ✅ |

---

## 📄 Invoice Endpoints (Beta)
**Base Path:** `/api/invoices/beta`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/invoices/beta/stats` | Get invoice statistics | ✅ |
| GET | `/api/invoices/beta` | Get all invoices | ✅ |
| GET | `/api/invoices/beta/:id` | Get invoice by ID | ✅ |
| POST | `/api/invoices/beta` | Create new invoice | ✅ |
| PUT | `/api/invoices/beta/:id` | Update invoice | ✅ |
| DELETE | `/api/invoices/beta/:id` | Delete invoice | ✅ |
| POST | `/api/invoices/beta/:id/payments` | Add payment to invoice | ✅ |
| DELETE | `/api/invoices/beta/:id/payments/:paymentId` | Delete payment | ✅ |

---

## 📄 Invoice Endpoints (Legacy)
**Base Path:** `/api/invoices`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/invoices` | Get all invoices | ✅ |
| GET | `/api/invoices/stats` | Get invoice stats | ✅ |
| GET | `/api/invoices/:id` | Get invoice by ID | ✅ |
| POST | `/api/invoices` | Create invoice | ✅ |
| PUT | `/api/invoices/:id` | Update invoice | ✅ |
| DELETE | `/api/invoices/:id` | Delete invoice | ✅ |
| POST | `/api/invoices/:id/payments` | Add payment | ✅ |
| POST | `/api/invoices/:id/send` | Send invoice | ✅ |
| GET | `/api/invoices/contract/:contractId` | Get by contract | ✅ |

---

## 🧾 Receipt Endpoints
**Base Path:** `/api/receipts`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/receipts` | Get all receipts | ✅ |
| GET | `/api/receipts/:id` | Get receipt by ID | ✅ |
| POST | `/api/receipts` | Create receipt | ✅ |
| PUT | `/api/receipts/:id` | Update receipt | ✅ |
| DELETE | `/api/receipts/:id` | Delete receipt | ✅ |

---

## 💰 Cost Endpoints
**Base Path:** `/api/costs`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/costs` | Get all costs | ✅ |
| GET | `/api/costs/:id` | Get cost by ID | ✅ |
| POST | `/api/costs` | Create cost entry | ✅ |
| PUT | `/api/costs/:id` | Update cost | ✅ |
| DELETE | `/api/costs/:id` | Delete cost | ✅ |
| GET | `/api/costs/stats` | Get cost statistics | ✅ |

---

## ⛽ Fuel Endpoints
**Base Path:** `/api/fuel`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/fuel` | Get all fuel records | ✅ |
| GET | `/api/fuel/:id` | Get fuel record by ID | ✅ |
| POST | `/api/fuel` | Create fuel record | ✅ |
| PUT | `/api/fuel/:id` | Update fuel record | ✅ |
| DELETE | `/api/fuel/:id` | Delete fuel record | ✅ |
| GET | `/api/fuel/vehicle/:vehicleId` | Get fuel by vehicle | ✅ |

---

## 🔧 Maintenance Endpoints
**Base Path:** `/api/maintenance`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/maintenance` | Get all maintenance | ✅ |
| GET | `/api/maintenance/:id` | Get by ID | ✅ |
| POST | `/api/maintenance` | Create record | ✅ |
| PUT | `/api/maintenance/:id` | Update record | ✅ |
| DELETE | `/api/maintenance/:id` | Delete record | ✅ |

---

## 💼 Expense Endpoints
**Base Path:** `/api/expenses`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/expenses` | Get all expenses | ✅ |
| GET | `/api/expenses/:id` | Get expense by ID | ✅ |
| POST | `/api/expenses` | Create expense | ✅ |
| PUT | `/api/expenses/:id` | Update expense | ✅ |
| DELETE | `/api/expenses/:id` | Delete expense | ✅ |

---

## 💵 Payroll Endpoints
**Base Path:** `/api/payroll`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/payroll` | Get all payroll | ✅ |
| GET | `/api/payroll/:id` | Get by ID | ✅ |
| POST | `/api/payroll` | Create payroll | ✅ |
| PUT | `/api/payroll/:id` | Update payroll | ✅ |
| DELETE | `/api/payroll/:id` | Delete payroll | ✅ |

---

## 📝 Notes Endpoints
**Base Path:** `/api/notes`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/notes` | Get all notes | ✅ |
| GET | `/api/notes/:id` | Get note by ID | ✅ |
| POST | `/api/notes` | Create note | ✅ |
| PUT | `/api/notes/:id` | Update note | ✅ |
| DELETE | `/api/notes/:id` | Delete note | ✅ |

---

## 📑 Letterhead Endpoints
**Base Path:** `/api/letterheads`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/letterheads` | Get all letterheads | ✅ |
| GET | `/api/letterheads/:id` | Get by ID | ✅ |
| POST | `/api/letterheads` | Create letterhead | ✅ |
| PUT | `/api/letterheads/:id` | Update letterhead | ✅ |
| DELETE | `/api/letterheads/:id` | Delete letterhead | ✅ |

---

## 📋 Contract Endpoints
**Base Path:** `/api/contracts`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/contracts` | Get all contracts | ✅ |
| GET | `/api/contracts/:id` | Get by ID | ✅ |
| POST | `/api/contracts` | Create contract | ✅ |
| PUT | `/api/contracts/:id` | Update contract | ✅ |
| DELETE | `/api/contracts/:id` | Delete contract | ✅ |

---

## 📄 Contract Template Endpoints
**Base Path:** `/api/contract-templates`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/contract-templates` | Get all templates | ✅ |
| GET | `/api/contract-templates/:id` | Get by ID | ✅ |
| POST | `/api/contract-templates` | Create template | ✅ |
| PUT | `/api/contract-templates/:id` | Update template | ✅ |
| DELETE | `/api/contract-templates/:id` | Delete template | ✅ |

---

## 🏢 Company Endpoints
**Base Path:** `/api/company`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/company` | Get company profile | ✅ |
| PUT | `/api/company` | Update company | ✅ |
| GET | `/api/companies` | Get all companies | ✅ |
| POST | `/api/companies` | Create company | ✅ |

---

## 👥 User Endpoints
**Base Path:** `/api/users`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users` | Get all users | ✅ |
| GET | `/api/users/:id` | Get user by ID | ✅ |
| POST | `/api/users` | Create user | ✅ |
| PUT | `/api/users/:id` | Update user | ✅ |
| DELETE | `/api/users/:id` | Delete user | ✅ |

---

## 📊 Dashboard Endpoints
**Base Path:** `/api/dashboard`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/dashboard/stats` | Get dashboard stats | ✅ |
| GET | `/api/dashboard/summary` | Get summary data | ✅ |
| GET | `/api/dashboard/charts` | Get chart data | ✅ |

---

## 💬 WhatsApp/Twilio Endpoints
**Base Path:** `/api/twilio-whatsapp`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/twilio-whatsapp/send` | Send WhatsApp message | ✅ |
| POST | `/api/twilio-whatsapp/webhook` | WhatsApp webhook | ❌ |
| GET | `/api/twilio-whatsapp/messages` | Get messages | ✅ |

---

## 📚 Documentation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API Info |
| GET | `/api-docs` | Swagger UI |
| GET | `/api-docs.json` | OpenAPI Spec |

---

## 🔑 Authentication

Most endpoints require a JWT Bearer token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Get Token:
```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}
```

---

## 📖 Interactive Documentation

Access the interactive Swagger UI at:
```
http://localhost:5000/api-docs
```

Features:
- ✅ Try endpoints directly
- ✅ See request/response schemas
- ✅ Test authentication
- ✅ View examples
- ✅ Download API spec

---

**Total Endpoints:** 100+  
**Last Updated:** February 15, 2026  
**API Version:** 1.0.0
