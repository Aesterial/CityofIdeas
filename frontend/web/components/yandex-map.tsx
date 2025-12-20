"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

interface YandexMapProps {
  center?: [number, number]
  zoom?: number
  className?: string
  markers?: Array<{
    coordinates: [number, number]
    title: string
    description?: string
  }>
}

declare global {
  interface Window {
    ymaps: any
  }
}

export function YandexMap({
  center = [55.3541, 86.0877],
  zoom = 14,
  className = "",
  markers = [],
}: YandexMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const loadYandexMaps = () => {
      if (window.ymaps) {
        window.ymaps.ready(() => {
          if (mapRef.current && !mapInstance) {
            const map = new window.ymaps.Map(mapRef.current, {
              center: center,
              zoom: zoom,
              controls: ["zoomControl", "fullscreenControl"],
            })


            markers.forEach((marker) => {
              const placemark = new window.ymaps.Placemark(
                marker.coordinates,
                {
                  balloonContentHeader: marker.title,
                  balloonContentBody: marker.description || "",
                },
                {
                  preset: "islands#redDotIcon",
                },
              )
              map.geoObjects.add(placemark)
            })

            setMapInstance(map)
            setIsLoaded(true)
          }
        })
      }
    }


    if (window.ymaps) {
      loadYandexMaps()
    } else {

      const script = document.createElement("script")
      script.src = "https://api-maps.yandex.ru/2.1/?apikey=YOUR_API_KEY&lang=ru_RU"
      script.onload = loadYandexMaps
      document.head.appendChild(script)
    }

    return () => {
      if (mapInstance) {
        mapInstance.destroy()
      }
    }
  }, [center, zoom, markers])

  return (
    <motion.div
      className={`relative flex flex-col overflow-hidden rounded-3xl ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
      </div>

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <motion.div
            className="text-muted-foreground"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
          >
            Загрузка карты...
          </motion.div>
        </div>
      )}

      <div ref={mapRef} className="w-full flex-1 min-h-[260px] bg-muted sm:min-h-[320px] lg:min-h-[360px]" />
    </motion.div>
  )
}
