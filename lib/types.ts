export type LocationStatus = "active" | "outdated" | "needs_review";
export type Location = {
  id: string;
  lat: number;
  lng: number;
  street: string | null;
  status: LocationStatus;
  lastVerified: string | null; // YYYY-MM-DD
};

export type SignDirection = "both" | "left" | "right" | "start" | "end";
export type SignState = "active" | "expired";

export type Sign = {
  id: string;
  locationId: string;
  mainCode: string;
  mainLabel: string;
  direction: SignDirection;
  validity: string | null;
  additional: string[]; // legacy
  additionalText: string | null;
  notes: string | null;
  imageUrl: string | null;
  confidence: "confirmed" | "probable" | "unclear";
  isTemporary: boolean;
  expiresAt: string | null; // YYYY-MM-DD
  state: SignState;
  createdAt: string;
  updatedAt: string;
};

export type Zone = {
  id: string;
  name: string;
  description: string | null;
  geojson: any;
  rules: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AppSettings = {
  defaultCity: string;
  defaultLat: number;
  defaultLng: number;
  defaultZoom: number;
  updatedAt: string;
};

export type AppData = {
  version: number;
  updatedAt: string;
  settings: AppSettings;
  locations: Location[];
  signs: Sign[];
  zones: Zone[];
};
