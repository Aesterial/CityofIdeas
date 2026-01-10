"use client";

import { useState, type CSSProperties, type MouseEvent } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/header";
import { GradientButton } from "@/components/gradient-button";
import { YandexMap } from "@/components/yandex-map";
import { useLanguage } from "@/components/language-provider";
import {
  ArrowRight,
  MapPin,
  Users,
  Lightbulb,
  Search,
  Plus,
} from "lucide-react";
import type { Variants } from "framer-motion";
import { Logo } from "@/components/logo";

const art = String.raw`⠀⠀⠀⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣶⣤⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⣿⠛⠻⢷⣤⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡇⠀⠈⠛⠷⣤⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⣿⡄⠀⠀⠈⠻⣦⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠘⣧⠀⢀⣄⡀⠈⠻⢦⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠘⣧⠀⢀⡀⠀⠈⠙⢷⣄⠀⠀⠀⠀⠀⠀⠀⢸⡿⢿⡀⠘⡏⠛⢦⠀⠀⠙⢷⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢹⣇⢸⡏⠳⣄⠀⢺⡿⣦⡀⣀⣤⡶⠾⠛⠛⠻⡄⠙⠀⣸⡄⠈⠳⡄⠀⠈⠻⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢻⡄⢳⡀⢈⣷⠀⠻⠀⠉⠁⠀⠀⠀⠀⠀⠀⠀⡄⠀⠀⠉⠳⢤⣻⡀⠀⠀⠹⣧⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠈⣧⠀⣷⠟⠁⠀⠚⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢷⡄⠀⠀⠘⣧⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢺⣯⣾⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣧⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⣸⡏⠙⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣆⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢠⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣿⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣾⠁⢀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⡇⠀⠀⠀⠀
⠀⠀⠀⣸⡇⠀⢺⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀⠀⠀⠀⠀⢸⡇⠀⠀⠀⠀
⢀⣠⣿⢿⡁⠀⠀⢻⣶⣤⣄⣀⣤⣴⡿⠂⠀⠀⠀⠀⠀⠀⢴⣦⣀⠀⠀⠀⢀⣠⣴⡛⠁⠀⠀⠀⠀⢸⡇⠀⠀⠀⠀
⢸⣍⠙⠓⠉⠀⠀⣸⡆⠈⠉⠉⣻⡄⠀⠀⠀⣶⠦⣤⣄⠀⠀⠉⠙⣿⠛⠛⠉⠁⣠⡇⠀⠀⠀⠀⣤⣿⣧⠀⠀⠀⠀
⠀⠙⢷⣦⡀⠀⢹⡇⠀⠀⠀⣰⠿⠁⠀⠀⠀⠛⢶⠛⠁⠀⠀⠀⠰⣟⡀⠀⠀⠰⣇⠀⠀⠀⠀⠀⢀⣴⡏⠀⠀⠀⠀
⠀⠀⠀⠘⢧⣀⡞⠋⠀⠀⠰⡇⠀⠀⠀⠀⠀⣴⠿⠦⠀⠀⠀⠀⠀⣸⠇⠀⠀⢀⡿⠃⠀⠀⢀⣀⣀⣼⠇⠀⠀⠀⠀
⠀⠀⠀⠀⠈⠻⢧⣀⠠⢤⡾⠛⠀⠀⠀⠀⠀⠀⠀⠀⡞⠛⠳⢦⡈⣧⠀⠀⠀⠘⢦⡀⠀⣠⡾⠛⠋⠁⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠙⠻⢾⣆⡀⠀⠀⠀⠀⠀⠀⠀⠀⣇⠀⠀⠀⠹⣎⣆⠀⢀⣢⣼⡷⠞⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢙⡿⠶⠦⣤⡀⠀⠀⠀⢹⣄⠀⠀⠀⠈⢻⡿⣿⡉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⠏⠀⠀⢀⡆⠀⠀⠀⠀⠀⠹⣆⠀⠀⠀⠀⠹⣮⠻⣦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⣠⡾⠁⠀⠀⠀⣾⠁⠀⠀⠀⠀⠀⠀⠘⢧⡀⠀⠀⠀⠀⠀⣿⠀⠀⠀⠀⠀⠀⠀⣀⣶⠿⢷⣤
⠀⠀⠀⠀⠀⠀⠀⠀⡟⠀⠀⣀⣤⢾⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠲⢤⣤⣤⡾⠋⠀⠀⠀⠀⠀⢀⣾⠏⠀⠀⢀⣿
⠀⠀⠀⠀⠀⠀⠀⠀⠻⠖⠛⠋⠀⣼⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⣧⠀⠀⠀⠀⠀⠀⣴⠟⠁⠀⠀⣠⡾⠃
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⠀⠀⠀⢀⣰⠾⠁⠀⣀⣤⠾⠋⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⡦⠶⠾⣛⣁⣤⠶⠟⠋⠁⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⠀⠀⣀⣤⣤⣤⡤⠤⠤⠤⣤⣤⣄⣀⠀⢾⡶⠶⠛⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡏⠀⠀⣸⡏⠀⠀⠀⠀⠀⠀⠀⠀⢷⡀⠀⢸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⣷⠀⢠⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⣧⠀⣸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠻⠛⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⠿⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀`;

