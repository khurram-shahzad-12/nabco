import { GoogleMap,Marker,Polyline } from "@react-google-maps/api";
import { useRef } from "react";


const RouteMapData = ({randomColorGenerator,selectedRoute,legs}) => {
    const mapRef = useRef(null);
    return (
    <GoogleMap mapContainerStyle={{ width: '100%', height: '75vh' }}
          onLoad={(map) => (mapRef.current = map)}
          center={{ lat: 55.8484017, lng: -4.2159223 }}
          zoom={12}
        >
          {
            legs.map((leg, index) => {
              const segment_path = leg.steps.flatMap(step => step.path);
              const random_color = randomColorGenerator();
              return (
                <Polyline
                  key={index}
                  path={segment_path}
                  options={{
                    strokeColor: random_color,
                    strokeOpacity: 1.0,
                    strokeWeight: 8,
                  }}
                />
              )
            })
          }
          {selectedRoute && selectedRoute.stops.map((stop, index) => (
            <Marker
              key={index}
              position={{
                lat: parseFloat(stop.location.split(',')[0]),
                lng: parseFloat(stop.location.split(',')[1])
              }}
              label={stop.type === 'depot' ? 'Spice Direct' : (stop?.customer_name ?? '') + ' stop ' + (index).toString()}
            />
          ))}
        </GoogleMap>
  )
}

export default RouteMapData