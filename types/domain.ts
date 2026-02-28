export type LocationStatus = "active" | "outdated" | "needs_review";
export type SignDirection = "both" | "left" | "right" | "start" | "end";
export type ConfidenceLevel = "confirmed" | "probable" | "unclear";
export type PhotoType = "closeup" | "overview";

export type ProfileRow = {
  id: string;
  email: string;
  display_name: string | null;
  role: "admin" | "user";
  approved: boolean;
  created_at: string;
  updated_at: string;
};

export type LocationRow = {
  id: string;
  owner_id: string;
  latitude: number;
  longitude: number;
  street_name: string | null;
  created_at: string;
  updated_at: string;
  last_verified_at: string | null;
  status: LocationStatus;
};

export type SignRow = {
  id: string;
  owner_id: string;
  location_id: string;
  main_sign_code: string;
  main_sign_label: string;
  direction: SignDirection;
  validity_text: string | null;
  additional_signs: unknown[];
  notes: string | null;
  confidence_level: ConfidenceLevel;
  created_at: string;
  updated_at: string;
};

export type PhotoRow = {
  id: string;
  owner_id: string;
  sign_id: string;
  image_path: string;
  type: PhotoType;
  uploaded_at: string;
};

export type ZoneRow = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  geo_polygon: unknown;
  special_rules: string | null;
  created_at: string;
  updated_at: string;
};

export const MAIN_SIGNS: Array<{ code: string; label: string }> = [
  { code: "283", label: "Absolutes Haltverbot" },
  { code: "286", label: "Eingeschränktes Haltverbot" },
  { code: "314", label: "Parken" },
  { code: "315", label: "Parken auf Gehwegen" },
  { code: "237", label: "Radweg" },
  { code: "240", label: "Gemeinsamer Geh- und Radweg" },
  { code: "241", label: "Getrennter Geh- und Radweg" }
];
