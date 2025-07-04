"use client";
import { useMapEvents } from "react-leaflet";
import L from "leaflet";

interface MapClickHandlerProps {
  isActive: boolean;
  onMapClick: (e: L.LeafletMouseEvent) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({
  isActive,
  onMapClick,
}) => {
  useMapEvents({
    click: (e) => {
      if (isActive) {
        onMapClick(e);
      }
    },
  });

  return null;
};

export default MapClickHandler;
