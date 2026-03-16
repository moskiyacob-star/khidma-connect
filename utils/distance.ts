export async function getLatLng(postcode: string): Promise<{ lat: number; lng: number } | null> {
    try {
        const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.trim())}`);
        if (!response.ok) return null;
        const data = await response.json();
        return {
            lat: data.result.latitude,
            lng: data.result.longitude
        };
    } catch (error) {
        console.error("Error fetching postcode data:", error);
        return null;
    }
}

export async function getBulkLatLng(postcodes: string[]): Promise<Record<string, { lat: number; lng: number } | null>> {
    try {
        const uniquePostcodes = Array.from(new Set(postcodes.map(p => p.trim()).filter(Boolean)));
        if (uniquePostcodes.length === 0) return {};

        const CHUNK_SIZE = 100;
        const result: Record<string, { lat: number; lng: number } | null> = {};

        for (let i = 0; i < uniquePostcodes.length; i += CHUNK_SIZE) {
            const chunk = uniquePostcodes.slice(i, i + CHUNK_SIZE);
            console.log("Fetching bulk postcode data chunk:", chunk);
            const response = await fetch('https://api.postcodes.io/postcodes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postcodes: chunk })
            });
            console.log("Response status:", response.status);
            if (!response.ok) {
                console.error("Response not ok:", await response.text());
                continue;
            }
            const data = await response.json();
            
            if (data.result) {
                data.result.forEach((item: any) => {
                    if (item.result) {
                        result[item.query] = {
                            lat: item.result.latitude,
                            lng: item.result.longitude
                        };
                    } else {
                        result[item.query] = null;
                    }
                });
            }
        }
        return result;
    } catch (error) {
        console.error("Error fetching bulk postcode data:", error);
        return {};
    }
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3958.8; // Radius of the earth in miles
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in miles
    return d;
}

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}
