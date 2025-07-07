declare module "react-leaflet-heatmap-layer-v3" {
  import { ReactElement } from "react";

  export interface HeatmapLayerProps {
    fitBoundsOnLoad?: boolean;
    fitBoundsOnUpdate?: boolean;
    points: [number, number, number][];
    longitudeExtractor?: (point: [number, number, number]) => number;
    latitudeExtractor?: (point: [number, number, number]) => number;
    intensityExtractor?: (point: [number, number, number]) => number;
    gradient?: { [key: number]: string };
    max?: number;
    radius?: number;
    blur?: number;
    minOpacity?: number;
    maxZoom?: number;
    minZoom?: number;
    [key: string]: unknown;
  }

  export declare const HeatmapLayer: (props: HeatmapLayerProps) => ReactElement;
}
