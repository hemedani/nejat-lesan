export interface DrawCreatedEvent {
  layer: {
    toGeoJSON(): GeoJSON.Feature;
    getRadius?(): number;
  };
  layerType: string;
}

export interface DrawDeletedEvent {
  layers: {
    [key: string]: {
      toGeoJSON(): GeoJSON.Feature;
    };
  };
}

export interface DrawEditedEvent {
  layers: {
    [key: string]: {
      toGeoJSON(): GeoJSON.Feature;
    };
  };
}
