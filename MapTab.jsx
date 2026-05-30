const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useCallback } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { MapPin, Radio } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { nowTimestamp, formatTimestamp } from '@/lib/formatDate';
import L from 'leaflet';

// Fix leaflet default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function MapTab({ tour, user, isClosed }) {
  const queryClient = useQueryClient();
  const [sharing, setSharing] = useState(false);
  const [watchId, setWatchId] = useState(null);

  const { data: pins = [] } = useQuery({
    queryKey: ['locationPins', tour.id],
    queryFn: () => db.entities.LocationPin.filter({ tour_id: tour.id }),
    refetchInterval: 5000,
  });

  const activePins = pins.filter(p => p.is_active);

  const updateLocation = useCallback(async (position) => {
    const { latitude, longitude } = position.coords;
    const existing = pins.find(p => p.user_email === user.email);
    const nickname = user.nickname || user.full_name || 'User';

    if (existing) {
      await db.entities.LocationPin.update(existing.id, {
        latitude,
        longitude,
        is_active: true,
        nickname,
        last_updated: nowTimestamp(),
      });
    } else {
      await db.entities.LocationPin.create({
        tour_id: tour.id,
        user_email: user.email,
        nickname,
        latitude,
        longitude,
        is_active: true,
        last_updated: nowTimestamp(),
      });
    }
    queryClient.invalidateQueries({ queryKey: ['locationPins', tour.id] });
  }, [pins, user, tour.id, queryClient]);

  const toggleSharing = async (enabled) => {
    if (isClosed) return;
    setSharing(enabled);

    if (enabled) {
      if (!navigator.geolocation) return;
      const id = navigator.geolocation.watchPosition(updateLocation, () => {}, {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      });
      setWatchId(id);
    } else {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      const existing = pins.find(p => p.user_email === user.email);
      if (existing) {
        await db.entities.LocationPin.update(existing.id, { is_active: false });
        queryClient.invalidateQueries({ queryKey: ['locationPins', tour.id] });
      }
    }
  };

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // Default center: Bangladesh
  const center = activePins.length > 0
    ? [activePins[0].latitude, activePins[0].longitude]
    : [23.8103, 90.4125];

  return (
    <div className="flex flex-col h-full">
      {!isClosed && (
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className={`w-4 h-4 ${sharing ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
            <Label className="text-sm font-medium">Share Live Location</Label>
          </div>
          <Switch checked={sharing} onCheckedChange={toggleSharing} />
        </div>
      )}

      <div className="flex-1 relative">
        <MapContainer
          center={center}
          zoom={13}
          className="h-full w-full"
          style={{ minHeight: '300px' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {activePins.map(pin => (
            <Marker key={pin.id} position={[pin.latitude, pin.longitude]}>
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">{pin.nickname}</p>
                  <p className="text-xs text-gray-500">{formatTimestamp(pin.last_updated)}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {activePins.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 bg-background/90 border border-border rounded-lg p-2 z-[1000]">
            <p className="text-[10px] text-muted-foreground font-medium mb-1">Active: {activePins.length}</p>
            <div className="flex flex-wrap gap-1">
              {activePins.map(p => (
                <span key={p.id} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  {p.nickname}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}