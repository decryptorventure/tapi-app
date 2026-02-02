'use client';

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Fix Leaflet default icon not found
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';


interface Location {
    lat: number;
    lng: number;
    address?: string;
}

interface MapPickerClientProps {
    value?: Location;
    onChange: (location: Location) => void;
    defaultLocation?: Location; // e.g. Hanoi Center
}

// Default center (Hanoi)
const DEFAULT_CENTER = { lat: 21.0285, lng: 105.8542 };

function LocationMarker({ position, onChange, icon }: { position: L.LatLngExpression, onChange: (lat: number, lng: number) => void, icon: L.Icon }) {
    const map = useMap();

    // Fly to position when it changes
    useEffect(() => {
        map.flyTo(position, map.getZoom());
    }, [position, map]);

    // Handle map click to update position
    useMapEvents({
        click(e) {
            onChange(e.latlng.lat, e.latlng.lng);
        },
    });

    return (
        <Marker
            position={position}
            icon={icon}
            draggable={true}
            eventHandlers={{
                dragend: (e) => {
                    const marker = e.target;
                    const position = marker.getLatLng();
                    onChange(position.lat, position.lng);
                },
            }}
        />
    );
}

export default function MapPickerClient({ value, onChange }: MapPickerClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [customIcon, setCustomIcon] = useState<L.Icon | null>(null);

    // Initialize Leaflet Icon on client side only
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const icon = new L.Icon({
                iconUrl: iconUrl,
                iconRetinaUrl: iconRetinaUrl,
                shadowUrl: shadowUrl,
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });
            setCustomIcon(icon);
        }
    }, []);


    // Initial position
    const [center, setCenter] = useState<[number, number]>(
        value ? [value.lat, value.lng] : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]
    );

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setSearchResults([]);

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=vn`,
                {
                    headers: {
                        'User-Agent': 'TapyApp/1.0'
                    }
                }
            );
            const data = await response.json();

            if (data.length === 0) {
                toast.error('Không tìm thấy địa điểm');
            } else {
                setSearchResults(data);
            }
        } catch (error) {
            toast.error('Lỗi tìm kiếm địa điểm');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectResult = (result: any) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        const newLocation = {
            lat,
            lng,
            address: result.display_name
        };

        setCenter([lat, lng]);
        onChange(newLocation);
        setSearchResults([]);
        setSearchQuery(''); // Optional: clear or keep address
    };

    const handleMapClick = async (lat: number, lng: number) => {
        // Reverse geocoding (optional, can be skipped to save API quota)
        // For MVP, just update coordinates. Address can be empty or we fetch it.
        // Let's fetch address for better UX, but debounce or guard it.

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
                {
                    headers: { 'User-Agent': 'TapyApp/1.0' }
                }
            );
            const data = await response.json();

            onChange({
                lat,
                lng,
                address: data.display_name
            });
        } catch (e) {
            // If API fails, just assume coords
            onChange({ lat, lng, address: '' });
        }
    };

    if (!customIcon) {
        return (
            <div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-xl flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm địa điểm (VD: Highlands Coffee Nguyễn Trãi)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="pl-9"
                        />
                    </div>
                    <Button onClick={handleSearch} disabled={isSearching}>
                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tìm'}
                    </Button>
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 bg-background border border-border rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                        {searchResults.map((result: any) => (
                            <button
                                key={result.place_id}
                                className="w-full text-left p-3 hover:bg-muted text-sm border-b last:border-0"
                                onClick={() => handleSelectResult(result)}
                            >
                                <p className="font-medium truncate">{result.display_name.split(',')[0]}</p>
                                <p className="text-xs text-muted-foreground truncate">{result.display_name}</p>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Map Container */}
            <div className="border border-border rounded-xl overflow-hidden shadow-sm h-[300px] relative z-0">
                <MapContainer
                    center={center}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker
                        position={center}
                        onChange={handleMapClick}
                        icon={customIcon}
                    />
                </MapContainer>

                {/* Pin Hint Overlay */}
                <div className="absolute bottom-4 left-4 right-4 bg-background/80 backdrop-blur-sm p-3 rounded-lg text-xs text-center pointer-events-none z-[400]">
                    Kéo thả ghim đỏ hoặc bấm vào bản đồ để chọn vị trí chính xác
                </div>
            </div>

            {/* Selected Coordinates Display */}
            {value && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>
                        Đã chọn: {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
                    </span>
                    {value.address && <span className="truncate max-w-[200px]"> - {value.address}</span>}
                </div>
            )}
        </div>
    );
}
