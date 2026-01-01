"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  CalendarDays,
  Lock,
  Mail,
  MessageSquare,
  ShieldAlert,
  UserCheck,
  UserCircle2,
} from "lucide-react"
import { Header } from "@/components/header"
import { useAuth } from "@/components/auth-provider"

type SupportTicketStatus = "new" | "in_progress"

type AssignedInfo = {
  name: string
  rank: string
}

type SupportTicket = {
  id: string
  subject: string
  message: string
  createdAt: string
  category: string
  requesterName: string
  requesterEmail: string
  status: SupportTicketStatus
  assignedTo?: AssignedInfo
}

const statusLabel: Record<SupportTicketStatus, string> = {
  new: "Новая",
  in_progress: "В обработке",
}

const statusStyles: Record<SupportTicketStatus, string> = {
  new: "bg-amber-500/10 text-amber-700",
  in_progress: "bg-blue-500/10 text-blue-700",
}

const initialTickets: SupportTicket[] = [
  {
    id: "REQ-410",
    subject: "Не приходит письмо для входа",
    message: "Пытаюсь войти, письмо не приходит уже 10 минут. Проверила папку спам.",
    createdAt: "Сегодня, 10:12",
    category: "Аккаунт и доступ",
    requesterName: "Полина Серова",
    requesterEmail: "polina.serova@mail.ru",
    status: "new",
  },
  {
    id: "REQ-411",
    subject: "Ошибка при загрузке фото",
    message: "При загрузке фото для проекта появляется ошибка 500. Файлы jpg до 4 МБ.",
    createdAt: "Сегодня, 09:38",
    category: "Техническая проблема",
    requesterName: "Алексей Маркин",
    requesterEmail: "a.markin@mail.ru",
    status: "in_progress",
    assignedTo: { name: "Марина К.", rank: "moderator" },
  },
  {
    id: "REQ-412",
    subject: "Нужно исправить адрес проекта",
    message: "Указал неправильный адрес, можно изменить после отправки?",
    createdAt: "Вчера, 19:54",
    category: "Проект или заявка",
    requesterName: "Игорь Комаров",
    requesterEmail: "komarov.igor@mail.ru",
    status: "new",
  },
  {
    id: "REQ-413",
    subject: "Не работает карта",
    message: "Карта не загружается на странице предложения, остается серый экран.",
    createdAt: "Вчера, 17:02",
    category: "Техническая проблема",
    requesterName: "Дарья Усова",
    requesterEmail: "d.usova@mail.ru",
    status: "in_progress",
    assignedTo: { name: "Сергей Орлов", rank: "developer" },
  },
  {
    id: "REQ-414",
    subject: "Вопрос по модерации",
    message: "Через сколько обычно проверяют заявки и где посмотреть статус?",
    createdAt: "Вчера, 14:28",
    category: "Проект или заявка",
    requesterName: "Никита Павлов",
    requesterEmail: "npavlov@mail.ru",
    status: "new",
  },
]

