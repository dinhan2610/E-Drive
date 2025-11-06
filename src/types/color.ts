export interface VehicleColor {
  colorId: number;
  colorName: string;
  hexCode: string;
  description?: string;
  inUse: boolean; // API uses 'inUse' not 'isActive'
  isActive?: boolean; // Keep for backward compatibility
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateColorRequest {
  colorName: string;
  hexCode: string;
  description?: string;
}

export interface UpdateColorRequest {
  colorName?: string;
  hexCode?: string;
  description?: string;
  inUse?: boolean; // API uses 'inUse'
  isActive?: boolean; // Keep for backward compatibility
}
