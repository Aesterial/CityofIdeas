"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Header } from "@/components/header"
import { GradientButton } from "@/components/gradient-button"
import { Search, Heart, Plus } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import type { Variants } from "framer-motion";


interface IdeaCard {
  id: number
  address: string
  descriptionKey: string
  mapImage: string
  photoImage: string
  votes: number
  isLiked: boolean
}

const mockIdeas: IdeaCard[] = [
  {
    id: 1,
    address: "Советский просп., 77",
    descriptionKey: "leaksFromRoof",
    mapImage: "/aerial-satellite-view-kemerovo-city-block.jpg",
    photoImage: "/building-entrance-with-awning-kemerovo.jpg",
    votes: 142,
    isLiked: false,
  },
  {
    id: 2,
    address: "Ноградская ул., 5",
    descriptionKey: "brokenWindow",
    mapImage: "/aerial-satellite-view-residential-kemerovo.jpg",
    photoImage: "/pub-building-facade-harats-kemerovo.jpg",
    votes: 98,
    isLiked: false,
  },
  {
    id: 3,
    address: "ул. 50 лет Октября, 10",
    descriptionKey: "needsCrosswalk",
    mapImage: "/aerial-view-street-intersection-kemerovo.jpg",
    photoImage: "/busy-street-without-crosswalk.jpg",
    votes: 234,
    isLiked: true,
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export default function VotingPage() {
  const [ideas, setIdeas] = useState<IdeaCard[]>(mockIdeas)
  const [searchQuery, setSearchQuery] = useState("")
  const { t } = useLanguage()

  const toggleLike = (id: number) => {
    setIdeas(
      ideas.map((idea) =>
        idea.id === id
          ? { ...idea, isLiked: !idea.isLiked, votes: idea.isLiked ? idea.votes - 1 : idea.votes + 1 }
          : idea,
      ),
    )
  }

  const filteredIdeas = ideas.filter(
    (idea) =>
      idea.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t(idea.descriptionKey).toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-28 pb-16 px-6">
        <div className="container mx-auto max-w-5xl">

          <motion.div
            className="flex items-center justify-between mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl lg:text-5xl font-bold">{t("voting")}</h1>

            <div className="relative">
              <input
                type="text"
                placeholder={t("searchIdeas")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-card border border-border rounded-full px-5 py-3 pr-12 w-48 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>
          </motion.div>

          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
            <AnimatePresence mode="popLayout">
              {filteredIdeas.map((idea) => (
                <motion.div
                  key={idea.id}
                  variants={cardVariants}
                  layout
                  className="bg-card dark:bg-neutral-800 rounded-[2rem] p-6 shadow-lg hover:shadow-xl transition-all duration-500"
                  whileHover={{ y: -4 }}
                >

                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl lg:text-2xl font-bold">{idea.address}</h3>
                    <motion.button
                      onClick={() => toggleLike(idea.id)}
                      className={`p-2 rounded-full transition-colors duration-300 ${
                        idea.isLiked ? "text-red-500" : "text-muted-foreground hover:text-foreground"
                      }`}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Plus className="w-6 h-6" strokeWidth={1.5} />
                    </motion.button>
                  </div>


                  <div className="flex gap-4 items-stretch">

                    <motion.div
                      className="relative w-40 h-32 rounded-2xl overflow-hidden flex-shrink-0 shadow-md"
                      whileHover={{ scale: 1.03 }}
                      transition={{ duration: 0.3 }}
                    >
                      <img
                        src={idea.mapImage || "/placeholder.svg"}
                        alt={`Карта - ${idea.address}`}
                        className="w-full h-full object-cover"
                      />

                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-5 h-5 bg-red-500 rounded-full border-2 border-white shadow-lg" />
                    </motion.div>


                    <motion.div
                      className="relative w-40 h-32 rounded-2xl overflow-hidden flex-shrink-0 shadow-md"
                      whileHover={{ scale: 1.03 }}
                      transition={{ duration: 0.3 }}
                    >
                      <img
                        src={idea.photoImage || "/placeholder.svg"}
                        alt={`Фото - ${idea.address}`}
                        className="w-full h-full object-cover"
                      />

                      <div className="absolute bottom-4 right-4 w-5 h-5 bg-red-500 rounded-full border-2 border-white shadow-lg" />
                    </motion.div>


                    <div className="flex-1 bg-muted dark:bg-neutral-600 rounded-2xl p-6 flex items-center justify-center relative min-h-32">
                      <span className="absolute top-3 left-4 text-4xl text-muted-foreground font-serif leading-none">
                        "
                      </span>
                      <p className="text-center font-bold text-lg">{t(idea.descriptionKey)}</p>
                      <span className="absolute bottom-3 right-4 text-4xl text-muted-foreground font-serif leading-none">
                        "
                      </span>
                    </div>
                  </div>


                  <div className="mt-4 flex items-center justify-end">
                    <motion.button
                      onClick={() => toggleLike(idea.id)}
                      className={`flex items-center gap-2 transition-colors duration-300 ${
                        idea.isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Heart className={`w-5 h-5 ${idea.isLiked ? "fill-current" : ""}`} />
                      <span className="text-sm font-medium">{idea.votes}</span>
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>


          <motion.div
            className="mt-12 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <GradientButton className="px-12">{t("vote")}</GradientButton>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