export default function SupportQueuePage() {
  const { user, status } = useAuth()
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const currentName = user?.displayName || user?.username || "Пользователь"
  const currentRank = user?.rank?.name ?? "guest"
  const canManageSupport = ["developer", "staff", "moderator"].includes(currentRank)
  const isStaff = currentRank === "staff"

  const canOpenTicket = useMemo(() => {
    return (ticket: SupportTicket) => {
      if (!ticket.assignedTo) {
        return true
      }
      if (ticket.assignedTo.name === currentName) {
        return true
      }
      if (isStaff) {
        return true
      }
      return ticket.assignedTo.rank !== currentRank
    }
  }, [currentName, currentRank, isStaff])

  const firstAvailableId = useMemo(
    () => tickets.find((ticket) => canOpenTicket(ticket))?.id ?? null,
    [tickets, canOpenTicket],
  )

  useEffect(() => {
    if (!selectedId) {
      setSelectedId(firstAvailableId)
      return
    }
    const selectedTicket = tickets.find((ticket) => ticket.id === selectedId)
    if (!selectedTicket || !canOpenTicket(selectedTicket)) {
      setSelectedId(firstAvailableId)
    }
  }, [selectedId, tickets, canOpenTicket, firstAvailableId])

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedId) ?? null

  const handleSelect = (ticket: SupportTicket) => {
    if (!canOpenTicket(ticket)) {
      setNotice(`Заявка уже в обработке у ${ticket.assignedTo?.name}.`)
      return
    }
    setNotice(null)
    setSelectedId(ticket.id)
  }

  const handleAssign = (ticket: SupportTicket) => {
    if (!user) {
      return
    }
    setTickets((prev) =>
      prev.map((item) =>
        item.id === ticket.id
          ? {
              ...item,
              status: "in_progress",
              assignedTo: { name: currentName, rank: currentRank },
            }
          : item,
      ),
    )
    setNotice(null)
    setSelectedId(ticket.id)
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 px-4 sm:pt-28 sm:px-6">
          <div className="container mx-auto max-w-5xl">
            <div className="h-28 rounded-3xl bg-muted/70 animate-pulse" />
          </div>
        </main>
      </div>
    )
  }

  if (!canManageSupport) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12 px-4 sm:pt-28 sm:px-6">
          <div className="container mx-auto max-w-3xl space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-foreground/10">
              <ShieldAlert className="h-6 w-6 text-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Доступ ограничен</h1>
            <p className="text-sm text-muted-foreground">
              Очередь поддержки доступна только администраторам и модераторам.
            </p>
            <Link
              href="/support"
              className="inline-flex rounded-full border border-border/70 px-5 py-2 text-sm font-semibold transition-all duration-300 hover:bg-foreground hover:text-background"
            >
              Вернуться к поддержке
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-12 px-4 sm:pt-28 sm:pb-16 sm:px-6">
        <div className="container mx-auto max-w-6xl space-y-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Поддержка</p>
                <h1 className="text-2xl font-bold sm:text-3xl">Очередь заявок</h1>
              </div>
              <div className="rounded-full border border-border/70 px-4 py-2 text-sm font-semibold">
                Всего: {tickets.length}
              </div>
            </div>
            {notice ? (
              <p className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm">
                {notice}
              </p>
            ) : null}
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <motion.section
              className="rounded-3xl border border-border/70 bg-card/90 p-5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              <div className="space-y-4">
                {tickets.map((ticket) => {
                  const locked = !canOpenTicket(ticket)
                  return (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => handleSelect(ticket)}
                      className={`w-full rounded-3xl border border-border/60 bg-background/70 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/30 ${
                        selectedId === ticket.id ? "ring-2 ring-foreground/15 border-foreground/40" : ""
                      } ${locked ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{ticket.category}</p>
                          <p className="mt-2 text-base font-semibold">{ticket.subject}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {ticket.requesterName} · {ticket.createdAt}
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[ticket.status]}`}>
                          {statusLabel[ticket.status]}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        {ticket.assignedTo ? (
                          <span className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4" />
                            В обработке: {ticket.assignedTo.name}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Свободно для взятия
                          </span>
                        )}
                        {locked ? (
                          <span className="flex items-center gap-1 text-rose-600">
                            <Lock className="h-4 w-4" />
                            Недоступно
                          </span>
                        ) : null}
                      </div>
                    </button>
                  )
                })}
              </div>
            </motion.section>

            <motion.aside
              className="rounded-3xl border border-border/70 bg-card/90 p-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {selectedTicket ? (
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      <span>{selectedTicket.category}</span>
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${statusStyles[selectedTicket.status]}`}>
                        {statusLabel[selectedTicket.status]}
                      </span>
                    </div>
                    <h2 className="mt-2 text-xl font-semibold">{selectedTicket.subject}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{selectedTicket.message}</p>
                  </div>

                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">От:</span>
                      <span className="font-semibold">{selectedTicket.requesterName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-semibold">{selectedTicket.requesterEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Создана:</span>
                      <span className="font-semibold">{selectedTicket.createdAt}</span>
                    </div>
                  </div>

                  {selectedTicket.assignedTo ? (
                    <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-xs text-muted-foreground">
                      В обработке:{" "}
                      <span className="font-semibold text-foreground">{selectedTicket.assignedTo.name}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAssign(selectedTicket)}
                      className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/30"
                    >
                      Взять в работу
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Выберите заявку слева, чтобы увидеть детали.</p>
              )}
            </motion.aside>
          </div>
        </div>
      </main>
    </div>
  )
}
