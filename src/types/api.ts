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