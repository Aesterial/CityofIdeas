export type SubmissionStatus = "approved" | "declined" | "pending";

export type Submission = {
  id: string;
  title: string;
  status: SubmissionStatus;
  declineReason?: string;
  authorName: string;
  submittedAt: string;
  location: string;
  city: string;
  source: string;
  category: string;
  summary: string;
  description: string;
  coverImage: string;
  images: string[];
};

export const statusMeta: Record<
  SubmissionStatus,
  { labelKey: string; descriptionKey: string }
> = {
  approved: {
    labelKey: "statusApproved",
    descriptionKey: "adminStatusApprovedDesc",
  },
  pending: {
    labelKey: "statusPending",
    descriptionKey: "adminStatusPendingDesc",
  },
  declined: {
    labelKey: "statusDeclined",
    descriptionKey: "adminStatusDeclinedDesc",
  },
};

export const submissions: Submission[] = [
  {
    id: "sub-1001",
    title: "Безопасный переход на проспекте Ленина",
    status: "pending",
    authorName: "Анна Петрова",
    submittedAt: "12 декабря 2025, 11:24",
    location: "пр. Ленина, 14",
    city: "Кемерово",
    source: "Мобильное приложение",
    category: "Дороги и пешеходы",
    summary: "Жители просят обустроить переход на оживленном участке.",
    description:
      "Сейчас дети переходят дорогу через поток машин без разметки и знаков. Нужны зебра, освещение и понижение бордюров.",
    coverImage: "/busy-street-without-crosswalk.jpg",
    images: [
      "/busy-street-without-crosswalk.jpg",
      "/aerial-view-street-intersection-kemerovo.jpg",
    ],
  },
  {
    id: "sub-1002",
    title: "Освещение двора на Советской",
    status: "pending",
    authorName: "Мария Иванова",
    submittedAt: "10 декабря 2025, 16:40",
    location: "ул. Советская, 77",
    city: "Кемерово",
    source: "Веб-форма",
    category: "Освещение",
    summary: "Во дворе темно, вечером небезопасно.",
    description:
      "Просим установить 3–4 фонаря у подъездов и на детской площадке. Сейчас освещения нет совсем.",
    coverImage: "/aerial-view-of-city-block-kemerovo.jpg",
    images: [
      "/aerial-view-of-city-block-kemerovo.jpg",
      "/building-entrance-with-awning-kemerovo.jpg",
    ],
  },
  {
    id: "sub-1003",
    title: "Детская площадка на Набережной",
    status: "approved",
    authorName: "Дмитрий Соколов",
    submittedAt: "5 декабря 2025, 09:15",
    location: "ул. Набережная, 3",
    city: "Кемерово",
    source: "Мобильное приложение",
    category: "Детские площадки",
    summary: "Нужна новая площадка и безопасное покрытие.",
    description:
      "Предлагаем заменить старые конструкции и добавить мягкое покрытие. Это снизит травмоопасность.",
    coverImage: "/aerial-view-residential-area-kemerovo.jpg",
    images: [
      "/aerial-view-residential-area-kemerovo.jpg",
      "/aerial-satellite-view-kemerovo-city-block.jpg",
    ],
  },
  {
    id: "sub-1004",
    title: "Ремонт остановки на Шахтеров",
    status: "approved",
    authorName: "Ирина Смирнова",
    submittedAt: "1 декабря 2025, 14:02",
    location: "ул. Шахтеров, 22",
    city: "Кемерово",
    source: "Веб-форма",
    category: "Транспорт",
    summary: "Остановка требует ремонта и защиты от осадков.",
    description:
      "Просим заменить стекла, обновить скамейки и установить навес. Сейчас людям негде укрыться от дождя.",
    coverImage: "/building-entrance-with-awning-kemerovo.jpg",
    images: [
      "/building-entrance-with-awning-kemerovo.jpg",
      "/building-facade-with-broken-window.jpg",
    ],
  },
  {
    id: "sub-1005",
    title: "Парковка у рынка",
    status: "declined",
    declineReason: "Предложение не соответствует генплану.",
    authorName: "Сергей Морозов",
    submittedAt: "28 ноября 2025, 18:30",
    location: "ул. Розы Люксембург, 5",
    city: "Кемерово",
    source: "Мобильное приложение",
    category: "Транспорт",
    summary: "Предлагается расширить парковку рядом с рынком.",
    description:
      "Участок попадает в зеленую зону и не подходит для строительства. Предложение не соответствует генплану.",
    coverImage: "/aerial-satellite-view-residential-kemerovo.jpg",
    images: [
      "/aerial-satellite-view-residential-kemerovo.jpg",
      "/aerial-view-of-city-block-kemerovo.jpg",
    ],
  },
  {
    id: "sub-1006",
    title: 'Киоск на остановке "Центр"',
    status: "declined",
    declineReason: "Локация относится к зоне без торговли.",
    authorName: "Елена Лебедева",
    submittedAt: "25 ноября 2025, 12:05",
    location: "ул. Терешковой, 41",
    city: "Кемерово",
    source: "Веб-форма",
    category: "Городская среда",
    summary: "Предлагается установить киоск с прессой.",
    description:
      "Место относится к зоне без торговли, установка не согласована. Рекомендуем выбрать другую площадку.",
    coverImage: "/pub-building-facade-harats-kemerovo.jpg",
    images: [
      "/pub-building-facade-harats-kemerovo.jpg",
      "/aerial-view-residential-area-kemerovo.jpg",
    ],
  },
];
