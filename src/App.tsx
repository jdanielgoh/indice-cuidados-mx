import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Map } from "react-map-gl/maplibre";
import { DeckGL } from "@deck.gl/react";
import { GeoJsonLayer } from "deck.gl";

import type { MapViewState } from "@deck.gl/core";
import type { Feature, Polygon, MultiPolygon } from "geojson";

const DATA_URL =
  "https://raw.githubusercontent.com/jdanielgoh/indice-cuidados-mx/refs/heads/main/public/INDICE_MUJERES_CUIDADORAS_GTO_TEST.json";

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: -102,
  latitude: 23,
  zoom: 5,
  maxZoom: 15,
  pitch: 0,
  bearing: 0,
};
const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

type MunicipioProperties = {
  NOMGEO: string;
  CVE_ENT: string;
  NOM_ENT: string;
  cve_mun: string;
  centroid: [number, number];
  valor: number;
};

type Municipio = Feature<Polygon | MultiPolygon, MunicipioProperties>;

// Calcula arcos

export default function App() {
  const [data, setData] = useState<Municipio[]>();

  // Cargar GeoJSON
  useEffect(() => {
    fetch(DATA_URL)
      .then((resp) => resp.json())
      .then((json) => setData(json.features));
  }, []);

  const layers = [
    new GeoJsonLayer<MunicipioProperties>({
      id: "geojson",
      data,
      stroked: true,
      filled: true,
      getFillColor: [200, 200, 200, 240],
      pickable: true,
    }),
  ].filter(Boolean);

  return (
    <>
      <DeckGL
        layers={layers}
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
      >
        <Map reuseMaps mapStyle={MAP_STYLE} />
      </DeckGL>
    </>
  );
}

export function renderToDOM(container: HTMLDivElement) {
  createRoot(container).render(<App />);
}
