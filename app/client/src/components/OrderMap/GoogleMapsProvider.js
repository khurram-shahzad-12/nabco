import { useJsApiLoader } from "@react-google-maps/api";
const libraries = ["places", "drawing", "maps"];

const GoogleMapsProvider = ({ children }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAP_API_KEY,
    libraries,
  });

  if (loadError) return <div>Error loading Google Maps</div>;
  if (!isLoaded) return <div>Loading Google Maps...</div>;

  return <>{children}</>;
};

export default GoogleMapsProvider;
