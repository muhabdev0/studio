export type UserRole = "Admin" | "Manager" | "Driver" | "Employee";

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  photoURL?: string;
}

export interface Bus {
  id: string;
  name: string;
  plateNumber: string;
  capacity: number;
  maintenanceStatus: "Operational" | "Maintenance" | "Out of Service";
  assignedDriverId?: string;
  imageUrl?: string;
}

export interface Employee {
  id: string;
  fullName: string;
  role: UserRole;
  contactInfo: string;
  salary: number;
  profilePhotoUrl?: string;
}

export interface Trip {
  id: string;
  from: string;
  to: string;
  dateTime: string;
  busId: string;
  driverId: string;
  ticketPrice: number;
  totalSeats: number;
  bookedSeats: number[];
}

export interface Ticket {
  id: string;
  tripId: string;
  customerName: string;
  seatNumber: number;
  price: number;
  bookingDate: string;
}

export interface FinanceEntry {
  id: string;
  type: "Income" | "Expense";
  category: "Ticket Sale" | "Salary" | "Maintenance" | "Rent" | "Other";
  amount: number;
  date: string;
  description: string;
}
