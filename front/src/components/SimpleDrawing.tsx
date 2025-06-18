"use client";

import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';

interface SimpleDrawingProps {
  isActive: boolean;
  onPolygonCreated: (polygon: any[]) => void;
  onPolygonDeleted: () => void;
}

const SimpleDrawing: React.FC<SimpleDrawingProps> = ({
  isActive,
  onPolygonCreated,
  onPolygonDeleted
}) => {
  const map = useMap();
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPolygonRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const currentPointsRef = useRef<any[]>([]);



  useEffect(() => {
    if (!map || typeof window === 'undefined') {
      return;
    }

    const setupManualDrawing = async () => {
      try {
        const L = await import('leaflet');

        if (isActive) {

          // Add point counter
          const pointCounter = L.control({ position: 'topleft' } as any);
          (pointCounter as any).onAdd = function() {
            const div = L.DomUtil.create('div', 'point-counter');
            div.style.backgroundColor = 'rgba(59, 130, 246, 0.9)';
            div.style.color = 'white';
            div.style.padding = '8px 12px';
            div.style.border = '2px solid #3b82f6';
            div.style.borderRadius = '8px';
            div.style.fontSize = '14px';
            div.style.fontWeight = 'bold';
            div.innerHTML = 'نقاط: 0';
            return div;
          };
          pointCounter.addTo(map);

          const updatePointCounter = (count: number) => {
            const counterDiv = document.querySelector('.point-counter') as HTMLElement;
            if (counterDiv) {
              counterDiv.innerHTML = `نقاط: ${count}`;
            }
          };

          const handleMapClick = (e: any) => {
            if (!isDrawing) {
              setIsDrawing(true);
              currentPointsRef.current = [e.latlng];

              // Add first marker
              const marker = L.marker(e.latlng, {
                icon: L.divIcon({
                  className: 'drawing-marker',
                  html: '<div style="background: red; width: 8px; height: 8px; border-radius: 50%; border: 2px solid white;"></div>',
                  iconSize: [12, 12],
                  iconAnchor: [6, 6]
                })
              }).addTo(map);
              markersRef.current = [marker];
              updatePointCounter(1);
            } else {
              currentPointsRef.current.push(e.latlng);

              // Add marker for new point
              const marker = L.marker(e.latlng, {
                icon: L.divIcon({
                  className: 'drawing-marker',
                  html: '<div style="background: red; width: 8px; height: 8px; border-radius: 50%; border: 2px solid white;"></div>',
                  iconSize: [12, 12],
                  iconAnchor: [6, 6]
                })
              }).addTo(map);
              markersRef.current.push(marker);
              updatePointCounter(currentPointsRef.current.length);

              // Update or create polygon
              if (currentPolygonRef.current) {
                map.removeLayer(currentPolygonRef.current);
              }

              if (currentPointsRef.current.length >= 2) {
                currentPolygonRef.current = L.polygon(currentPointsRef.current, {
                  color: '#3b82f6',
                  weight: 2,
                  opacity: 0.8,
                  fillOpacity: 0.1,
                  fillColor: '#3b82f6'
                }).addTo(map);
              }
            }
          };

          const handleMapRightClick = (e: any) => {
            e.originalEvent.preventDefault();

            if (isDrawing && currentPointsRef.current.length >= 3) {

              // Clean up temporary markers
              markersRef.current.forEach(marker => map.removeLayer(marker));
              markersRef.current = [];

              // Create final polygon
              if (currentPolygonRef.current) {
                map.removeLayer(currentPolygonRef.current);
              }

              const finalPolygon = L.polygon(currentPointsRef.current, {
                color: '#3b82f6',
                weight: 3,
                opacity: 0.8,
                fillOpacity: 0.2,
                fillColor: '#3b82f6'
              }).addTo(map);

              currentPolygonRef.current = finalPolygon;
              onPolygonCreated(currentPointsRef.current);

              setIsDrawing(false);
              currentPointsRef.current = [];
              updatePointCounter(0);
            }
          };

          const handleKeyPress = (e: any) => {
            if (e.key === 'Escape' && isDrawing) {

              // Clean up
              markersRef.current.forEach(marker => map.removeLayer(marker));
              markersRef.current = [];

              if (currentPolygonRef.current) {
                map.removeLayer(currentPolygonRef.current);
                currentPolygonRef.current = null;
              }

              setIsDrawing(false);
              currentPointsRef.current = [];
              updatePointCounter(0);
            }
          };

          // Add event listeners
          map.on('click', handleMapClick);
          map.on('contextmenu', handleMapRightClick);
          document.addEventListener('keydown', handleKeyPress);

          // Cleanup function
          return () => {
            map.off('click', handleMapClick);
            map.off('contextmenu', handleMapRightClick);
            document.removeEventListener('keydown', handleKeyPress);
            pointCounter.remove();

            // Clean up any remaining markers/polygons
            markersRef.current.forEach(marker => map.removeLayer(marker));
            if (currentPolygonRef.current) {
              map.removeLayer(currentPolygonRef.current);
            }
          };
        }
      } catch (error) {
        // Handle error silently
      }
    };

    const cleanup = setupManualDrawing();

    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then((cleanupFn: any) => {
          if (typeof cleanupFn === 'function') {
            cleanupFn();
          }
        });
      }
    };
  }, [map, isActive, isDrawing, onPolygonCreated]);

  return null;
};

export default SimpleDrawing;
