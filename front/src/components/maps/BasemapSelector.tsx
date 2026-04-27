"use client";

import { useBasemap } from "@/context/BasemapContext";
import { BASEMAPS, BasemapType } from "@/utils/basemaps";

const BasemapSelector: React.FC = () => {
  const { basemap, setBasemap } = useBasemap();

  const handleSelect = (type: BasemapType) => {
    setBasemap(type);
  };

  return (
    <div className="flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 p-1">
      {(["osm", "mapir", "neshan"] as BasemapType[]).map((type) => (
        <button
          key={type}
          onClick={() => handleSelect(type)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
            basemap === type
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
          }`}
        >
          {BASEMAPS[type].name}
        </button>
      ))}
    </div>
  );
};

export default BasemapSelector;