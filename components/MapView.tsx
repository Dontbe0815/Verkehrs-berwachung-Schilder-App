"use client";

import L from "leaflet";
import "leaflet.markercluster";
import "leaflet-draw";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { LocationRow, ZoneRow, LocationStatus, ProfileRow } from "@/types/domain";
import { Button } from "@/components/ui";

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function ClusterLayer({
  locations,
  onSelect,
  selectedId
}: {
  locations: LocationRow[];
  onSelect: (id: string) => void;
  selectedId: string | null;
}) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (!clusterRef.current) {
      clusterRef.current = L.markerClusterGroup();
      map.addLayer(clusterRef.current);
    }
    const cluster = clusterRef.current;
    cluster.clearLayers();

    locations.forEach((loc) => {
      const marker = L.marker([loc.latitude, loc.longitude], { icon: DefaultIcon });
      marker.on("click", () => onSelect(loc.id));
      marker.bindPopup(
        `<div style="font-size:12px">
          <div style="font-weight:600;margin-bottom:6px">Standort</div>
          <div style="opacity:.8;margin-bottom:6px">${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}</div>
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
    map.setView([loc.latitude, loc.longitude], Math.max(map.getZoom(), 16));
  }, [selectedId, locations, map]);

  return null;
}

function ZonesLayer({ zones }: { zones: ZoneRow[] }) {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.removeFrom(map);
      layerRef.current = null;
    }

    const gj = L.geoJSON(zones.map((z) => z.geo_polygon as any), {
      style: () => ({ weight: 2, fillOpacity: 0.12 })
    });
    gj.addTo(map);
    layerRef.current = gj;

    return () => {
      gj.removeFrom(map);
    };
  }, [zones, map]);

  return null;
}

function DrawControls({ enabled, onCreated }: { enabled: boolean; onCreated: (geojson: unknown) => void }) {
  const map = useMap();
  const drawRef = useRef<L.Control.Draw | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (drawRef.current) {
        map.removeControl(drawRef.current);
        drawRef.current = null;
      }
      return;
    }

    if (!drawRef.current) {
      drawRef.current = new L.Control.Draw({
        draw: {
          polygon: true,
          polyline: false,
          rectangle: true,
          circle: false,
          circlemarker: false,
          marker: false
        },
        edit: false
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
    return () => {
      map.off(L.Draw.Event.CREATED, handler);
    };
  }, [enabled, map, onCreated]);

  return null;
}

export default function MapView({
  profile,
  locations,
  zones,
  onSelectLocation,
  selectedLocationId,
  onDataChanged
}: {
  profile: ProfileRow | null;
  locations: LocationRow[];
  zones: ZoneRow[];
  onSelectLocation: (id: string) => void;
  selectedLocationId: string | null;
  onDataChanged: () => void;
}) {
  const center = useMemo(() => ({ lat: 51.1657, lng: 10.4515 }), []);
  const [addMode, setAddMode] = useState(false);
  const [zoneMode, setZoneMode] = useState(false);

  const approved = !!profile?.approved;
  const uid = profile?.id ?? null;

  async function createLocationAt(lat: number, lng: number) {
    if (!approved || !uid) {
      alert("Konto nicht freigeschaltet. Bitte Admin-Freigabe abwarten.");
      return;
    }

    const street = prompt("Straße/Notiz (optional):", "") ?? "";
    const status: LocationStatus = "needs_review";
    const lastVerified = new Date().toISOString().slice(0, 10);

    const { error } = await supabase.from("locations").insert({
      owner_id: uid,
      latitude: lat,
      longitude: lng,
      street_name: street.trim() ? street.trim() : null,
      status,
      last_verified_at: lastVerified
    });

    if (error) {
      alert(error.message);
      return;
    }
    setAddMode(false);
    onDataChanged();
  }

  async function createZoneFromGeojson(gj: unknown) {
    if (!approved || !uid) {
      alert("Konto nicht freigeschaltet. Bitte Admin-Freigabe abwarten.");
      return;
    }
    const name = prompt("Zonen-Name:", "Zone") ?? "Zone";
    const desc = prompt("Beschreibung (optional):", "") ?? "";
    const rules = prompt("Sonderregeln (optional):", "") ?? "";

    const { error } = await supabase.from("zones").insert({
      owner_id: uid,
      name: name.trim() || "Zone",
      description: desc.trim() ? desc.trim() : null,
      geo_polygon: gj as any,
      special_rules: rules.trim() ? rules.trim() : null
    });

    if (error) {
      alert(error.message);
      return;
    }
    setZoneMode(false);
    onDataChanged();
  }

  return (
    <div className="relative h-[calc(100vh-56px)] w-full">
      <div className="absolute left-3 top-3 z-[1000] flex flex-wrap gap-2">
        <Button
          onClick={() => {
            setAddMode((v) => !v);
            setZoneMode(false);
          }}
          variant={addMode ? "primary" : "ghost"}
          disabled={!approved}
        >
          {addMode ? "Standort: AN" : "Standort +"}
        </Button>

        <Button
          onClick={() => {
            setZoneMode((v) => !v);
            setAddMode(false);
          }}
          variant={zoneMode ? "primary" : "ghost"}
          disabled={!approved}
        >
          {zoneMode ? "Zonen: AN" : "Zone +"}
        </Button>

        {!approved ? <Button variant="ghost" onClick={() => (window.location.href = "/auth")}>Freigabe</Button> : null}
      </div>

      <MapContainer center={[center.lat, center.lng]} zoom={6} className="h-full w-full" preferCanvas>
        <TileLayer attribution='&copy; OpenStreetMap-Mitwirkende' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ZonesLayer zones={zones} />
        <ClusterLayer locations={locations} onSelect={onSelectLocation} selectedId={selectedLocationId} />
        <DrawControls enabled={zoneMode} onCreated={createZoneFromGeojson} />
        <MapClicker enabled={addMode} onClicked={(lat, lng) => void createLocationAt(lat, lng)} />
      </MapContainer>
    </div>
  );
}

function MapClicker({ enabled, onClicked }: { enabled: boolean; onClicked: (lat: number, lng: number) => void }) {
  const map = useMap();
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: L.LeafletMouseEvent) => onClicked(e.latlng.lat, e.latlng.lng);
    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [enabled, map, onClicked]);
  return null;
}
