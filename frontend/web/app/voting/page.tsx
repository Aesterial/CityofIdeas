"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Heart, ListFilter, MapPin, Sparkles } from "lucide-react";
import { Header, cities as availableCities } from "@/components/header";
import { GradientButton } from "@/components/gradient-button";
import { useLanguage } from "@/components/language-provider";
import type { Variants } from "framer-motion";

interface IdeaCard {
  id: number;
  title: string;
  address: string;
  description: string;
  mapImage: string;
  photoImage: string;
  category: string;
  city: string;
  votes: number;
  likes: number;
  isLiked: boolean;
  isVoted: boolean;
  createdAt: string;
}

const mockIdeas: IdeaCard[] = [
  {
    id: 1,
    title: "Построить ледяные горки",
    address: "Парк Ангелов, сектор Б",
    description:
      "Зимой не хватает обустроенного места для катания: нужен безопасный склон и освещение.",
    mapImage: "/aerial-satellite-view-kemerovo-city-block.jpg",
    photoImage: "/building-entrance-with-awning-kemerovo.jpg",
    category: "Зимний отдых",
    city: "Барнаул",
    votes: 214,
    likes: 86,
    isLiked: false,
    isVoted: false,
    createdAt: "2026-01-08",
  },
  {
    id: 2,
    title: "Освещение двора на Советской",
    address: "ул. Советская, 77",
    description:
      "Во дворе темно, вечером небезопасно. Просим установить фонари и подсветить детскую площадку.",
    mapImage: "/aerial-satellite-view-residential-kemerovo.jpg",
    photoImage: "/pub-building-facade-harats-kemerovo.jpg",
    category: "Освещение",
    city: "Бийск",
    votes: 132,
    likes: 54,
    isLiked: false,
    isVoted: false,
    createdAt: "2026-01-06",
  },
  {
    id: 3,
    title: "Безопасный переход на Ленина",
    address: "пр. Ленина, 14",
    description:
      "Нужна зебра, освещение и понижение бордюров, чтобы дети и пешеходы переходили дорогу без риска.",
    mapImage: "/aerial-view-street-intersection-kemerovo.jpg",
    photoImage: "/busy-street-without-crosswalk.jpg",
    category: "Дороги",
    city: "Прокопьевск",
    votes: 198,
    likes: 112,
    isLiked: true,
    isVoted: true,
    createdAt: "2026-01-03",
  },
  {
    id: 4,
    title: "Обновить детскую площадку",
    address: "ул. Набережная, 3",
    description:
      "Площадке нужно мягкое покрытие, новые качели и зона для малышей.",
    mapImage: "/aerial-view-of-city-block-kemerovo.jpg",
    photoImage: "/aerial-view-residential-area-kemerovo.jpg",
    category: "Детские площадки",
    city: "Рубцовск",
    votes: 156,
    likes: 74,
    isLiked: false,
    isVoted: false,
    createdAt: "2026-01-04",
  },
  {
    id: 5,
    title: "Обновить остановки в центре",
    address: "пл. Советская",
    description:
      "Нужны новые навесы, скамьи и расписание маршрутов в хорошем состоянии.",
    mapImage: "/aerial-view-street-intersection-kemerovo.jpg",
    photoImage: "/busy-street-without-crosswalk.jpg",
    category: "Транспорт",
    city: "Котельниково",
    votes: 104,
    likes: 41,
    isLiked: false,
    isVoted: false,
    createdAt: "2026-01-02",
  },
  {
    id: 6,
    title: "Ремонт велодорожки",
    address: "пр. Шахтеров, 12",
    description:
      "Полоса для велосипедов изношена, нужен новый асфальт и разметка.",
    mapImage: "/aerial-satellite-view-kemerovo-city-block.jpg",
    photoImage: "/building-entrance-with-awning-kemerovo.jpg",
    category: "Спорт и движение",
    city: "Ленинск-Кузнецкий",
    votes: 88,
    likes: 33,
    isLiked: false,
    isVoted: false,
    createdAt: "2025-12-29",
  },
  {
    id: 7,
    title: "Светофор у школы",
    address: "ул. Прибрежная, 18",
    description:
      "Школьники переходят дорогу без светофора. Нужен пешеходный узел и подсветка.",
    mapImage: "/aerial-satellite-view-residential-kemerovo.jpg",
    photoImage: "/busy-street-without-crosswalk.jpg",
    category: "Безопасность",
    city: "Полысаево",
    votes: 121,
    likes: 52,
    isLiked: false,
    isVoted: false,
    createdAt: "2026-01-05",
  },
  {
    id: 8,
    title: "Благоустройство набережной",
    address: "наб. Речная",
    description:
      "Нужны дорожки, урны и освещение, чтобы набережная была безопасной вечером.",
    mapImage: "/aerial-view-of-city-block-kemerovo.jpg",
    photoImage: "/aerial-view-residential-area-kemerovo.jpg",
    category: "Благоустройство",
    city: "Мыски",
    votes: 97,
    likes: 29,
    isLiked: false,
    isVoted: false,
    createdAt: "2026-01-01",
  },
  {
    id: 9,
    title: "Озеленение дворов",
    address: "ул. Комсомольская, 5",
    description:
      "Не хватает деревьев и кустарников. Просим высадить зелень и установить автополив.",
    mapImage: "/aerial-satellite-view-kemerovo-city-block.jpg",
    photoImage: "/aerial-view-of-city-block-kemerovo.jpg",
    category: "Озеленение",
    city: "Бородино",
    votes: 66,
    likes: 18,
    isLiked: false,
    isVoted: false,
    createdAt: "2025-12-27",
  },
  {
    id: 10,
    title: "Крытая сцена для праздников",
    address: "пл. Дружбы",
    description: "Хочется небольшую сцену с навесом для городских событий.",
    mapImage: "/aerial-satellite-view-residential-kemerovo.jpg",
    photoImage: "/pub-building-facade-harats-kemerovo.jpg",
    category: "Культура",
    city: "Назарово",
    votes: 75,
    likes: 24,
    isLiked: false,
    isVoted: false,
    createdAt: "2026-01-07",
  },
  {
    id: 11,
    title: "Освещение парка",
    address: "парк Северный",
    description:
      "Установить фонари вдоль главных аллей и на детских площадках.",
    mapImage: "/aerial-view-of-city-block-kemerovo.jpg",
    photoImage: "/aerial-view-residential-area-kemerovo.jpg",
    category: "Освещение",
    city: "Шарыпово",
    votes: 89,
    likes: 37,
    isLiked: false,
    isVoted: false,
    createdAt: "2025-12-26",
  },
  {
    id: 12,
    title: "Скейт-площадка для подростков",
    address: "ул. Молодежная, 2",
    description: "Просим выделить площадку и установить рампы и рейлы.",
    mapImage: "/aerial-satellite-view-kemerovo-city-block.jpg",
    photoImage: "/pub-building-facade-harats-kemerovo.jpg",
    category: "Спорт",
    city: "Ковдор",
    votes: 112,
    likes: 46,
    isLiked: false,
    isVoted: false,
    createdAt: "2026-01-09",
  },
  {
    id: 13,
    title: "Безопасный пешеходный переход",
    address: "пр. Лесной, 40",
    description: "Не хватает зебры и освещения, а трафик интенсивный.",
    mapImage: "/aerial-view-street-intersection-kemerovo.jpg",
    photoImage: "/busy-street-without-crosswalk.jpg",
    category: "Дороги",
    city: "Кингисепп",
    votes: 93,
    likes: 39,
    isLiked: false,
    isVoted: false,
    createdAt: "2025-12-30",
  },
  {
    id: 14,
    title: "Ремонт тротуара",
    address: "ул. Гоголя, 15",
    description:
      "Плитка разбита, лужи и ямы. Нужен новый тротуар с пониженными бордюрами.",
    mapImage: "/aerial-view-of-city-block-kemerovo.jpg",
    photoImage: "/aerial-satellite-view-residential-kemerovo.jpg",
    category: "Дороги",
    city: "Березники",
    votes: 115,
    likes: 44,
    isLiked: false,
    isVoted: false,
    createdAt: "2026-01-03",
  },
  {
    id: 15,
    title: "Новые контейнеры для сортировки",
    address: "ул. Арбузова, 9",
    description: "Нужны контейнеры для бумаги и пластика во дворах.",
    mapImage: "/aerial-satellite-view-kemerovo-city-block.jpg",
    photoImage: "/building-entrance-with-awning-kemerovo.jpg",
    category: "Экология",
    city: "Абакан",
    votes: 102,
    likes: 32,
    isLiked: false,
    isVoted: false,
    createdAt: "2026-01-10",
  },
  {
    id: 16,
    title: "Новая детская площадка",
    address: "ул. Полевая, 8",
    description:
      "Старая площадка изношена. Нужно обновить оборудование и покрытие.",
    mapImage: "/aerial-view-of-city-block-kemerovo.jpg",
    photoImage: "/aerial-view-residential-area-kemerovo.jpg",
    category: "Детские площадки",
    city: "Черногорск",
    votes: 128,
    likes: 51,
    isLiked: false,
    isVoted: false,
    createdAt: "2026-01-11",
  },
  {
    id: 17,
    title: "Лыжная трасса в парке",
    address: "парк Южный",
    description: "Зимой хотим иметь освещенную трассу для лыжников и прогулок.",
    mapImage: "/aerial-satellite-view-residential-kemerovo.jpg",
    photoImage: "/aerial-view-residential-area-kemerovo.jpg",
    category: "Зимний отдых",
    city: "Рефтинский",
    votes: 91,
    likes: 27,
    isLiked: false,
    isVoted: false,
    createdAt: "2026-01-12",
  },
  {
    id: 18,
    title: "Новая навигация и указатели",
    address: "вокзальная площадь",
    description: "Нужны указатели к социальным объектам и нумерация домов.",
    mapImage: "/aerial-satellite-view-kemerovo-city-block.jpg",
    photoImage: "/pub-building-facade-harats-kemerovo.jpg",
    category: "Инфраструктура",
    city: "Чегдомын",
    votes: 73,
    likes: 21,
    isLiked: false,
    isVoted: false,
    createdAt: "2025-12-25",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

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

const sortOptions = [
  { id: "popular", label: "По голосам" },
  { id: "likes", label: "По лайкам" },
  { id: "newest", label: "Новые" },
] as const;

type CityFilter = "all" | (typeof availableCities)[number];
const normalizeKey = (value: string) => value.trim().toLowerCase();
const ALL_FILTER = "all";

export default function VotingPage() {
  const [ideas, setIdeas] = useState<IdeaCard[]>(mockIdeas);
  const [selectedCategory, setSelectedCategory] = useState(ALL_FILTER);
  const [selectedCity, setSelectedCity] = useState<CityFilter>(ALL_FILTER);
  const [sortBy, setSortBy] =
    useState<(typeof sortOptions)[number]["id"]>("popular");
  const { t } = useLanguage();

  const totalVotes = useMemo(
    () => ideas.reduce((sum, idea) => sum + idea.votes, 0),
    [ideas],
  );
  const totalLikes = useMemo(
    () => ideas.reduce((sum, idea) => sum + idea.likes, 0),
    [ideas],
  );

  const toggleLike = (id: number) => {
    setIdeas((current) =>
      current.map((idea) =>
        idea.id === id
          ? {
              ...idea,
              isLiked: !idea.isLiked,
              likes: idea.isLiked ? idea.likes - 1 : idea.likes + 1,
            }
          : idea,
      ),
    );
  };

  const handleVote = (id: number) => {
    setIdeas((current) =>
      current.map((idea) =>
        idea.id === id && !idea.isVoted
          ? { ...idea, isVoted: true, votes: idea.votes + 1 }
          : idea,
      ),
    );
  };

  const resetFilters = () => {
    setSelectedCategory(ALL_FILTER);
    setSelectedCity(ALL_FILTER);
  };

  const hasFilters =
    selectedCategory !== ALL_FILTER || selectedCity !== ALL_FILTER;

  const categories = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    ideas.forEach((idea) => {
      const key = normalizeKey(idea.category);
      const entry = counts.get(key);
      if (entry) {
        entry.count += 1;
      } else {
        counts.set(key, { label: idea.category, count: 1 });
      }
    });
    return [
      {
        id: "all",
        label: "Все категории",
        count: ideas.length,
      },
      ...Array.from(counts.entries()).map(([id, data]) => ({
        id,
        label: data.label,
        count: data.count,
      })),
    ];
  }, [ideas]);

  const cityOptions = [
    { id: "all", label: "Все города" },
    ...availableCities.map((city) => ({ id: city, label: city })),
  ];

  const selectedCategoryLabel = useMemo(() => {
    return (
      categories.find((category) => category.id === selectedCategory)?.label ??
      "Все категории"
    );
  }, [categories, selectedCategory]);

  const selectedCityLabel = useMemo(() => {
    return selectedCity === ALL_FILTER ? "Все города" : selectedCity;
  }, [selectedCity]);

  const visibleIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      const categoryOk =
        selectedCategory === ALL_FILTER ||
        normalizeKey(idea.category) === selectedCategory;
      const cityOk = selectedCity === ALL_FILTER || idea.city === selectedCity;
      return categoryOk && cityOk;
    });
  }, [ideas, selectedCategory, selectedCity]);

  const sortedIdeas = useMemo(() => {
    const data = [...visibleIdeas];
    switch (sortBy) {
      case "likes":
        return data.sort((a, b) => b.likes - a.likes);
      case "newest":
        return data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      case "popular":
      default:
        return data.sort((a, b) => b.votes - a.votes);
    }
  }, [sortBy, visibleIdeas]);

  const maxVotes = useMemo(() => {
    return Math.max(...visibleIdeas.map((idea) => idea.votes), 0);
  }, [visibleIdeas]);

  const renderSidebarContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Фильтры
        </p>
        {hasFilters ? (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Сбросить
          </button>
        ) : null}
      </div>

      <div className="rounded-[2rem] border border-border/60 bg-card/90 p-5 shadow-[0_18px_40px_-32px_rgba(0,0,0,0.55)]">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Категории
        </p>
        <div className="mt-4 space-y-2">
          {categories.map((category) => {
            const isActive = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? "border-foreground bg-foreground text-background shadow-lg shadow-foreground/25"
                    : "border-border/60 bg-background/70 text-foreground hover:border-foreground/40 hover:bg-foreground hover:text-background"
                }`}
              >
                <span className="truncate">{category.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    isActive
                      ? "bg-background/20 text-background"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {category.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[2rem] border border-border/60 bg-card/90 p-5 shadow-[0_18px_40px_-32px_rgba(0,0,0,0.55)]">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Селектор города
        </p>
        <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Город
        </label>
        <div className="relative mt-3">
          <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={selectedCity}
            onChange={(event) =>
              setSelectedCity(event.target.value as CityFilter)
            }
            className="w-full appearance-none rounded-2xl border border-border/60 bg-background px-10 py-3 text-sm font-semibold text-foreground shadow-sm transition focus:outline-none focus:ring-2 focus:ring-foreground/20"
          >
            {cityOptions.map((city) => (
              <option key={city.id} value={city.id}>
                {city.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-background">
      <Header />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 right-[-10%] h-72 w-72 rounded-full bg-foreground/5 blur-3xl" />
        <div className="absolute top-40 left-[-8%] h-64 w-64 rounded-full bg-foreground/10 blur-3xl" />
        <div className="absolute bottom-0 right-8 h-72 w-72 rounded-full bg-foreground/5 blur-3xl" />
      </div>

      <main className="relative pt-24 pb-16 px-4 sm:pt-28 sm:pb-20 sm:px-6">
        <div className="relative">
          <motion.aside
            className="hidden lg:flex lg:fixed lg:left-6 lg:top-28 lg:h-[calc(100vh-7rem)] lg:w-[280px] lg:flex-col lg:gap-6 lg:overflow-y-auto lg:rounded-3xl lg:border lg:border-border/70 lg:bg-background/90 lg:p-5 lg:shadow-[0_16px_40px_-30px_rgba(0,0,0,0.6)] lg:backdrop-blur"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {renderSidebarContent()}
          </motion.aside>

          <div className="lg:pl-[320px]">
            <div className="container mx-auto max-w-6xl">
              <motion.div
                className="flex flex-col gap-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                    Открытое голосование
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    Показано {sortedIdeas.length} идей
                  </span>
                </div>

                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-3xl space-y-3">
                    <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
                      {t("voting")}
                    </h1>
                    <p className="text-sm text-muted-foreground sm:text-base">
                      Выбирай идеи для своего города и голосуй за лучшие.
                    </p>
                  </div>

                  <div className="grid w-full max-w-md grid-cols-1 gap-3 sm:max-w-none sm:grid-cols-3">
                    <div className="rounded-2xl border border-border/60 bg-card/80 p-3 text-center shadow-[0_16px_36px_-28px_rgba(0,0,0,0.5)]">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        Идей
                      </p>
                      <p className="text-2xl font-semibold">{ideas.length}</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-card/80 p-3 text-center shadow-[0_16px_36px_-28px_rgba(0,0,0,0.5)]">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        Голосов
                      </p>
                      <p className="text-2xl font-semibold">{totalVotes}</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-card/80 p-3 text-center shadow-[0_16px_36px_-28px_rgba(0,0,0,0.5)]">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        Лайков
                      </p>
                      <p className="text-2xl font-semibold">{totalLikes}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <div className="mt-10 flex flex-col gap-8">
                <motion.aside
                  className="space-y-6 lg:hidden"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {renderSidebarContent()}
                </motion.aside>

                <section className="space-y-6">
                  <motion.div
                    className="rounded-[2rem] border border-border/60 bg-card/90 px-5 py-4 shadow-[0_18px_40px_-32px_rgba(0,0,0,0.55)]"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-background">
                          <ListFilter className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                            Сортировка
                          </p>
                          <p className="text-sm font-semibold">
                            Выбери режим показа идей
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 rounded-full bg-background/70 p-1">
                        {sortOptions.map((option) => {
                          const isActive = sortBy === option.id;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setSortBy(option.id)}
                              className={`rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-300 ${
                                isActive
                                  ? "border-foreground bg-foreground text-background shadow-lg shadow-foreground/20"
                                  : "border-border/70 bg-background/70 text-foreground hover:bg-foreground hover:text-background"
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-muted/70 px-3 py-1 font-semibold text-muted-foreground">
                        Показано {sortedIdeas.length} идей
                      </span>
                      <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 font-semibold text-muted-foreground">
                        {selectedCategoryLabel}
                      </span>
                      <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 font-semibold text-muted-foreground">
                        {selectedCityLabel}
                      </span>
                    </div>
                  </motion.div>

                  <motion.div
                    key={`${selectedCategory}-${selectedCity}-${sortBy}`}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-6"
                  >
                    <AnimatePresence mode="popLayout">
                      {sortedIdeas.length ? (
                        sortedIdeas.map((idea) => {
                          const voteShare = maxVotes
                            ? Math.round((idea.votes / maxVotes) * 100)
                            : 0;
                          return (
                            <motion.article
                              key={idea.id}
                              variants={cardVariants}
                              layout
                              className="group relative overflow-hidden rounded-[2.5rem] border border-border/60 bg-card/90 p-6 shadow-[0_20px_50px_-34px_rgba(0,0,0,0.5)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_28px_60px_-36px_rgba(0,0,0,0.6)]"
                            >
                              <span className="absolute left-0 top-0 h-full w-1.5 bg-foreground/20" />
                              <div className="relative flex flex-col gap-6 xl:flex-row">
                                <div className="flex-1 space-y-4">
                                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                                    <span className="rounded-full bg-foreground/10 px-3 py-1 text-foreground">
                                      {idea.category}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1 text-muted-foreground">
                                      <MapPin className="h-3.5 w-3.5" />
                                      {idea.city}
                                    </span>
                                  </div>
                                  <div>
                                    <h3 className="text-xl font-bold sm:text-2xl">
                                      {idea.title}
                                    </h3>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                      {idea.address}
                                    </p>
                                  </div>
                                  <p className="text-sm text-foreground/90">
                                    {idea.description}
                                  </p>

                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                      <span>{idea.votes} голосов</span>
                                      <span>{voteShare}%</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-muted/60">
                                      <div
                                        className="h-full rounded-full bg-foreground"
                                        style={{ width: `${voteShare}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:w-64">
                                  <motion.div
                                    className="relative h-28 overflow-hidden rounded-2xl border border-border/60 shadow-md sm:h-32"
                                    whileHover={{ scale: 1.03 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <img
                                      src={idea.mapImage || "/placeholder.svg"}
                                      alt={`Карта - ${idea.title}`}
                                      className="h-full w-full object-cover"
                                    />
                                    <span className="absolute bottom-2 left-2 rounded-full bg-background/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                      Карта
                                    </span>
                                    <div className="absolute bottom-3 right-3 h-3 w-3 rounded-full bg-foreground ring-2 ring-background shadow-lg" />
                                  </motion.div>
                                  <motion.div
                                    className="relative h-28 overflow-hidden rounded-2xl border border-border/60 shadow-md sm:h-32"
                                    whileHover={{ scale: 1.03 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <img
                                      src={
                                        idea.photoImage || "/placeholder.svg"
                                      }
                                      alt={`Фото - ${idea.title}`}
                                      className="h-full w-full object-cover"
                                    />
                                    <span className="absolute bottom-2 left-2 rounded-full bg-background/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                      Фото
                                    </span>
                                  </motion.div>
                                </div>
                              </div>

                              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-4">
                                <motion.button
                                  onClick={() => toggleLike(idea.id)}
                                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-300 ${
                                    idea.isLiked
                                      ? "border-foreground bg-foreground text-background"
                                      : "border-border/70 bg-background/70 text-muted-foreground hover:border-foreground hover:text-foreground"
                                  }`}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Heart
                                    className={`h-4 w-4 ${
                                      idea.isLiked ? "fill-current" : ""
                                    }`}
                                  />
                                  <span>{idea.likes}</span>
                                </motion.button>

                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-semibold text-muted-foreground">
                                    {idea.votes} голосов
                                  </span>
                                  <GradientButton
                                    className="px-5 py-2 text-xs sm:px-6 sm:py-3 sm:text-sm"
                                    onClick={() => handleVote(idea.id)}
                                    disabled={idea.isVoted}
                                  >
                                    {idea.isVoted ? "Голос учтен" : t("vote")}
                                  </GradientButton>
                                </div>
                              </div>
                            </motion.article>
                          );
                        })
                      ) : (
                        <motion.div
                          key="empty"
                          variants={cardVariants}
                          className="rounded-[2rem] border border-dashed border-border/70 bg-card/60 p-6 text-sm text-muted-foreground"
                        >
                          Идеи по этим фильтрам пока не найдены.
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
