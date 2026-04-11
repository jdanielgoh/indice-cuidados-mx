import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Map } from "react-map-gl/maplibre";
import { DeckGL } from "@deck.gl/react";
import { GeoJsonLayer } from "deck.gl";
import { scaleLinear } from "d3-scale";

import type { MapViewState } from "@deck.gl/core";
import type { Feature, Polygon, MultiPolygon } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Paper,
  FormLabel,
  Checkbox,
  FormControlLabel,
  IconButton,
  Collapse,
  Box,
  Slider,
  Typography,
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";

const DATA_URL =
  "https://raw.githubusercontent.com/jdanielgoh/indice-cuidados-mx/refs/heads/main/public/INDICE_MUJERES_CUIDADORAS_GUERRERO.geojson";
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
  0: [250, 199, 117],
  1: [216, 90, 48],
  2: [150, 40, 30],
  3: [100, 15, 15],
  4: [50, 0, 0],
};

function rgbToHex([r, g, b]: number[]) {
  return `rgb(${r},${g},${b})`;
}
function Nomenclatura() {
  const dict = dict_color_indice;

  return (
    <Box sx={{ mt: 0, maxWidth: 250, textAlign: "left" }}>
      <FormLabel>
        Índice de mujeres cuidadoras (cantidad de variables mayor al % nacional
        de la ENASIC 2022 que convergen en la misma AGEB)
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

const escalaAltura = scaleLinear().domain([0, 50]).range([0, 10000]);
export default function App() {
  const [open, setOpen] = useState(true);
  const [data, setData] = useState<Municipio[]>();
  const [centros, setCentros] = useState();
  const [buffers, setBuffers] = useState();
  const [is3D, setIs3D] = useState(true);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [opacidadBuffer, setOpacidadBuffer] = useState(50);

  // Cargar GeoJSON
  const handle3DToggle = (checked: boolean) => {
    setIs3D(checked);
    setViewState((prev) => ({
      ...prev,
      pitch: checked ? 60 : 0,
      transitionDuration: 600,
    }));
  };
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
      getFillColor: (f) => dict_color_indice[f.properties["MIC"]],
      extruded: is3D,
      getElevation: (f) => escalaAltura(f.properties["INFANCIA_0_5"]),
      wireframe: false,
      pickable: true,
      autoHighlight: true,
    }),
    new GeoJsonLayer({
      id: "centros",
      data: centros,
      stroked: true,
      filled: true,
      getFillColor: [100, 200, 0],
      pickable: true,
      autoHighlight: true,
      getPointRadius: 4,
      pointRadiusMinPixels: 5,
    }),
    new GeoJsonLayer({
      id: "buffers",
      extruded: is3D,
      getElevation: 6000,
      data: buffers,
      stroked: true,
      filled: true,
      getFillColor: [100, 0, 200, opacidadBuffer],
      updateTriggers: {
        getFillColor: [opacidadBuffer],
      },
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
          textAlign: "left",
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
          <hr />
          <FormControlLabel
            label="% de primera infancia [3D]"
            control={
              <Checkbox
                checked={is3D}
                size="small"
                onChange={(e) => handle3DToggle(e.target.checked)}
              />
            }
          />
        </Collapse>
        <hr />

        <Box
          sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 0.5 }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 14,
                height: 14,
                borderRadius: "3px",
                flexShrink: 0,
                backgroundColor: rgbToHex([100, 200, 0]),
              }}
            />
            <Typography variant="caption" sx={{ lineHeight: 1 }}>
              Guarderías
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 14,
                height: 14,
                borderRadius: "3px",
                flexShrink: 0,
                backgroundColor: rgbToHex([200, 100, 200, 100]),
              }}
            />
            <Typography variant="caption" sx={{ lineHeight: 1 }}>
              Buffer: Radio de 1km a guarderías
            </Typography>
          </Box>
          <Box sx={{ mt: 1 }}>
            <FormLabel sx={{ fontSize: 12 }}>Opacidad buffer</FormLabel>
            <Slider
              size="small"
              min={0}
              max={255}
              value={opacidadBuffer}
              onChange={(_, val) => setOpacidadBuffer(val as number)}
            />
          </Box>
        </Box>
      </Paper>
      <DeckGL
        layers={layers}
        initialViewState={viewState}
        onViewStateChange={({ viewState: vs }) =>
          setViewState(vs as MapViewState)
        }
        controller={true}
        getTooltip={({ object, layer }) => {
          if (!object || layer?.id == "buffer") return null;
          else if (layer?.id == "agebs") {
            const p = object.properties;
            return {
              html: `
        <div style="line-height: 1.8; font-size: 12px;">
          <b>AGEB: ${p.CVEGEO}</b>
          <hr style="margin: 4px 0; opacity: 0.3"/>
          <div>Índice Mujeres Cuidadoras: <b>${p.MIC}</b></div>
          <div>% primera infancia: <b>${p.INFANCIA_0_5}</b></div>
          <div>% mujeres 30-49 años: <b>${p["30_49"]}%</b></div>
          <div>% mujeres desempleadas: <b>${p.DESEMP}%</b></div>
          <div>% con primaria concluida: <b>${p.PRIMAR}%</b></div>
          <div>% mujeres casadas: <b>${p.CASAD}%</b></div>
        </div>
      `,
              style: {
                backgroundColor: "rgba(20,20,20,0.85)",
                color: "white",
                fontSize: "12px",
                borderRadius: "6px",
                padding: "8px 12px",
                textAlign: "left",
              },
            };
          } else if (layer?.id == "centros") {
            const p = object.properties;
            return {
              html: `
        <div style="line-height: 1.8; font-size: 12px;">
          <b>Nombre: ${p.nom_estab}</b>
          <hr style="margin: 4px 0; opacity: 0.3"/>
          <div>Tipo: <b>${p.nombre_act}</b></div>
          <div>Personal: <b>${p.per_ocu}</b></div>
        </div>
      `,
              style: {
                backgroundColor: "rgba(20,20,20,0.85)",
                color: "white",
                fontSize: "12px",
                borderRadius: "6px",
                padding: "8px 12px",
                textAlign: "left",
              },
            };
          }
        }}
      >
        <Map reuseMaps mapStyle={MAP_STYLE} />
      </DeckGL>
    </>
  );
}

export function renderToDOM(container: HTMLDivElement) {
  createRoot(container).render(<App />);
}
