export type VZItem = { code: string; label: string; category: string; icon: string };

export const VZ_CATALOG: VZItem[] = [
  { code: "283", label: "Absolutes Haltverbot", category: "Haltverbot", icon: "/vz/283.svg" },
  { code: "286", label: "Eingeschränktes Haltverbot", category: "Haltverbot", icon: "/vz/286.svg" },
  { code: "290.1", label: "Beginn Bewohnerparken", category: "Parken", icon: "/vz/290.1.svg" },
  { code: "290.2", label: "Ende Bewohnerparken", category: "Parken", icon: "/vz/290.2.svg" },
  { code: "314", label: "Parken", category: "Parken", icon: "/vz/314.svg" },
  { code: "315", label: "Parken auf Gehwegen", category: "Parken", icon: "/vz/315.svg" },
  { code: "325.1", label: "Verkehrsberuhigter Bereich", category: "Zonen", icon: "/vz/325.1.svg" },
  { code: "325.2", label: "Ende verkehrsberuhigter Bereich", category: "Zonen", icon: "/vz/325.2.svg" },
  { code: "274.1", label: "Tempo-30-Zone", category: "Zonen", icon: "/vz/274.1.svg" },
  { code: "274.2", label: "Ende Tempo-30-Zone", category: "Zonen", icon: "/vz/274.2.svg" },
  { code: "242.1", label: "Beginn Fußgängerzone", category: "Zonen", icon: "/vz/242.1.svg" },
  { code: "242.2", label: "Ende Fußgängerzone", category: "Zonen", icon: "/vz/242.2.svg" },
  { code: "220", label: "Einbahnstraße", category: "Richtung", icon: "/vz/220.svg" },
  { code: "267", label: "Verbot der Einfahrt", category: "Verbote", icon: "/vz/267.svg" },
  { code: "250", label: "Verbot für Fahrzeuge aller Art", category: "Verbote", icon: "/vz/250.svg" },
  { code: "260", label: "Verbot für Kraftfahrzeuge", category: "Verbote", icon: "/vz/260.svg" },
  { code: "239", label: "Gehweg", category: "Geh-/Radweg", icon: "/vz/239.svg" },
  { code: "240", label: "Gemeinsamer Geh- und Radweg", category: "Geh-/Radweg", icon: "/vz/240.svg" },
  { code: "241", label: "Getrennter Geh- und Radweg", category: "Geh-/Radweg", icon: "/vz/241.svg" },
  { code: "274", label: "Zulässige Höchstgeschwindigkeit", category: "Geschwindigkeit", icon: "/vz/274.svg" },
  { code: "278", label: "Ende zulässige Höchstgeschwindigkeit", category: "Geschwindigkeit", icon: "/vz/278.svg" },
];

export const VZ_CATEGORIES = Array.from(new Set(VZ_CATALOG.map(v => v.category))).sort();
