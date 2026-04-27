"use client";

import dynamic from "next/dynamic";

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false },
);

import { useBasemap } from "@/context/BasemapContext";
import { BASEMAPS } from "@/utils/basemaps";

interface BasemapLayerProps {
  className?: string;
}

const BasemapLayer: React.FC<BasemapLayerProps> = ({ className }) => {
  const { basemap, basemapUrl } = useBasemap();
  const config = BASEMAPS[basemap];

  return (
    <TileLayer
      key={basemap}
      url={basemapUrl}
      attribution={config.attribution}
      className={className}
    />
  );
};

export default BasemapLayer;