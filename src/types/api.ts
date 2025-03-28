export interface Driver {
  _id: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  licenseExpiry: string;
  contact: {
    phone: string;
    email: string;
    address: string;
  };
  status: string;
  rating: number;
  assignedVehicle: string | null;
  hireDate: string;
  employeeId: string;
  certifications: string[];
  notes: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface APIResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface APIError {
  message: string;
  status: number;
}

export interface Contract {
  _id: string;
  companyName: string;
  vehicleId: string;
  tradeLicenseNo: string;
  contractType: string;
  startDate: string;
  endDate: string;
  value: number;
  status: 'Active' | 'Expired' | 'Terminated' | 'Draft' | 'Pending' | 'Suspended' | 'Renewed';
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  notes?: string;
}

export interface Invoice {
  _id: string;
  contractId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes: string;
  paymentHistory: PaymentRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  _id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  type: 'service' | 'product' | 'other';
}

export interface PaymentRecord {
  _id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionId?: string;
  notes?: string;
}

export interface InvoiceStats {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  byStatus: {
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
    cancelled: number;
  };
} 