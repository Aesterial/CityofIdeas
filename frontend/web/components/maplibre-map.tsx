"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from "motion/react";
import type OlMap from "ol/Map";
import type VectorSource from "ol/source/Vector";
import type { Style as OlStyle } from "ol/style";
import "ol/ol.css";
import { useTheme } from "./theme-provider";

export type MapMarker = {
  id: string;
  coordinates: [number, number];
  title: string;
  description?: string;
};

type MapLibreMapProps = {
  center?: [number, number];
  zoom?: number;
  className?: string;
  markers?: MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
  onMapClick?: (coordinates: [number, number]) => void;
  parallax?: boolean;
};

const DEFAULT_CENTER: [number, number] = [86.0877, 55.3541];

type OlModules = {
  Map: typeof import("ol/Map").default;
  View: typeof import("ol/View").default;
  TileLayer: typeof import("ol/layer/Tile").default;
  VectorLayer: typeof import("ol/layer/Vector").default;
  VectorSource: typeof import("ol/source/Vector").default;
  OSM: typeof import("ol/source/OSM").default;
  XYZ: typeof import("ol/source/XYZ").default;
  Feature: typeof import("ol/Feature").default;
  Point: typeof import("ol/geom/Point").default;
  fromLonLat: typeof import("ol/proj").fromLonLat;
  toLonLat: typeof import("ol/proj").toLonLat;
  Fill: typeof import("ol/style").Fill;
  Stroke: typeof import("ol/style").Stroke;
  Style: typeof import("ol/style").Style;
  Text: typeof import("ol/style").Text;
  RegularShape: typeof import("ol/style").RegularShape;
  defaultControls: typeof import("ol/control").defaults;
};

const markerStyleCache = new Map<string, OlStyle>();

const loadOlModules = async (): Promise<OlModules> => {
  const [
    mapModule,
    viewModule,
    tileLayerModule,
    vectorLayerModule,
    vectorSourceModule,
    osmModule,
    xyzModule,
    featureModule,
    pointModule,
    projModule,
    styleModule,
    controlModule,
  ] = await Promise.all([
    import("ol/Map"),
    import("ol/View"),
    import("ol/layer/Tile"),
    import("ol/layer/Vector"),
    import("ol/source/Vector"),
    import("ol/source/OSM"),
    import("ol/source/XYZ"),
    import("ol/Feature"),
    import("ol/geom/Point"),
    import("ol/proj"),
    import("ol/style"),
    import("ol/control"),
  ]);

  return {
    Map: mapModule.default,
    View: viewModule.default,
    TileLayer: tileLayerModule.default,
    VectorLayer: vectorLayerModule.default,
    VectorSource: vectorSourceModule.default,
    OSM: osmModule.default,
    XYZ: xyzModule.default,
    Feature: featureModule.default,
    Point: pointModule.default,
    fromLonLat: projModule.fromLonLat,
    toLonLat: projModule.toLonLat,
    Fill: styleModule.Fill,
    Stroke: styleModule.Stroke,
    Style: styleModule.Style,
    Text: styleModule.Text,
    RegularShape: styleModule.RegularShape,
    defaultControls: controlModule.defaults,
  };
};

const formatMarkerTitle = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.length <= 28) {
    return trimmed;
  }
  return `${trimmed.slice(0, 26).trimEnd()}...`;
};

const getMarkerStyle = (ol: OlModules, title: string, isDark: boolean) => {
  const label = formatMarkerTitle(title);
  const cacheKey = `${isDark ? "dark" : "light"}:${label || "__default"}`;
  const cached = markerStyleCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const markerFill = isDark ? "#fafafa" : "#111827";
  const markerStroke = isDark ? "#0f1115" : "#ffffff";
  const textColor = isDark ? "#f3f4f6" : "#111827";
  const bgColor = isDark ? "rgba(15, 17, 21, 0.84)" : "rgba(255, 255, 255, 0.92)";

  const style = new ol.Style({
    image: new ol.RegularShape({
      points: 3,
      radius: 10,
      rotation: Math.PI / 2,
      fill: new ol.Fill({ color: markerFill }),
      stroke: new ol.Stroke({ color: markerStroke, width: 2 }),
    }),
    text: label
      ? new ol.Text({
          text: label,
          font: "600 12px var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
          offsetY: -18,
          textAlign: "center",
          textBaseline: "bottom",
          fill: new ol.Fill({ color: textColor }),
          backgroundFill: new ol.Fill({ color: bgColor }),
          padding: [2, 6, 2, 6],
        })
      : undefined,
  });

  markerStyleCache.set(cacheKey, style);
  return style;
};

const createTileSource = (ol: OlModules, isDark: boolean) => {
  if (isDark) {
    return new ol.XYZ({
      url: "https://{a-d}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
      crossOrigin: "anonymous",
      maxZoom: 20,
    });
  }

  return new ol.OSM({
    crossOrigin: "anonymous",
  });
};

