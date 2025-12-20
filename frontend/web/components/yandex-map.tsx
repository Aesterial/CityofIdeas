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
  const mapInstanceRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let isCancelled = false

    const loadYandexMaps = () =>
      new Promise<void>((resolve) => {
        if (window.ymaps) {
          resolve()
          return
        }

        const existingScript = document.getElementById("yandex-maps-script") as HTMLScriptElement | null
        if (existingScript) {
          existingScript.addEventListener("load", () => resolve(), { once: true })
          return
        }

        const script = document.createElement("script")
        script.id = "yandex-maps-script"
        script.src = "https://api-maps.yandex.ru/2.1/?apikey=YOUR_API_KEY&lang=ru_RU"
        script.onload = () => resolve()
        document.head.appendChild(script)
      })

    const initMap = async () => {
      await loadYandexMaps()
      if (isCancelled || !window.ymaps || !mapRef.current) {
        return
      }

      window.ymaps.ready(() => {
        if (isCancelled || !mapRef.current) {
          return
        }

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new window.ymaps.Map(mapRef.current, {
            center,
            zoom,
            controls: ["zoomControl", "fullscreenControl"],
          })
        } else {
          mapInstanceRef.current.setCenter(center)
          mapInstanceRef.current.setZoom(zoom)
          mapInstanceRef.current.geoObjects.removeAll()
        }

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
          mapInstanceRef.current.geoObjects.add(placemark)
        })

        setIsLoaded(true)
      })
    }

    initMap()

    return () => {
      isCancelled = true
    }
  }, [center, zoom, markers])

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <motion.div
      className={`relative flex flex-col overflow-hidden rounded-3xl ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      
      <div className="bg-card border-b border-border px-3 py-2 flex items-center gap-2 sm:px-4 sm:py-3">
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
