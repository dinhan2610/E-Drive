export interface ManufacturerInventoryItem {
  inventoryId: number;
  ownerId: number;
  ownerName: string;
  vehicleId: number;
  vehicleModel: string;
  quantity: number;
  lastUpdated: string; // ISO datetime
}

export type ManufacturerInventoryResponse = ManufacturerInventoryItem[];
