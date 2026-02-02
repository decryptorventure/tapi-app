'use client';

import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';

// Fix Leaflet default icon not found
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const customIcon = new L.Icon({
    iconUrl: iconUrl,
    iconRetinaUrl: iconRetinaUrl,
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface StaticMapClientProps {
    lat: number;
    lng: number;
    address?: string;
    showDirections?: boolean;
}

export default function StaticMapClient({ lat, lng, address, showDirections = true }: StaticMapClientProps) {
    const googleMapsLink = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    return (
        <div className="space-y-2">
            <div className="h-[200px] w-full rounded-xl overflow-hidden border border-border relative z-0">
                <MapContainer
                    center={[lat, lng]}
                    zoom={15}
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%' }}
                    dragging={true} // Allow panning
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; OSM'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[lat, lng]} icon={customIcon} />
                </MapContainer>
            </div>

            {showDirections && (
                <Button
                    variant="outline"
                    className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => window.open(googleMapsLink, '_blank')}
                >
                    <Navigation className="w-4 h-4 mr-2" />
                    Chỉ đường (Google Maps)
                </Button>
            )}
        </div>
    );
}