const lines = art.split("\n");
const n = Math.max(lines.length - 1, 1);

for (let i = 0; i < lines.length; i++) {
  const hue = Math.round((i / n) * 360);
  const style = [
    `color: hsl(${hue} 95% 70%)`,
    `background: #05060a`,
    `font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`,
    `font-size: 12px`,
    `line-height: 12px`,
    `white-space: pre`,
    `text-shadow: 0 0 10px hsla(${hue}, 95%, 70%, .55), 0 0 2px hsla(${hue}, 95%, 70%, .9)`,
    `padding: 0 6px`,
  ].join("; ");
  console.log(`%c${lines[i]}`, style);
}

const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const containerVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: easeOut,
      when: "beforeChildren",
      staggerChildren: 0.08,
    },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.1,
      ease: easeOut,
    },
  },
};

const popularIdeas = [
  { rank: 1, address: "Построить ледяные горки (Советский просп., 77)" },
  {
    rank: 2,
    address: "Установить пешеходный переход (ул. 50 лет Октября, 10)",
  },
  { rank: 3, address: "Установить Светофор (Весенняя ул., 21)" },
];

const ideasForVoting = [
  {
    id: 1,
    address: "Построить ледяные горки (Советский просп., 77)",
    descriptionKey: "leaksFromRoof",
    satelliteImage: "/aerial-satellite-view-kemerovo-city-block.jpg",
    buildingImage: "/building-entrance-with-awning-kemerovo.jpg",
  },
  {
    id: 2,
    address: "Убрать мусор (Ноградская ул., 5)",
    descriptionKey: "brokenWindow",
    satelliteImage: "/aerial-satellite-view-residential-kemerovo.jpg",
    buildingImage: "/pub-building-facade-harats-kemerovo.jpg",
  },
  {
    id: 3,
    address: "Установить пешеходный переход (пр-т Ленина, 90)",
    descriptionKey: "noCrosswalk",
    satelliteImage: "/aerial-view-street-intersection-kemerovo.jpg",
    buildingImage: "/busy-street-without-crosswalk.jpg",
  },
  {
    id: 4,
    address: "Установить Светофор (ул. Соборная, 21)",
    descriptionKey: "brokenWindow",
    satelliteImage: "/aerial-satellite-view-kemerovo-city-block.jpg",
    buildingImage: "/building-entrance-with-awning-kemerovo.jpg",
  },
];

const cardGlowStyle = {
  "--x": "50%",
  "--y": "50%",
} as CSSProperties;

const updateCardGlow = (event: MouseEvent<HTMLDivElement>) => {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  event.currentTarget.style.setProperty("--x", `${x}px`);
  event.currentTarget.style.setProperty("--y", `${y}px`);
};

