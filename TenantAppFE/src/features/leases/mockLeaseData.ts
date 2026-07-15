export type OwnerLeaseStatus = 'ACTIVE' | 'UPCOMING' | 'ENDING_SOON' | 'ENDED';

export interface OwnerLeaseSummary {
  id: string;
  tenantName: string;
  tenantPhone: string;
  propertyName: string;
  unitNumber: string;
  floorLabel: string;
  moveInDate: string;
  moveOutDate?: string;
  rentAmount: string;
  securityDeposit: string;
  status: OwnerLeaseStatus;
  assignedInventoryCount: number;
  pendingChecklistCount: number;
}

export const ownerLeaseStats = [
  { label: 'Active Leases', value: '36', helper: 'Across 3 properties' },
  { label: 'Move-ins This Month', value: '05', helper: 'Need assignment checks' },
  { label: 'Move-outs Pending', value: '03', helper: 'Awaiting verification' },
  { label: 'Deposit Liability', value: 'Rs. 10.8L', helper: 'Locked deposits' },
];

export const ownerLeases: OwnerLeaseSummary[] = [
  {
    id: 'L-8824',
    tenantName: 'Jordan Mitchell',
    tenantPhone: '+91 98765 12001',
    propertyName: 'Riverside Lofts',
    unitNumber: '402-B',
    floorLabel: 'Floor 4',
    moveInDate: 'Jul 20, 2026',
    rentAmount: 'Rs. 42,000',
    securityDeposit: 'Rs. 1,26,000',
    status: 'UPCOMING',
    assignedInventoryCount: 4,
    pendingChecklistCount: 5,
  },
  {
    id: 'L-7142',
    tenantName: 'Alex Rivera',
    tenantPhone: '+91 98765 12002',
    propertyName: 'Skyline Apartments',
    unitNumber: '302-A',
    floorLabel: 'Floor 3',
    moveInDate: 'Jan 01, 2025',
    moveOutDate: 'Jul 28, 2026',
    rentAmount: 'Rs. 36,000',
    securityDeposit: 'Rs. 30,000',
    status: 'ENDING_SOON',
    assignedInventoryCount: 9,
    pendingChecklistCount: 3,
  },
  {
    id: 'L-6910',
    tenantName: 'Priya Nair',
    tenantPhone: '+91 98765 12003',
    propertyName: 'Highline Ridge',
    unitNumber: '101',
    floorLabel: 'Floor 1',
    moveInDate: 'Feb 14, 2026',
    rentAmount: 'Rs. 28,000',
    securityDeposit: 'Rs. 84,000',
    status: 'ACTIVE',
    assignedInventoryCount: 6,
    pendingChecklistCount: 0,
  },
  {
    id: 'L-6455',
    tenantName: 'Rahul Sharma',
    tenantPhone: '+91 98765 12004',
    propertyName: 'Riverside Lofts',
    unitNumber: '105',
    floorLabel: 'Floor 1',
    moveInDate: 'May 01, 2024',
    moveOutDate: 'Jun 30, 2026',
    rentAmount: 'Rs. 31,500',
    securityDeposit: 'Rs. 94,500',
    status: 'ENDED',
    assignedInventoryCount: 5,
    pendingChecklistCount: 0,
  },
];
