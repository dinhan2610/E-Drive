// New API Response format
export interface VehicleInventoryItem {
  vehicleId: number;
  vehicleName: string;
  version?: string;
  color?: string;
  quantity: number;
}

export interface ManufacturerInventorySummary {
  manufacturerName: string;
  totalQuantity: number;
  vehicles: VehicleInventoryItem[];
}

// Legacy interface (kept for backward compatibility if needed)
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
