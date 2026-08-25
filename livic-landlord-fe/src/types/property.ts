export type CreatePropertyRequest = {
  name: string;
  address: string;
  city: string;
  landmark?: string;
  totalFloors?: number;
  amenities?: string[];
};

export type UpdatePropertyRequest = {
  name: string;
  address: string;
  city: string;
  landmark?: string;
  totalFloors?: number;
  amenities?: string[];
};

export type PropertyResponse = {
  id: string;
  name: string;
  address: string;
  city: string;
  landmark?: string;
  totalFloors?: number;
  ownerId?: string;
  isActive?: boolean;
  amenities?: string[];
};
