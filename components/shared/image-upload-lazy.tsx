// Lazy-loaded ImageUpload wrapper for better code splitting
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ImageUpload = dynamic(
  () => import('./image-upload').then((mod) => ({ default: mod.ImageUpload })),
  {
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="w-full h-48 rounded-xl" />
        <Skeleton className="w-3/4 h-4" />
      </div>
    ),
    ssr: false, // Disable SSR for this component
  }
);

export { ImageUpload };
