import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Case } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

// Fix for default marker icons (though we use CircleMarker now)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPanelProps {
  cases: Case[];
  selectedCaseId?: string;
  onCaseSelect: (caseData: Case) => void;
}

const getCoords = (c: Case): [number, number] => {
  // Prioritize new explicit columns
  if (c.latitude !== null && c.longitude !== null && !isNaN(c.latitude) && !isNaN(c.longitude)) {
    // Add deterministic jitter based on Case ID to prevent marker overlap
    const hash = c.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const jitterFactor = 0.0008;
    const latJitter = ((hash % 10) - 5) * (jitterFactor / 5);
    const lngJitter = ((((hash / 10) | 0) % 10) - 5) * (jitterFactor / 5);
    return [c.latitude + latJitter, c.longitude + lngJitter];
  }

  // Legacy fallback (triage_data)
  let triageData = c.triage_data;
  if (typeof triageData === 'string') {
    try { triageData = JSON.parse(triageData); } catch (e) {}
  }
  const data = triageData as any;
  if (data?.coords?.lat && data?.coords?.lng) {
    const lat = parseFloat(data.coords.lat);
    const lng = parseFloat(data.coords.lng);
    const hash = c.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const jitterFactor = 0.0008;
    const latJitter = ((hash % 10) - 5) * (jitterFactor / 5);
    const lngJitter = ((((hash / 10) | 0) % 10) - 5) * (jitterFactor / 5);
    return [lat + latJitter, lng + lngJitter];
  }

  // Absolute fallback: null (do not show marker if no location is known)
  return null;
};

function ChangeView({ center, animate }: { center: [number, number]; animate: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (animate) {
      map.flyTo(center, 13, {
        duration: 1.5
      });
    } else {
      map.setView(center, map.getZoom());
    }
  }, [center, map, animate]);
  return null;
}

export const MapPanel: React.FC<MapPanelProps> = ({ cases, selectedCaseId, onCaseSelect }) => {
  const activeCases = cases.filter(c => c.status !== 'resolved');
  const selectedCase = cases.find(c => c.id === selectedCaseId);
  
  const coordsFound = selectedCase ? getCoords(selectedCase) : null;
  const center: [number, number] = coordsFound || [20.5937, 78.9629];

  console.log(`MapPanel: Rendering ${activeCases.length} active cases`);

  return (
    <Card className="w-full h-full min-h-[400px] overflow-hidden flex flex-col shadow-lg border-primary/20 bg-background/50 backdrop-blur-sm">
      <CardHeader className="py-3 bg-muted/30 border-b flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <MapPin className="h-5 w-5 text-primary shrink-0" />
          <CardTitle className="text-base md:text-lg font-bold truncate">Situational Map</CardTitle>
        </div>
        <div className="hidden lg:flex items-center gap-3 shrink-0">
           <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
             <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" /> P1
           </div>
           <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
             <div className="w-2.5 h-2.5 rounded-full bg-orange-500" /> P2
           </div>
           <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
             <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> P3
           </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" /> P4
            </div>
            <div className="w-px h-4 bg-border mx-1" />
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              <span className="text-green-500/80">GPS</span> / 
              <span className="text-blue-500/80">Manual</span> / 
              <span className="text-orange-500/80">Fallback</span>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 relative min-h-0">
        <MapContainer
          center={center}
          zoom={selectedCase ? 13 : 5}
          scrollWheelZoom={true}
          className="w-full h-full z-0"
          style={{ background: '#1a1a1a' }}
        >
          <TileLayer
            attribution='&copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          <ChangeView center={center} animate={!!selectedCase} />

          {activeCases.map((c) => {
            const coords = getCoords(c);
            if (!coords) return null; // Skip cases with no coordinates

            const isSelected = c.id === selectedCaseId;
            const isP1 = c.priority === 'P1';
            const color = isP1 ? '#ef4444' : c.priority === 'P2' ? '#f97316' : c.priority === 'P3' ? '#facc15' : '#22c55e';

            return (
              <CircleMarker
                key={`${c.id}-${c.priority}-${isSelected}`}
                center={coords}
                radius={isSelected ? 10 : (isP1 ? 8 : 6)}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: isSelected ? 1 : 0.8,
                  color: isSelected ? 'white' : 'white',
                  weight: isSelected ? 4 : 2,
                }}
                eventHandlers={{
                  click: () => onCaseSelect(c),
                }}
              >
                <Popup className="custom-popup">
                  <div className="p-2 min-w-[200px]">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <PriorityBadge priority={c.priority} />
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="font-bold text-sm mb-1 truncate">{c.location_text || c.location || 'Unknown'}</div>
                    <div className="flex items-center gap-2 mb-2">
                       <div className={cn(
                         "text-[8px] font-bold uppercase px-1.5 py-0.5 rounded",
                         c.location_source === 'gps' ? "bg-green-500/10 text-green-500" :
                         c.location_source === 'manual' ? "bg-blue-500/10 text-blue-500" :
                         "bg-orange-500/10 text-orange-500"
                       )}>
                         {c.location_source || 'fallback'}
                       </div>
                       <div className="text-[10px] text-muted-foreground opacity-60">
                         {new Date(c.created_at).toLocaleTimeString()}
                       </div>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2 line-clamp-2 italic border-l-2 border-primary/20 pl-2">
                      "{c.last_message}"
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
        
        <div className="absolute top-4 right-4 z-[1000] pointer-events-none">
          <div className="bg-red-500/10 text-red-500 text-[10px] font-bold px-2 py-1 rounded border border-red-500/20 flex items-center gap-1 animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            LIVE OPS
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