const resetCardGlow = (event: MouseEvent<HTMLDivElement>) => {
  event.currentTarget.style.setProperty("--x", "50%");
  event.currentTarget.style.setProperty("--y", "50%");
};

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const filteredIdeas = ideasForVoting.filter(
    (idea) =>
      idea.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t(idea.descriptionKey).toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="pt-24 pb-16 px-4 sm:pt-28 sm:pb-20 sm:px-6 lg:pt-32">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 items-center lg:gap-16">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.h1
                variants={itemVariants}
                className="text-3xl sm:text-4xl lg:text-6xl font-bold leading-tight mb-6 text-balance"
              >
                {t("heroTitle")}
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-base text-muted-foreground mb-8 leading-relaxed sm:text-lg lg:text-xl max-w-xl"
              >
                {t("heroSubtitle")}
              </motion.p>

              <motion.div variants={itemVariants}>
                <Link href="/voting">
                  <GradientButton className="w-full justify-center sm:w-auto">
                    {t("start")}
                  </GradientButton>
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <YandexMap
                markers={[
                  {
                    coordinates: [55.3541, 86.0877],
                    title: "Центр Кемерово",
                    description: "Главная площадь города",
                  },
                ]}
              />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-background sm:py-20 sm:px-6">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 items-center lg:gap-16">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-8 sm:mb-12">
                {t("voting")}
              </h2>

              <p className="text-muted-foreground italic mb-6 text-sm sm:text-base">
                {t("mostPopularIdeas")}
              </p>

              <motion.div
                className="bg-card rounded-3xl p-4 mb-8 shadow-sm border border-border sm:p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <div className="space-y-5">
                  {popularIdeas.map((idea, index) => (
                    <motion.div
                      key={idea.rank}
                      className="flex flex-col items-start gap-2 cursor-pointer hover:bg-muted/50 rounded-xl p-3 -mx-3 transition-colors duration-300 sm:flex-row sm:items-center sm:gap-4"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      whileHover={{ x: 8 }}
                    >
                      <span className="text-lg font-bold sm:text-2xl">
                        {idea.rank}.
                      </span>
                      <span className="text-sm font-semibold break-words sm:text-lg">
                        {idea.address}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                <Link href="/voting">
                  <GradientButton className="w-full justify-center sm:w-auto">
                    {t("vote")}
                  </GradientButton>
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="relative">
                <div className="relative w-[72vw] max-w-[280px] h-[420px] bg-foreground rounded-[3.5rem] p-3 shadow-2xl sm:w-64 sm:h-[520px] lg:w-72 lg:h-[580px]">
                  <div className="absolute -right-1 top-28 w-1 h-12 bg-foreground rounded-l-sm" />
                  <div className="absolute -left-1 top-24 w-1 h-8 bg-foreground rounded-r-sm" />
                  <div className="absolute -left-1 top-36 w-1 h-16 bg-foreground rounded-r-sm" />

                  <div className="bg-background w-full h-full rounded-[3rem] overflow-hidden relative">
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-8 bg-foreground rounded-full" />

                    <div className="pt-14 px-3 h-full flex flex-col items-center justify-center sm:pt-16 sm:px-4">
                      <motion.div
                        className="text-center"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                        }}
                      >
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                          <MapPin className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t("ideas")}
                        </p>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-background sm:py-20 sm:px-6">
        <div className="container mx-auto">
          <motion.div
            className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between sm:mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              {t("voting")}
            </h2>

            <div className="relative">
              <input
                type="text"
                placeholder={t("searchIdeas")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all duration-300 sm:w-60 lg:w-64"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>
          </motion.div>

          <div className="space-y-6 sm:space-y-8">
            {filteredIdeas.map((idea, index) => (
              <motion.div
                key={idea.id}
                className="bg-card rounded-3xl p-5 shadow-lg border border-border sm:p-6 lg:p-8"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex flex-col items-start gap-2 mb-5 sm:flex-row sm:items-center sm:gap-3 sm:mb-6">
                  <h3 className="text-lg font-bold break-words sm:text-xl lg:text-2xl">
                    {idea.address}
                  </h3>
                  <motion.button
                    className="w-7 h-7 shrink-0 rounded-full border-2 border-foreground/30 flex items-center justify-center hover:bg-foreground hover:text-background transition-all duration-300 sm:w-8 sm:h-8"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </motion.button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
                  <motion.div
                    className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md sm:aspect-square"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Image
                      src={idea.satelliteImage || "/placeholder.svg"}
                      alt={`Спутниковый снимок ${idea.address}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-3 left-3 w-6 h-6 rounded-full border-2 border-red-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                    </div>
                  </motion.div>

                  <motion.div
                    className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md sm:aspect-square"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Image
                      src={idea.buildingImage || "/placeholder.svg"}
                      alt={`Фото здания ${idea.address}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full border-2 border-red-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                    </div>
                  </motion.div>

                  <motion.div
                    className="relative aspect-[4/3] rounded-2xl bg-muted flex items-center justify-center p-5 shadow-md sm:aspect-square sm:p-6"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="absolute top-4 left-4 text-2xl text-muted-foreground/50 sm:text-4xl">
                      "
                    </span>
                    <p className="text-sm font-bold text-center sm:text-base lg:text-xl">
                      {t(idea.descriptionKey)}
                    </p>
                    <span className="absolute bottom-4 right-4 text-2xl text-muted-foreground/50 sm:text-4xl">
                      "
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredIdeas.length === 0 && (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-base text-muted-foreground sm:text-lg">
                {t("ideas")} не найдены
              </p>
            </motion.div>
          )}
        </div>
      </section>

      <section className="py-16 px-4 bg-background sm:py-20 sm:px-6">
        <div className="container mx-auto">
          <motion.div
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 sm:gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              {
                icon: Lightbulb,
                titleKey: "suggestIdea",
                description:
                  "Делитесь своими предложениями по улучшению города",
              },
              {
                icon: Users,
                titleKey: "vote",
                description: "Поддерживайте лучшие инициативы других жителей",
              },
              {
                icon: MapPin,
                titleKey: "ideas",
                description: "Указывайте конкретные места для реализации идей",
              },
            ].map((feature) => (
              <motion.div
                key={feature.titleKey}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                onMouseMove={updateCardGlow}
                onMouseLeave={resetCardGlow}
                style={cardGlowStyle}
                className="group relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/80 p-6 shadow-[0_24px_55px_-40px_rgba(0,0,0,0.45)] transition-all duration-500 hover:shadow-[0_35px_70px_-45px_rgba(0,0,0,0.6)] dark:border-white/10 dark:shadow-[0_30px_70px_-50px_rgba(0,0,0,0.9)] before:content-[''] before:absolute before:inset-0 before:pointer-events-none before:opacity-0 before:transition-opacity before:duration-300 before:bg-[radial-gradient(520px_circle_at_var(--x)_var(--y),_rgba(0,0,0,0.16),_transparent_45%)] dark:before:bg-[radial-gradient(520px_circle_at_var(--x)_var(--y),_rgba(255,255,255,0.2),_transparent_45%)] group-hover:before:opacity-100 after:content-[''] after:absolute after:inset-0 after:pointer-events-none after:opacity-60 after:bg-[linear-gradient(130deg,_rgba(255,255,255,0.28),_rgba(255,255,255,0)_55%)] dark:after:bg-[linear-gradient(130deg,_rgba(255,255,255,0.12),_rgba(255,255,255,0)_55%)] sm:p-8"
              >
                <div className="relative z-10">
                  <div className="relative mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background shadow-[0_12px_28px_-12px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:scale-105 sm:h-14 sm:w-14">
                    <span className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_20%,_rgba(255,255,255,0.55),_transparent_60%)] opacity-70" />
                    <feature.icon className="relative h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <h3 className="text-lg font-bold mb-3 sm:text-xl">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed sm:text-base">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4 sm:py-24 sm:px-6">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-6 sm:text-4xl">
              {t("cityOfIdeas")}
            </h2>
            <p className="text-base text-muted-foreground mb-8 max-w-2xl mx-auto sm:text-lg lg:text-xl sm:mb-10">
              {t("heroSubtitle")}
            </p>
            <Link href="/auth">
              <GradientButton className="w-full justify-center sm:w-auto">
                {t("start")}
                <ArrowRight className="w-5 h-5" />
              </GradientButton>
            </Link>
          </motion.div>
        </div>
      </section>

      <motion.footer
        className="relative border-t border-border bg-background"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
      
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 left-1/2 h-48 w-[520px] -translate-x-1/2 rounded-full bg-foreground/5 blur-3xl dark:bg-foreground/10" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/15 to-transparent" />
        </div>
      
        <div className="container mx-auto px-4 py-8 sm:px-6">
          <motion.div
            variants={itemVariants}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
          
            <div className="flex items-center gap-3 min-w-0">
              <Logo className="h-8 w-8 shrink-0" showText={false} />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{t("cityOfIdeas")}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {t("heroSubtitle")}
                </p>
              </div>
            </div>
      
         
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Online
              </span>
      
              <Link
                href="/suggest"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-muted/60"
              >
                {t("suggestIdea")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
      
          <motion.div
            variants={itemVariants}
            className="mt-5 flex flex-col gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
          >
            <span>
              © {currentYear} {t("cityOfIdeas")}
            </span>
      
            <Link
              href="/support"
              className="inline-flex items-center gap-2 hover:text-foreground transition"
            >
              {t("askQuestion")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        </div>
      </motion.footer>

    </div>
  );
}
