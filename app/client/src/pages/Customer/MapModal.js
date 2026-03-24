import MapModalData from "./MapModalData";
import GoogleMapsProvider from "../../components/OrderMap/GoogleMapsProvider";

const MapModal = ({ handleCloseMapModal, mapModalOpen, onSave, latitude, longitude }) => {
  return (
    <GoogleMapsProvider>
        <MapModalData
        handleCloseMapModal={handleCloseMapModal}
        mapModalOpen={mapModalOpen}
        latitude={latitude}
        longitude={longitude}
        onSave={onSave}/>
    </GoogleMapsProvider>
  )
}

export default MapModal