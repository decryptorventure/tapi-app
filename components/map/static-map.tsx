'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const StaticMapClient = dynamic(
    () => import('./static-map-client'),
    {
        ssr: false,
        loading: () => <Skeleton className="h-[200px] w-full rounded-xl" />
    }
);

interface StaticMapProps {
    lat: number;
    lng: number;
    address?: string;
    showDirections?: boolean;
}

export function StaticMap(props: StaticMapProps) {
    return <StaticMapClient {...props} />;
}
