import { Box, Button } from "@mui/material";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import PlacesAutocomplete, { geocodeByAddress, getLatLng } from "react-places-autocomplete";
import { useState, useEffect } from "react";

const MapModalData = ({ handleCloseMapModal, mapModalOpen, onSave, latitude, longitude}) => {
  const [mapCenter, setMapCenter] = useState({ lat: parseFloat(latitude), lng: parseFloat(longitude) });
  const [markerPosition, setMarkerPosition] = useState({ lat: parseFloat(latitude), lng: parseFloat(longitude) });
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      setMapCenter({ lat, lng });
      setMarkerPosition({ lat, lng });
    }
  }, [latitude, longitude]);

  const handleDragEnd = async (event) => {
    const { latLng } = event;
    const newPosition = { lat: latLng.lat(), lng: latLng.lng() };
    setMarkerPosition(newPosition);
    try {
      const result = await geocodeByAddress(`${newPosition.lat}, ${newPosition.lng}`);
      const latLng = await getLatLng(result[0]);
      setMapCenter(latLng);
      setAddress(result[0].formatted_address);
    } catch (error) {
      console.log("Error: ", error)}
  }

  const handleSelect = async (selectedAddress) => {
    const result = await geocodeByAddress(selectedAddress);
    let latLng = await getLatLng(result[0]);
    setMapCenter(latLng);
    setMarkerPosition(latLng);
    setAddress(selectedAddress);
  }
 const handleSave = () => {
    onSave(markerPosition.lat, markerPosition.lng);
  };
  return (
    <Modal
      open={mapModalOpen}
      onClose={handleCloseMapModal}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <Box sx={{ position: 'relative', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80vw', bgcolor: 'white', border: '2px solid black', boxShadow: 24, p: 4 }} style={{ color: "black" }}>
        <Typography>Search Customer location</Typography>
          <PlacesAutocomplete
            value={address}
            onChange={setAddress}
            onSelect={handleSelect}
          >
            {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
              <Box>
                <input
                  {...getInputProps({
                    placeholder: 'Search for your Location/Landmark',
                    className: 'location-search-input',
                  })}
                  style={{
                    boxSizing: `border-box`,
                    border: `1px solid #000`,
                    width: `100%`,
                    height: `32px`,
                    padding: `0 12px`,
                    borderRadius: `3px`,
                    boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`,
                    fontSize: `14px`,
                    outline: `none`,
                    textOverflow: `ellipsis`,
                    margin: `10px 0px`,
                    position: 'relative'
                  }}
                />
                <Box className="autocomplete-dropdown-container" sx={{width:'50%',translate:'5px',padding:'5px',background:'white',cursor:'pointer',fontSize:'14px',outline:'none',position:'absolute',zIndex:1000,textOverflow:'ellipses'}}>
                  {loading && <div>Loading...</div>}
                  {suggestions.map((suggestion) => {
                    const className = suggestion.active ? { backgroundColor: '#fafafa', cursor: 'pointer', padding: '10px' } : { backgroundColor: '#fafafa', cursor: 'pointer' };
                    return (
                      <div
                        {...getSuggestionItemProps(suggestion, {
                          className,
                        })} key={suggestion.placeId}
                      >
                        {suggestion.description}
                      </div>
                    );
                  })}
                </Box>
              </Box>
            )}
          </PlacesAutocomplete>
          <GoogleMap
            center={mapCenter}
            zoom={16}
            mapContainerStyle={{width:'100%', height:'70vh'}}
            onClick={handleDragEnd}
          >
            {markerPosition &&
              <>
                <MarkerF position={markerPosition}
                  draggable={true}
                  onDragEnd={handleDragEnd}
                />
              </>}
          </GoogleMap>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button variant="contained" onClick={handleSave} sx={{ mr: 2 }}>
            Save Location
          </Button>
          <Button variant="contained" onClick={handleCloseMapModal}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Modal>
  )
}

export default MapModalData