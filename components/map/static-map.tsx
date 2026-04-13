export function StaticMap({ lat, lng, address }: { lat: number, lng: number, address?: string, showDirections?: boolean }) {
    const query = address ? encodeURIComponent(address) : `${lat},${lng}`;
    return (
        <div className="w-full h-[200px] rounded-xl overflow-hidden bg-muted">
            <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                allowFullScreen
            />
        </div>
    );
}
