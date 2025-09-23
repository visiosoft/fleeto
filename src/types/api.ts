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
  data: {
    users: User[];
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
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
  contract?: {
    companyName: string;
    address: string;
    contactPhone: string;
    contactEmail: string;
    trn: string;
    tradeLicenseNo: string;
  };
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  includeVat: boolean;
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

export interface Company {
  _id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  logo?: string;
  taxNumber?: string;
  currency: string;
  timezone: string;
  status: 'active' | 'inactive' | 'suspended';
  subscription: {
    plan: 'free' | 'basic' | 'premium' | 'enterprise';
    startDate: string;
    endDate: string;
    status: 'active' | 'expired' | 'cancelled';
  };
  settings: {
    invoicePrefix: string;
    invoiceNumberFormat: string;
    taxRate: number;
    paymentTerms: number;
    defaultCurrency: string;
    dateFormat: string;
    timeFormat: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'user';
  status: 'active' | 'inactive';
  password?: string; // Optional for existing users
  confirmPassword?: string; // Only used in forms
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  status: 'success' | 'error';
  message?: string;
  data?: {
    user: User;
    token: string;
    company: {
      id: string;
      name: string;
      status: string;
    };
  };
} 

export interface Receipt {
  _id: string;
  invoiceId: string;
  paymentMethod: 'bank_transfer' | 'credit_card' | 'check' | 'cash' | 'other';
  amount: number;
  paymentDate: string;
  referenceNumber: string;
  notes?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  status: 'pending' | 'received' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

export interface Letterhead {
  _id: string;
  companyId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  header: {
    logo?: string;
    companyName?: string;
    tagline?: string;
    address: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    contact: {
      phone?: string;
      email?: string;
      website?: string;
    };
  };
  footer: {
    text?: string;
    includePageNumbers: boolean;
    includeDate: boolean;
  };
  styling: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    fontSize: number;
    logoSize: {
      width: number;
      height: number;
    };
  };
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  customText?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
} 