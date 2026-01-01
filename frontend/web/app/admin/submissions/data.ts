export type SubmissionStatus = "approved" | "declined" | "pending"

export type Submission = {
  id: string
  title: string
  status: SubmissionStatus
  authorName: string
  submittedAt: string
  location: string
  city: string
  source: string
  category: string
  summary: string
  description: string
  coverImage: string
  images: string[]
}

export const statusMeta: Record<SubmissionStatus, { label: string; description: string }> = {
  approved: {
    label: "Одобренные",
    description: "Проекты, которые уже прошли модерацию и готовы к публикации.",
  },
  pending: {
    label: "Ожидающие",
    description: "Заявки, которым нужно внимание модератора и решение.",
  },
  declined: {
    label: "Отклонённые",
    description: "Проекты, которые были отклонены после проверки.",
  },
}

export const submissions: Submission[] = [
  {
    id: "sub-1001",
    title: "Светофор у гимназии №12",
    status: "pending",
    authorName: "Иван Петров",
    submittedAt: "12 декабря 2025, 11:24",
    location: "ул. Ленина, 14",
    city: "Кемерово",
    source: "Мобильное приложение",
    category: "Дороги и переходы",
    summary: "Жители просят установить дополнительный светофор возле гимназии для безопасного перехода.",
    description:
      "После открытия новых жилых комплексов поток машин вырос. Дети переходят дорогу через нерегулируемый переход, особенно опасно в утренние часы. Просим установить светофор с кнопкой и подсветкой.",
    coverImage: "/busy-street-without-crosswalk.jpg",
    images: ["/busy-street-without-crosswalk.jpg", "/aerial-view-street-intersection-kemerovo.jpg"],
  },
  {
    id: "sub-1002",
    title: "Площадка во дворе на Советском",
    status: "pending",
    authorName: "Мария Иванова",
    submittedAt: "10 декабря 2025, 16:40",
    location: "Советский проспект, 77",
    city: "Кемерово",
    source: "Веб-форма",
    category: "Дворы и благоустройство",
    summary: "Нужно обновить покрытие и добавить освещение на детской площадке.",
    description:
      "Покрытие стерлось, торчат арматуры. Вечером нет света, дети играют в темноте. Предлагаем заменить покрытие на безопасное и добавить два фонаря.",
    coverImage: "/aerial-view-of-city-block-kemerovo.jpg",
    images: ["/aerial-view-of-city-block-kemerovo.jpg", "/building-entrance-with-awning-kemerovo.jpg"],
  },
  {
    id: "sub-1003",
    title: "Освещение на набережной",
    status: "approved",
    authorName: "Дмитрий Орлов",
    submittedAt: "5 декабря 2025, 09:15",
    location: "ул. Набережная, 3",
    city: "Кемерово",
    source: "Мобильное приложение",
    category: "Освещение",
    summary: "Заявка на установку опор освещения вдоль прогулочного маршрута.",
    description:
      "На участке от моста до спортивной площадки темно. Предлагаем установить 12 опор с энергоэффективными светильниками, чтобы повысить безопасность.",
    coverImage: "/aerial-view-residential-area-kemerovo.jpg",
    images: ["/aerial-view-residential-area-kemerovo.jpg", "/aerial-satellite-view-kemerovo-city-block.jpg"],
  },
  {
    id: "sub-1004",
    title: "Ремонт входной группы",
    status: "approved",
    authorName: "Анна Смирнова",
    submittedAt: "1 декабря 2025, 14:02",
    location: "ул. Весенняя, 22",
    city: "Кемерово",
    source: "Веб-форма",
    category: "ЖКХ",
    summary: "Нужно обновить козырек и ступени у подъезда после повреждений.",
    description:
      "Козырек над подъездом поврежден, ступени скользкие. Предлагаем заменить покрытие и установить поручни, чтобы снизить риск травм.",
    coverImage: "/building-entrance-with-awning-kemerovo.jpg",
    images: ["/building-entrance-with-awning-kemerovo.jpg", "/building-facade-with-broken-window.jpg"],
  },
  {
    id: "sub-1005",
    title: "Парковка у рынка",
    status: "declined",
    authorName: "Сергей Морозов",
    submittedAt: "28 ноября 2025, 18:30",
    location: "ул. Кузнецкая, 5",
    city: "Кемерово",
    source: "Мобильное приложение",
    category: "Транспорт",
    summary: "Предложение расширить парковку, заняв часть зеленой зоны.",
    description:
      "Просьба увеличить парковочные места для клиентов рынка, разместив их на месте газона. Решение ухудшает благоустройство и противоречит регламенту.",
    coverImage: "/aerial-satellite-view-residential-kemerovo.jpg",
    images: ["/aerial-satellite-view-residential-kemerovo.jpg", "/aerial-view-of-city-block-kemerovo.jpg"],
  },
  {
    id: "sub-1006",
    title: "Демонтаж киоска у остановки",
    status: "declined",
    authorName: "Елена Лебедева",
    submittedAt: "25 ноября 2025, 12:05",
    location: "ул. Терешковой, 41",
    city: "Кемерово",
    source: "Веб-форма",
    category: "Городская среда",
    summary: "Предложение убрать киоск, который арендуется на законных основаниях.",
    description:
      "Киоск оформлен по договору аренды, срок которого еще не истек. Для демонтажа нужны другие основания, поэтому заявку отклонили.",
    coverImage: "/pub-building-facade-harats-kemerovo.jpg",
    images: ["/pub-building-facade-harats-kemerovo.jpg", "/aerial-view-residential-area-kemerovo.jpg"],
  },
]
