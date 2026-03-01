"use client";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet-draw";
import { MapContainer, TileLayer, useMap, ZoomControl } from "react-leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Location, Zone, AppSettings } from "@/lib/types";
import { Button } from "@/components/ui";

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function uid(): string {
  return (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`);
}

function ClusterLayer({ locations, onSelect, selectedId }: { locations: Location[]; onSelect: (id: string) => void; selectedId: string | null }) {
  const map = useMap();
  const clusterRef = useRef<any>(null); // markercluster types differ by environment

  useEffect(() => {
    if (!clusterRef.current) {
      clusterRef.current = L.markerClusterGroup();
      map.addLayer(clusterRef.current);
    }
    const cluster = clusterRef.current;
    cluster.clearLayers();

    locations.forEach((loc) => {
      const marker = L.marker([loc.lat, loc.lng], { icon: DefaultIcon });
      marker.on("click", () => onSelect(loc.id));
      marker.bindPopup(
        `<div style="font-size:12px">
          <div style="font-weight:600;margin-bottom:6px">Standort</div>
          <div style="opacity:.8;margin-bottom:6px">${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}</div>
          <div style="display:inline-flex;border:1px solid #444;padding:4px 8px;border-radius:999px">${loc.status}</div>
        </div>`
      );
      cluster.addLayer(marker);
    });
  }, [locations, map, onSelect]);

  useEffect(() => {
    if (!selectedId) return;
    const loc = locations.find((l) => l.id === selectedId);
    if (!loc) return;
    map.setView([loc.lat, loc.lng], Math.max(map.getZoom(), 16));
  }, [selectedId, locations, map]);

  return null;
}

function ZonesLayer({ zones }: { zones: Zone[] }) {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    if (layerRef.current) { layerRef.current.removeFrom(map); layerRef.current = null; }
    const gj = L.geoJSON(zones.map((z) => z.geojson as any), { style: () => ({ weight: 2, fillOpacity: 0.12 }) });
    gj.addTo(map); layerRef.current = gj;
    return () => { gj.remove(); };
  }, [zones, map]);

  return null;
}

function DrawControls({ enabled, onCreated }: { enabled: boolean; onCreated: (geojson: unknown) => void }) {
  const map = useMap();
  const drawRef = useRef<any>(null); // leaflet-draw typings vary; keep runtime stable

  useEffect(() => {
    if (!enabled) {
      if (drawRef.current) { map.removeControl(drawRef.current); drawRef.current = null; }
      return;
    }
    if (!drawRef.current) {
      drawRef.current = new L.Control.Draw({
        // leaflet-draw typings expect option objects (or false), not boolean true
        draw: { polygon: {}, rectangle: false, polyline: false, circle: false, circlemarker: false, marker: false } as any,
        edit: false as any
      });
      map.addControl(drawRef.current);
    }

    const handler = (e: any) => {
      const layer = e.layer as L.Layer;
      const gj = (layer as any).toGeoJSON();
      onCreated(gj);
      layer.remove();
    };

    map.on(L.Draw.Event.CREATED, handler);
    return () => { map.off(L.Draw.Event.CREATED, handler); };
  }, [enabled, map, onCreated]);

  return null;
}

function MapClicker({ enabled, onClicked }: { enabled: boolean; onClicked: (lat: number, lng: number) => void }) {
  const map = useMap();
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: L.LeafletMouseEvent) => onClicked(e.latlng.lat, e.latlng.lng);
    map.on("click", handler);
    return () => { map.off("click", handler); };
  }, [enabled, map, onClicked]);
  return null;
}

function FlyToDefault({ settings }: { settings: AppSettings }) {
  const map = useMap();
  useEffect(() => {
    map.setView([settings.defaultLat, settings.defaultLng], settings.defaultZoom);
  }, [settings.defaultLat, settings.defaultLng, settings.defaultZoom, map]);
  return null;
}

export default function MapView(props: {
  settings: AppSettings;
  role: "admin" | "creator" | "spectator";
  canCreate: boolean;
  locations: Location[];
  zones: Zone[];
  selectedLocationId: string | null;
  onSelectLocation: (id: string) => void;
  onCreateLocation: (loc: Location) => void;
  onCreateZone: (zone: Zone) => void;
}) {
  const { settings, canCreate, locations, zones, selectedLocationId, onSelectLocation, onCreateLocation, onCreateZone } = props;
  const [addMode, setAddMode] = useState(false);
  const [zoneMode, setZoneMode] = useState(false);

  function createLocationAt(lat: number, lng: number) {
    if (!canCreate) return alert("Nur Creator/Admin dürfen erstellen.");
    const street = prompt("Straße/Notiz (optional):", "") ?? "";
    onCreateLocation({ id: uid(), lat, lng, street: street.trim()?street.trim():null, status:"needs_review", lastVerified: new Date().toISOString().slice(0,10) });
    setAddMode(false);
  }
  function createZoneFromGeojson(gj: unknown) {
    if (!canCreate) return alert("Nur Creator/Admin dürfen erstellen.");
    const name = (prompt("Zonen-Name:", "Zone") ?? "Zone").trim() || "Zone";
    const desc = (prompt("Beschreibung (optional):", "") ?? "").trim();
const rules = (prompt("Regeln in der Zone (optional):", "") ?? "").trim();
const validity = (prompt("Gültigkeit (optional, z.B. Mo–Fr 7–18 Uhr):", "") ?? "").trim();
const isTemporary = confirm("Ist das eine mobile/temporäre Zone? (OK=ja, Abbrechen=nein)");
let expiresAt = "";
if (isTemporary) {
  expiresAt = (prompt("Ablaufdatum (YYYY-MM-DD):", "") ?? "").trim();
}
const now = new Date().toISOString();
onCreateZone({
  id: uid(),
  name,
  description: desc?desc:null,
  rules: rules?rules:null,
  validity: validity?validity:null,
  isTemporary,
  expiresAt: isTemporary ? (expiresAt || null) : null,
  state: "active",
  geojson: gj as any,
  createdAt: now,
  updatedAt: now
});
    setZoneMode(false);
  }

  const center = useMemo(() => [settings.defaultLat, settings.defaultLng] as [number, number], [settings.defaultLat, settings.defaultLng]);

  return (
    <div className="relative h-[calc(100vh-56px)] w-full">
      <div className="absolute left-3 top-3 z-[1000] flex flex-wrap gap-2 rounded-3xl border border-zinc-800 bg-zinc-950/70 p-2 backdrop-blur">
        <Button onClick={() => { setAddMode(v => !v); setZoneMode(false); }} variant={addMode ? "primary" : "ghost"} disabled={!canCreate}>
          {addMode ? "Standort: AN" : "Standort +"}
        </Button>
        <Button onClick={() => { setZoneMode(v => !v); setAddMode(false); }} variant={zoneMode ? "primary" : "ghost"} disabled={!canCreate}>
          {zoneMode ? "Zonen: AN" : "Zone +"}
        </Button>
      </div>

      <MapContainer center={center} zoom={settings.defaultZoom} className="h-full w-full" preferCanvas>
        <FlyToDefault settings={settings} />
        <ZoomControl position="bottomright" />
      <TileLayer attribution='&copy; OpenStreetMap-Mitwirkende' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ZonesLayer zones={zones} />
        <ClusterLayer locations={locations} onSelect={onSelectLocation} selectedId={selectedLocationId} />
        <DrawControls enabled={zoneMode} onCreated={createZoneFromGeojson} />
        <MapClicker enabled={addMode} onClicked={createLocationAt} />
      </MapContainer>
    </div>
  );
}
