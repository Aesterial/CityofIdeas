"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Header } from "@/components/header"
import { GradientButton } from "@/components/gradient-button"
import { YandexMap } from "@/components/yandex-map"
import { Upload, X, MapPin, Camera, FileText } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

export default function SuggestPage() {
  const [formData, setFormData] = useState({
    address: "",
    description: "",
    category: "",
  })
  const [images, setImages] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const { t } = useLanguage()

  const categories = [
    { key: "landscaping", label: t("landscaping") },
    { key: "roadsAndSidewalks", label: t("roadsAndSidewalks") },
    { key: "lighting", label: t("lighting") },
    { key: "playgrounds", label: t("playgrounds") },
    { key: "parksAndSquares", label: t("parksAndSquares") },
    { key: "other", label: t("other") },
  ]

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          if (e.target?.result) {
            setImages((prev) => [...prev, e.target!.result as string])
          }
        }
        reader.readAsDataURL(file)
      }
    })
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[~] Submitting:", { ...formData, images })
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-12 px-4 sm:pt-28 sm:pb-16 sm:px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold mb-3 sm:text-4xl">{t("suggestIdea")}</h1>
            <p className="text-muted-foreground mb-8 sm:mb-10">{t("describeIssue")}</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">

              <motion.div
                className="space-y-5 sm:space-y-6"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    {t("address")}
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder={t("enterAddressOrSelectOnMap")}
                    className="w-full bg-card border border-border rounded-2xl py-3 px-5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 sm:py-4"
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium mb-2">{t("category")}</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <motion.button
                        key={cat.key}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat.key })}
                        className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 sm:px-4 sm:text-sm ${
                          formData.category === cat.key
                            ? "bg-foreground text-background"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {cat.label}
                      </motion.button>
                    ))}
                  </div>
                </div>


                <div>
                  <label className="block text-sm font-medium mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    {t("description")}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t("describeYourIdea")}
                    rows={5}
                    className="w-full bg-card border border-border rounded-2xl py-3 px-5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 resize-none sm:py-4"
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Camera className="w-4 h-4 inline mr-2" />
                    {t("photos")}
                  </label>
                  <motion.div
                    onDrop={handleDrop}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDragging(true)
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all duration-300 sm:p-8 ${
                      isDragging ? "border-foreground bg-foreground/5" : "border-border hover:border-foreground/50"
                    }`}
                    whileHover={{ scale: 1.01 }}
                  >
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-3 sm:w-10 sm:h-10" />
                    <p className="text-sm text-muted-foreground sm:text-base">
                      {t("dragImagesOrSelect")}{" "}
                      <label className="text-foreground cursor-pointer hover:underline">
                        {t("selectFiles")}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || [])
                            files.forEach((file) => {
                              const reader = new FileReader()
                              reader.onload = (e) => {
                                if (e.target?.result) {
                                  setImages((prev) => [...prev, e.target!.result as string])
                                }
                              }
                              reader.readAsDataURL(file)
                            })
                          }}
                        />
                      </label>
                    </p>
                  </motion.div>


                  {images.length > 0 && (
                    <motion.div
                      className="flex gap-3 mt-4 flex-wrap"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {images.map((img, index) => (
                        <motion.div
                          key={index}
                          className="relative w-20 h-20 rounded-xl overflow-hidden group sm:w-24 sm:h-24"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <img src={img || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 w-6 h-6 bg-foreground/80 text-background rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </motion.div>


              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <label className="block text-sm font-medium mb-2">{t("markOnMap")}</label>
                <YandexMap className="min-h-[220px] sm:min-h-[300px] lg:min-h-[360px]" />
                <p className="text-sm text-muted-foreground mt-2">{t("clickMapToMark")}</p>
              </motion.div>
            </div>


            <motion.div
              className="flex justify-center pt-2 sm:pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <GradientButton type="submit" className="w-full justify-center px-10 sm:w-auto sm:px-12">
                {t("submitIdea")}
              </GradientButton>
            </motion.div>
          </form>
        </div>
      </main>
    </div>
  )
}
