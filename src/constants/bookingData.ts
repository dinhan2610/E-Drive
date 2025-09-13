export const CAR_MODELS = [
  { id: 'audi-a1', name: 'Audi A1 S-Line' },
  { id: 'vw-golf', name: 'VW Golf 6' },
  { id: 'toyota-camry', name: 'Toyota Camry' },
  { id: 'bmw-320', name: 'BMW 320 ModernLine' },
  { id: 'mercedes-glk', name: 'Mercedes-Benz GLK' },
  { id: 'vw-passat', name: 'VW Passat CC' }
] as const;

export const VARIANTS = [
  { id: 'delux', name: 'Delux' },
  { id: 'luxury', name: 'Luxury' },
  { id: 'sport', name: 'Sport' },
  { id: 'premium', name: 'Premium' }
] as const;

export const DEALERS = [
  { id: 'hanoi', name: 'Hà Nội' },
  { id: 'hcm', name: 'TP. Hồ Chí Minh' },
  { id: 'danang', name: 'Đà Nẵng' },
  { id: 'cantho', name: 'Cần Thơ' }
] as const;

export type CarModel = typeof CAR_MODELS[number]['id'];
export type Variant = typeof VARIANTS[number]['id'];
export type Dealer = typeof DEALERS[number]['id'];
