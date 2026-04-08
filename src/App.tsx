import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Map } from "react-map-gl/maplibre";
import { DeckGL } from "@deck.gl/react";
import { GeoJsonLayer } from "deck.gl";
import { extent } from "d3-array";
import { scaleLinear } from "d3-scale";

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
  "https://raw.githubusercontent.com/jdanielgoh/indice-cuidados-mx/refs/heads/main/public/INDICE_MUJERES_CUIDADORAS_GTO_TEST.geojson";

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: -101,
  latitude: 21,
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
  0: [120, 153, 212],
  1: [114, 114, 171],
  2: [114, 87, 147],
  3: [113, 60, 122],
  4: [112, 5, 72],
};
function rgbToHex([r, g, b]: number[]) {
  return `rgb(${r},${g},${b})`;
}
function Nomenclatura() {
  const dict = dict_color_indice;

  return (
    <Box sx={{ mt: 0 }}>
      <FormLabel sx={{ fontSize: 12 }}>Nomenclatura</FormLabel>
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
const escalaAltura = scaleLinear().range([0, 2000]);
export default function App() {
  const [open, setOpen] = useState(true);
  const [minmax, setMinmax] = useState([0, 1]);
  const [data, setData] = useState<Municipio[]>();

  // Cargar GeoJSON
  useEffect(() => {
    fetch(DATA_URL)
      .then((resp) => resp.json())
      .then((json) => {
        console.log(json.features);
        setData(json.features);
        setMinmax(
          extent(json.features?.map((dd) => dd.properties["POR_MUJERES"])),
        );
        escalaAltura.domain(
          extent(json.features?.map((dd) => dd.properties["POR_MUJERES"])),
        );
        console.log(
          extent(json.features?.map((dd) => dd.properties["POR_MUJERES"])),
        );
      });
  }, []);

  const layers = [
    new GeoJsonLayer<MunicipioProperties>({
      id: "geojson",
      data,
      stroked: true,
      filled: true,
      getFillColor: (f) => dict_color_indice[f.properties.MIC],
      getElevation: (f) => escalaAltura(f.properties["POR_MUJERES"]),
      wireframe: false,
      extruded: true,
      pickable: true,
      autoHighlight: true,

      updateTriggers: {
        getElevation: [minmax],
      },
    }),
  ].filter(Boolean);

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
