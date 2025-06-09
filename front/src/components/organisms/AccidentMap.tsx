"use client";

import { useEffect, useRef } from "react";
import { accidentSchema } from "@/types/declarations/selectInp";

interface AccidentMapProps {
  accidents: accidentSchema[];
  onSelect: (accident: accidentSchema) => void;
}

const AccidentMap: React.FC<AccidentMapProps> = ({ accidents, onSelect }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // This is a placeholder for map initialization
    // In a real implementation, you would initialize a map library like Leaflet or Google Maps here
    const initMap = () => {
      if (!mapRef.current) return;
      
      // Display a message in the map container if no location data is available
      if (accidents.length === 0 || !accidents.some(acc => acc.location)) {
        const noDataElement = document.createElement('div');
        noDataElement.className = 'flex items-center justify-center h-full';
        noDataElement.innerHTML = `
          <div class="text-center p-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <h3 class="text-lg font-medium text-gray-900">داده‌های مکانی موجود نیست</h3>
            <p class="mt-2 text-sm text-gray-500">برای نمایش نقشه، تصادفات باید دارای اطلاعات مکانی باشند.</p>
          </div>
        `;
        
        mapRef.current.innerHTML = '';
        mapRef.current.appendChild(noDataElement);
        return;
      }
      
      // In a real implementation, you would:
      // 1. Initialize the map
      // 2. Add markers for each accident with location data
      // 3. Set up click handlers to call onSelect
      
      // For now, we'll just show a placeholder message
      const placeholderElement = document.createElement('div');
      placeholderElement.className = 'flex items-center justify-center h-full';
      placeholderElement.innerHTML = `
        <div class="text-center p-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 class="text-lg font-medium text-gray-900">نقشه تصادفات</h3>
          <p class="mt-2 text-sm text-gray-500">برای پیاده‌سازی کامل نقشه، یک کتابخانه نقشه مانند Leaflet یا Google Maps نیاز است.</p>
          <p class="mt-1 text-sm text-gray-500">${accidents.length} تصادف برای نمایش روی نقشه موجود است.</p>
        </div>
      `;
      
      mapRef.current.innerHTML = '';
      mapRef.current.appendChild(placeholderElement);
    };
    
    initMap();
    
    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.innerHTML = '';
      }
    };
  }, [accidents, onSelect]);
  
  return (
    <div 
      ref={mapRef} 
      className="w-full h-full rounded-lg border border-gray-200 bg-gray-50"
    ></div>
  );
};

export default AccidentMap;