// Vehicle related interfaces
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  licensePlate: string;
  registrationExpiry: string;
  status: 'active' | 'maintenance' | 'inactive';
  currentDriver?: string;
  fuelType: string;
  currentMileage: number;
  lastServiceDate: string;
}

export interface FuelRecord {
  id: string;
  vehicleId: string;
  date: string;
  gallons: number;
  cost: number;
  odometer: number;
  fuelType: string;
  location: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: 'scheduled' | 'repair' | 'inspection';
  description: string;
  date: string;
  cost: number;
  provider: string;
  status: 'completed' | 'scheduled' | 'in-progress';
  notes?: string;
}

// Driver related interfaces
export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  licenseExpiry: string;
  contactNumber: string;
  email: string;
  status: 'active' | 'inactive' | 'on-leave';
  assignedVehicleId?: string;
  hireDate: string;
  performanceScore?: number;
}

export interface DriverPerformance {
  id: string;
  driverId: string;
  date: string;
  speedingEvents: number;
  harshBrakingEvents: number;
  harshAccelerationEvents: number;
  idlingTime: number;
  totalDrivingTime: number;
  distanceDriven: number;
  fuelEfficiency: number;
}

// Location and tracking interfaces
export interface Location {
  latitude: number;
  longitude: number;
  timestamp: string;
  speed: number;
  heading: number;
  vehicleId: string;
}

export interface Route {
  id: string;
  vehicleId: string;
  driverId: string;
  startLocation: Location;
  endLocation: Location;
  waypoints: Location[];
  startTime: string;
  endTime?: string;
  status: 'planned' | 'in-progress' | 'completed';
  distance: number;
  estimatedDuration: number;
}

// Cost and expense interfaces
export interface Expense {
  id: string;
  vehicleId?: string;
  driverId?: string;
  date: string;
  category: 'fuel' | 'maintenance' | 'insurance' | 'toll' | 'other';
  amount: number;
  description: string;
  receipt?: string;
}

// Alert and notification interfaces
export interface Alert {
  id: string;
  type: 'maintenance' | 'fuel' | 'geofence' | 'driver' | 'system';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
  status: 'new' | 'read' | 'resolved';
  vehicleId?: string;
  driverId?: string;
}

// User management interfaces
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'fleet_manager' | 'driver' | 'maintenance';
  permissions: string[];
  lastLogin?: string;
} 