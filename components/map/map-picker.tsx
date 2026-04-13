import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface Location {
    lat: number;
    lng: number;
    address?: string;
}

interface MapPickerProps {
    value?: Location;
    onChange: (location: Location) => void;
}

export function MapPicker({ value, onChange }: MapPickerProps) {
    const [lat, setLat] = useState(value?.lat?.toString() || '');
    const [lng, setLng] = useState(value?.lng?.toString() || '');
    
    useEffect(() => {
        if (value) {
            setLat(value.lat.toString());
            setLng(value.lng.toString());
        }
    }, [value]);

    const handleBlur = () => {
        const parsedLat = parseFloat(lat);
        const parsedLng = parseFloat(lng);
        if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
            onChange({ ...value, lat: parsedLat, lng: parsedLng });
        }
    };

    const query = value?.address ? encodeURIComponent(value.address) : (lat && lng ? `${lat},${lng}` : '');

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Vĩ độ (Latitude)</label>
                    <Input 
                        placeholder="Vĩ độ (VD: 21.0285)" 
                        value={lat} 
                        onChange={(e) => setLat(e.target.value)} 
                        onBlur={handleBlur} 
                    />
                </div>
                <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Kinh độ (Longitude)</label>
                    <Input 
                        placeholder="Kinh độ (VD: 105.8542)" 
                        value={lng} 
                        onChange={(e) => setLng(e.target.value)} 
                        onBlur={handleBlur} 
                    />
                </div>
            </div>
            
            <div className="w-full h-[300px] rounded-xl overflow-hidden bg-muted border border-border">
                {query ? (
                    <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ border: 0 }}
                        src={`https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        allowFullScreen
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                        <span className="text-sm">Nhập địa chỉ hoặc tọa độ để xem bản đồ</span>
                    </div>
                )}
            </div>
        </div>
    );
}
