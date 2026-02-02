'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const MapPickerClient = dynamic(
    () => import('./map-picker-client'),
    {
        ssr: false,
        loading: () => (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-[300px] w-full rounded-xl" />
            </div>
        )
    }
);

interface Location {
    lat: number;
    lng: number;
    address?: string;
}

interface MapPickerProps {
    value?: Location;
    onChange: (location: Location) => void;
}

export function MapPicker(props: MapPickerProps) {
    return <MapPickerClient {...props} />;
}
