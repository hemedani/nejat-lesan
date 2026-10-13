"use client";
import { useMapEvents } from "react-leaflet";
import L from "leaflet";

interface MapClickHandlerProps {
  isActive: boolean;
  onMapClick: (e: L.LeafletMouseEvent) => void;
  /**
   * اختیاری. دابل‌کلیک معمولاً دو `click` هم می‌فرستد، پس مصرف‌کننده باید
   * رأسِ تکراریِ آخر را خودش حذف کند.
   */
  onMapDoubleClick?: (e: L.LeafletMouseEvent) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({
  isActive,
  onMapClick,
  onMapDoubleClick,
}) => {
  useMapEvents({
    click: (e) => {
      if (isActive) {
        onMapClick(e);
      }
    },
    dblclick: (e) => {
      if (isActive && onMapDoubleClick) {
        onMapDoubleClick(e);
      }
    },
  });

  return null;
};

export default MapClickHandler;
