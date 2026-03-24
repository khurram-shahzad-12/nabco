import GoogleMapsProvider from "./GoogleMapsProvider"
import RouteMapData from "./RouteMapData"

const RouteMap = ({randomColorGenerator,selectedRoute,legs}) => {
  return (
    <GoogleMapsProvider>
        <RouteMapData
        randomColorGenerator={randomColorGenerator}
        selectedRoute={selectedRoute}
        legs={legs}
        />
    </GoogleMapsProvider>
  )
}

export default RouteMap