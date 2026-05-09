export type CreatePropertyRequest = {
  name: string;
  address: string;
  city: string;
  landmark?: string;
};

export type PropertyResponse = {
  id: string;
  name: string;
  address: string;
  city: string;
  landmark?: string;
  ownerId?: string;
};
