import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

type Donor = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  bloodGroup: string;
  seen: boolean;
  distance?: number; // Add distance property
};

// Create custom marker icons
const createCustomIcon = (color: 'green' | 'red') => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color === 'green' ? '#10B981' : '#EF4444'};
        width: 25px;
        height: 25px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

// Hospital marker icon
const hospitalIcon = L.divIcon({
  className: 'hospital-marker',
  html: `
    <div style="
      background-color: #DC2626;
      width: 30px;
      height: 30px;
      border-radius: 6px;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
    ">
      🏥
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15]
});

const charusatCoords: [number, number] = [22.6001, 72.8205]; // Charusat University coordinates

export function CharusatMap({ donors = [] }: { donors?: Donor[] }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-lg border border-red-100">
      <MapContainer center={charusatCoords} zoom={16} style={{ height: '400px', width: '100%' }}>
        <TileLayer
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Hospital Marker */}
        <Marker position={charusatCoords as [number, number]} icon={hospitalIcon}>
          <Popup>
            <div className="text-center">
              <strong>Charusat Hospital</strong><br />
              <span className="text-sm text-gray-600">Hospital Location</span>
            </div>
          </Popup>
        </Marker>
        
        {/* Donor Markers with distance-based colors */}
        {donors.filter(d => d.seen).map(donor => {
          const distance = donor.distance || 0;
          const isNear = distance <= 5; // 5km threshold
          const markerIcon = createCustomIcon(isNear ? 'green' : 'red');
          
          return (
            <Marker 
              key={donor.id} 
              position={[donor.lat, donor.lng] as [number, number]}
              icon={markerIcon}
            >
              <Popup>
                <div className="text-center">
                  <strong>{donor.name}</strong><br />
                  <span className="text-sm">Blood Group: {donor.bloodGroup}</span><br />
                  <span className={`text-sm font-semibold ${isNear ? 'text-green-600' : 'text-red-600'}`}>
                    Distance: {distance.toFixed(1)}km
                  </span><br />
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isNear ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {isNear ? 'Near (≤5km)' : 'Far (>5km)'}
                  </span>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}