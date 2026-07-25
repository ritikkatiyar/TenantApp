export type CreatePropertyRequest = {
  name: string;
  address: string;
  city: string;
  landmark?: string;
  totalFloors?: number;
};

export type UpdatePropertyRequest = {
  name: string;
  address: string;
  city: string;
  landmark?: string;
  totalFloors?: number;
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
};
