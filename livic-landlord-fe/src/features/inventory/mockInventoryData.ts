import type { ComponentProps } from 'react';
import { MaterialIcons } from '@expo/vector-icons';

export type InventoryCondition = 'Excellent' | 'Good' | 'Fair' | 'Damaged';
export type InventoryStatus = 'Assigned' | 'Available' | 'Shared' | 'Service Due';
export type AssignmentStatus = 'Selected' | 'Draft' | 'Unselected';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  location: string;
  serial: string;
  condition: InventoryCondition;
  status: InventoryStatus;
  nextService: string;
  value: string;
  shared: boolean;
  icon: ComponentProps<typeof MaterialIcons>['name'];
  image: string;
  notes: string;
}

export interface AssignmentItem extends InventoryItem {
  assignmentStatus: AssignmentStatus;
  assignmentCondition: InventoryCondition;
  photoCount: number;
}

export interface VerificationItem {
  id: string;
  name: string;
  area: string;
  icon: ComponentProps<typeof MaterialIcons>['name'];
  moveInCondition: InventoryCondition;
  returnCondition: InventoryCondition;
  damageDescription: string;
  deduction: number;
  status: 'Damaged' | 'Good' | 'Review';
  moveInPhoto: string;
  returnPhoto: string;
}

export const inventoryStats = [
  { label: 'Total Assets', value: '412', helper: '+12 this month', icon: 'trending-up' as const },
  { label: 'Maintenance Due', value: '08', helper: 'High priority items', icon: 'warning' as const },
  { label: 'Unassigned', value: '24', helper: 'Ready for move-in', icon: 'inventory-2' as const },
  { label: 'Valuation', value: 'Rs. 82L', helper: 'Replacement cost', icon: 'calculate' as const },
];

export const inventoryItems: InventoryItem[] = [
  {
    id: 'FSC-402-APP01',
    name: 'Samsung Bespoke Refrigerator',
    category: 'Appliances',
    location: 'Unit 402',
    serial: 'SAM-8231-90X',
    condition: 'Excellent',
    status: 'Assigned',
    nextService: 'Aug 12, 2026',
    value: 'Rs. 86,000',
    shared: false,
    icon: 'kitchen',
    image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=900&q=80',
    notes: 'Smart hub, shelves, and compressor warranty verified.',
  },
  {
    id: 'FSC-ROOF-HVAC01',
    name: 'Central HVAC System',
    category: 'HVAC',
    location: 'Shared Roof',
    serial: 'HVAC-2209-RF',
    condition: 'Fair',
    status: 'Service Due',
    nextService: 'Jul 20, 2026',
    value: 'Rs. 3,20,000',
    shared: true,
    icon: 'ac-unit',
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80',
    notes: 'Quarterly service overdue; filters need inspection.',
  },
  {
    id: 'FSC-105-FUR09',
    name: 'Grey Linen Sectional Sofa',
    category: 'Furniture',
    location: 'Unit 105',
    serial: 'FUR-LIV-099',
    condition: 'Good',
    status: 'Available',
    nextService: 'Sep 02, 2026',
    value: 'Rs. 42,000',
    shared: false,
    icon: 'chair',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80',
    notes: 'Steam cleaned after previous checkout.',
  },
  {
    id: 'FSC-LOBBY-LDY01',
    name: 'Industrial Washing Machine',
    category: 'Laundry',
    location: 'Lobby Shared',
    serial: 'LG-DRUM-XL',
    condition: 'Excellent',
    status: 'Shared',
    nextService: 'Aug 28, 2026',
    value: 'Rs. 1,10,000',
    shared: true,
    icon: 'local-laundry-service',
    image: 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?auto=format&fit=crop&w=900&q=80',
    notes: 'Common-area item visible to all active tenants.',
  },
];

export const assignmentItems: AssignmentItem[] = inventoryItems.map((item, index) => ({
  ...item,
  assignmentStatus: index < 2 ? 'Selected' : index === 2 ? 'Unselected' : 'Draft',
  assignmentCondition: index === 1 ? 'Fair' : item.condition,
  photoCount: index === 0 ? 3 : index === 1 ? 2 : 0,
}));

export const verificationItems: VerificationItem[] = [
  {
    id: 'CHK-302',
    name: 'Living Area Floors',
    area: 'Surface: Oak hardwood',
    icon: 'layers',
    moveInCondition: 'Excellent',
    returnCondition: 'Damaged',
    damageDescription: 'Deep scratches in the high-traffic area and a visible water stain near the balcony door.',
    deduction: 8500,
    status: 'Damaged',
    moveInPhoto: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80',
    returnPhoto: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'CHK-402-APP',
    name: 'Kitchen Appliances',
    area: 'Refrigerator, oven, microwave',
    icon: 'kitchen',
    moveInCondition: 'Excellent',
    returnCondition: 'Good',
    damageDescription: 'No significant damage reported. Normal wear and tear only.',
    deduction: 0,
    status: 'Good',
    moveInPhoto: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80',
    returnPhoto: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'CHK-402-SOFA',
    name: 'Living Room Sofa',
    area: 'Grey linen sectional',
    icon: 'chair',
    moveInCondition: 'Good',
    returnCondition: 'Fair',
    damageDescription: 'Small upholstery stain under review; cleaning quote pending.',
    deduction: 1800,
    status: 'Review',
    moveInPhoto: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80',
    returnPhoto: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80',
  },
];

export const tenantAmenities = [
  {
    id: 'pool',
    name: 'Skyline Pool & Deck',
    meta: 'Level 12 - Open 6:00 AM - 10:00 PM',
    icon: 'pool' as const,
    image: 'https://images.unsplash.com/photo-1572331165267-854da2b10ccc?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'gym',
    name: 'Pro-Fit Gym Suite',
    meta: 'Level 2 - Open 24/7',
    icon: 'fitness-center' as const,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'cowork',
    name: 'Livic Work Hub',
    meta: 'Lobby level - Key access only',
    icon: 'work' as const,
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
  },
];
