import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Map } from "react-map-gl/maplibre";
import { DeckGL } from "@deck.gl/react";
import { GeoJsonLayer } from "deck.gl";
import { extent } from "d3-array";
import { scaleThreshold } from "d3-scale";

import type { MapViewState } from "@deck.gl/core";
import type { Feature, Polygon, MultiPolygon } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Paper,
  FormLabel,
  IconButton,
  Collapse,
  Box,
  Typography,
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";

const DATA_URL =
  "https://raw.githubusercontent.com/jdanielgoh/indice-cuidados-mx/refs/heads/main/public/AGEB_ESTATLES_12_INFANCIAS_0A5.geojson";
const CENTROS_CUIDADO_URL =
  "https://raw.githubusercontent.com/jdanielgoh/indice-cuidados-mx/refs/heads/main/public/CENTROS_CUIDADO_ESTATALES_12.geojson";
const BUFFERS =
  "https://raw.githubusercontent.com/jdanielgoh/indice-cuidados-mx/refs/heads/main/public/BUFFERS_CENTROS_ESTATALES_12.geojson";
const INITIAL_VIEW_STATE: MapViewState = {
  longitude: -99.8,
  latitude: 16.8,
  zoom: 10,
  maxZoom: 15,
  pitch: 60,
  bearing: 0,
};
const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

type MunicipioProperties = {
  CVEGEO: string;
  POR_MUJERES: string;
  NOM_ENT: string;
  cve_mun: string;
  centroid: [number, number];
  MIC: number;
};

const dict_color_indice = {
  "Menos de 3%": [181, 212, 244],
  "De de 3% a 9%": [93, 202, 165],
  "De de 9% a 13%": [250, 199, 117],
  "Más de 13%": [216, 90, 48],
};
function rgbToHex([r, g, b]: number[]) {
  return `rgb(${r},${g},${b})`;
}
function Nomenclatura() {
  const dict = dict_color_indice;

  return (
    <Box sx={{ mt: 0 }}>
      <FormLabel sx={{ fontSize: 12 }}>
        % de menores de 5 años por AGEB
      </FormLabel>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 0.5 }}>
        {Object.entries(dict).map(([label, color]) => (
          <Box
            key={label}
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Box
              sx={{
                width: 14,
                height: 14,
                borderRadius: "3px",
                flexShrink: 0,
                backgroundColor: rgbToHex(color),
              }}
            />
            <Typography variant="caption" sx={{ lineHeight: 1 }}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
type Municipio = Feature<Polygon | MultiPolygon, MunicipioProperties>;

// Calcula arcos
const colorRanges = [
  [181, 212, 244],
  [93, 202, 165],
  [250, 199, 117],
  [216, 90, 48],
];
const escalaColor = scaleThreshold<number, number>()
  .domain([3, 9, 13])
  .range([0, 1, 2, 3]);
export default function App() {
  const [open, setOpen] = useState(true);
  const [data, setData] = useState<Municipio[]>();
  const [centros, setCentros] = useState();
  const [buffers, setBuffers] = useState();

  // Cargar GeoJSON
  useEffect(() => {
    fetch(DATA_URL)
      .then((resp) => resp.json())
      .then((json) => {
        setData(json.features);
      });
    fetch(CENTROS_CUIDADO_URL)
      .then((resp) => resp.json())
      .then((json) => {
        setCentros(json.features);
      });
    fetch(BUFFERS)
      .then((resp) => resp.json())
      .then((json) => {
        console.log(json.features);
        setBuffers(json.features);
      });
  }, []);

  const layers = [
    new GeoJsonLayer<MunicipioProperties>({
      id: "agebs",
      data,
      stroked: true,
      filled: true,
      getFillColor: (f) =>
        colorRanges[escalaColor(f.properties["INFANCIA_0_5"])],

      pickable: true,
      autoHighlight: true,
    }),
    new GeoJsonLayer({
      id: "centros",
      data: centros,
      stroked: true,
      filled: true,
      getFillColor: [200, 0, 0],
      pickable: true,
      autoHighlight: true,
      getPointRadius: 4,
      pointRadiusMinPixels: 3,
    }),
    new GeoJsonLayer({
      id: "buffers",
      data: buffers,
      stroked: true,
      filled: true,
      getFillColor: (f) => [0, 0, 0, 50],
    }),
  ];

  return (
    <>
      <Paper
        elevation={3}
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
          p: 1,
          borderRadius: 2,
          zIndex: 1,
          backgroundColor: "rgba(255,255,255,0.9)",
          minWidth: 200,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <strong>Controles</strong>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Collapse in={open} timeout="auto" unmountOnExit>
          <Nomenclatura />
        </Collapse>
      </Paper>
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
