"use client";

import dynamic from "next/dynamic";
import type { PropertyMapProps } from "./PropertyMap";

const PropertyMap = dynamic(() => import("./PropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[250px] sm:h-[400px] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center">
      <span className="text-gray-400 text-sm">A carregar mapa...</span>
    </div>
  ),
});

export default function PropertyMapWrapper(props: PropertyMapProps) {
  return <PropertyMap {...props} />;
}