export function MapLibreMap({
  center = DEFAULT_CENTER,
  zoom = 12,
  className = "",
  markers = [],
  onMarkerClick,
  onMapClick,
  parallax = true,
}: MapLibreMapProps) {
  const { theme } = useTheme();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<OlMap | null>(null);
  const markerSourceRef = useRef<VectorSource | null>(null);
  const tileLayerRef = useRef<any>(null);
  const [ol, setOl] = useState<OlModules | null>(null);
  const onMarkerClickRef = useRef(onMarkerClick);
  const onMapClickRef = useRef(onMapClick);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isDark = theme === "dark";

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start end", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [46, -46]);
  const parallaxScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.14, 1.06, 1.14]);

  useEffect(() => {
    let active = true;

    if (typeof window === "undefined") {
      return () => {
        active = false;
      };
    }

    loadOlModules()
      .then((modules) => {
        if (active) {
          setOl(modules);
        }
      })
      .catch(() => {
        if (active) {
          setLoadError("Map failed to load. Please try again.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
    onMapClickRef.current = onMapClick;
  }, [onMarkerClick, onMapClick]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !ol) {
      return;
    }

    const tileSource = createTileSource(ol, isDark);
    tileSource.on("tileloaderror", () => {
      setLoadError("Map tiles failed to load. Check your connection.");
    });

    const markerSource = new ol.VectorSource();
    const tileLayer = new ol.TileLayer({ source: tileSource });
    const markerLayer = new ol.VectorLayer({ source: markerSource });

    const map = new ol.Map({
      target: mapContainerRef.current,
      layers: [tileLayer, markerLayer],
      view: new ol.View({
        center: ol.fromLonLat(center),
        zoom,
      }),
      controls: ol.defaultControls({
        attribution: false,
        rotate: false,
        zoom: true,
      }),
    });

    map.once("rendercomplete", () => {
      setIsLoaded(true);
      setLoadError(null);
    });

    map.on("pointermove", (event) => {
      const element = map.getTargetElement();
      if (!element) {
        return;
      }
      element.style.cursor = map.hasFeatureAtPixel(event.pixel) ? "pointer" : "";
    });

    map.on("singleclick", (event) => {
      let clickedMarker: MapMarker | null = null;
      map.forEachFeatureAtPixel(event.pixel, (feature) => {
        const marker = feature.get("marker") as MapMarker | undefined;
        if (marker) {
          clickedMarker = marker;
          return true;
        }
        return false;
      });

      if (clickedMarker) {
        onMarkerClickRef.current?.(clickedMarker);
        return;
      }

      if (onMapClickRef.current) {
        const [lng, lat] = ol.toLonLat(event.coordinate);
        onMapClickRef.current([lng, lat]);
      }
    });

    mapRef.current = map;
    markerSourceRef.current = markerSource;
    tileLayerRef.current = tileLayer;

    const resizeObserver = new ResizeObserver(() => {
      map.updateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.setTarget(undefined);
      mapRef.current = null;
      markerSourceRef.current = null;
      tileLayerRef.current = null;
      setIsLoaded(false);
    };
  }, [center, isDark, ol, zoom]);

  useEffect(() => {
    if (!ol || !tileLayerRef.current) {
      return;
    }

    const nextSource = createTileSource(ol, isDark);
    nextSource.on("tileloaderror", () => {
      setLoadError("Map tiles failed to load. Check your connection.");
    });
    tileLayerRef.current.setSource(nextSource);
  }, [isDark, ol]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ol) {
      return;
    }

    map.getView().animate({
      center: ol.fromLonLat(center),
      zoom,
      duration: 900,
    });
  }, [center, zoom, ol]);

  useEffect(() => {
    const source = markerSourceRef.current;
    if (!source || !ol) {
      return;
    }

    source.clear(true);

    markers.forEach((markerData) => {
      const feature = new ol.Feature({
        geometry: new ol.Point(ol.fromLonLat(markerData.coordinates)),
      });
      feature.set("marker", markerData);
      feature.setStyle(getMarkerStyle(ol, markerData.title, isDark));
      source.addFeature(feature);
    });
  }, [isDark, markers, ol]);

  return (
    <motion.div
      ref={wrapperRef}
      className={`group relative flex flex-col overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 shadow-[0_30px_70px_-40px_rgba(0,0,0,0.58)] backdrop-blur ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      whileHover={{ y: -4 }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.18),transparent_36%)] opacity-70 dark:bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_36%)]" />
      <div className="relative flex items-center gap-2 border-b border-border/70 bg-muted/40 px-4 py-3">
        <div className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
        <div className="h-2.5 w-2.5 rounded-full bg-foreground/35" />
        <div className="h-2.5 w-2.5 rounded-full bg-foreground/55" />
      </div>

      <div className="relative min-h-[300px] flex-1 overflow-hidden sm:min-h-[400px]">
        <AnimatePresence>
          {!isLoaded && (
            <motion.div
              key="loader"
              className="absolute inset-0 z-10 flex items-center justify-center bg-muted/85 backdrop-blur-sm"
              exit={{ opacity: 0 }}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-xs font-medium text-muted-foreground animate-pulse">
                  Loading map...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loadError ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-muted/90 px-6 text-center">
            <p className="text-xs font-medium text-muted-foreground">
              {loadError}
            </p>
          </div>
        ) : null}

        <motion.div
          className="absolute inset-[-8%]"
          style={
            parallax
              ? { y: parallaxY, scale: parallaxScale }
              : undefined
          }
        >
          <div ref={mapContainerRef} className="h-full w-full" />
        </motion.div>
      </div>
    </motion.div>
  );
}
