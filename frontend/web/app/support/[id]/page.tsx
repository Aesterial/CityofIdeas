"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Lock,
  MessageSquare,
  Send,
  ShieldCheck,
  UserCircle2,
} from "lucide-react"
import { Header } from "@/components/header"
import { useAuth } from "@/components/auth-provider"
import { useLanguage } from "@/components/language-provider"
import {
  closeTicket,
  createTicketMessage,
  fetchTicketInfo,
  fetchTicketMessages,
} from "@/lib/api"
import {
  mapTicket,
  mapTicketMessages,
  type Ticket,
  type TicketMessage,
  type TicketStatus,
} from "@/lib/tickets"
import { cn } from "@/lib/utils"

const statusLabel: Record<TicketStatus, string> = {
  new: "Ожидает",
  in_progress: "В работе",
  closed: "Закрыто",
}

const statusStyles: Record<TicketStatus, string> = {
  new: "bg-foreground/5 text-foreground",
  in_progress: "bg-foreground text-background",
  closed: "border border-foreground/15 text-muted-foreground",
}

const resolveLocale = (language: string) =>
  language === "KZ" ? "kk-KZ" : language === "RU" ? "ru-RU" : "en-US"

const formatDateTime = (value: string | undefined, formatter: Intl.DateTimeFormat) => {
  if (!value) {
    return "-"
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "-"
  }
  return formatter.format(date)
}

const formatTime = (value: string | undefined, formatter: Intl.DateTimeFormat) => {
  if (!value) {
    return ""
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }
  return formatter.format(date)
}

export default function SupportTicketPage() {
  const params = useParams<{ id: string }>()
  const { user } = useAuth()
  const { language } = useLanguage()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [closing, setClosing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messageText, setMessageText] = useState("")

  const ticketId = Array.isArray(params?.id) ? params.id[0] : params?.id

  const locale = useMemo(() => resolveLocale(language), [language])
  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [locale],
  )
  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [locale],
  )

  const loadTicket = useCallback(
    async (signal?: AbortSignal) => {
      if (!ticketId) {
        return
      }
      setLoading(true)
      setError(null)
      try {
        const [info, list] = await Promise.all([
          fetchTicketInfo(ticketId, { signal }),
          fetchTicketMessages(ticketId, { signal }),
        ])
        if (signal?.aborted) {
          return
        }
        const mapped = info ? mapTicket(info) : null
        setTicket(mapped)
        setMessages(mapTicketMessages(list))
        if (!mapped) {
          setError("Обращение не найдено.")
        }
      } catch (err) {
        if (!signal?.aborted) {
          setError("Не удалось загрузить обращение.")
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false)
        }
      }
    },
    [ticketId],
  )

  useEffect(() => {
    const controller = new AbortController()
    void loadTicket(controller.signal)
    return () => controller.abort()
  }, [loadTicket])

  const handleSend = async () => {
    if (!ticketId || sending || ticket?.status === "closed") {
      return
    }
    const trimmed = messageText.trim()
    if (!trimmed) {
      return
    }
    setSending(true)
    setError(null)
    try {
      await createTicketMessage(ticketId, trimmed)
      setMessageText("")
      await loadTicket()
    } catch (err) {
      setError("Не удалось отправить сообщение.")
    } finally {
      setSending(false)
    }
  }

  const handleClose = async () => {
    if (!ticketId || closing || ticket?.status === "closed") {
      return
    }
    setClosing(true)
    setError(null)
    try {
      await closeTicket(ticketId)
      await loadTicket()
    } catch (err) {
      setError("Не удалось закрыть обращение.")
    } finally {
      setClosing(false)
    }
  }

  const status = ticket?.status ?? "new"
  const isClosed = status === "closed"

  const resolveAuthorName = (message: TicketMessage) => {
    if (message.authorName) {
      return message.authorName
    }
    if (message.isStaff) {
      return "Поддержка"
    }
    return "Пользователь"
  }

  const currentUserId = user?.uid

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-12 px-4 sm:pt-28 sm:pb-16 sm:px-6">
        <div className="container mx-auto max-w-6xl space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-3"
          >
            <Link
              href="/support"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад к форме
            </Link>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Обращение #{ticket?.id ?? ticketId}
                </p>
                <h1 className="text-2xl font-bold sm:text-3xl">
                  {ticket?.subject || "Без темы"}
                </h1>
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  statusStyles[status],
                )}
              >
                {statusLabel[status]}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Если в обращении не будет новых сообщений в течение 48 часов, оно закроется автоматически.
            </p>
          </motion.div>

          {loading ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
              <div className="h-64 rounded-3xl bg-muted/60 animate-pulse" />
              <div className="h-64 rounded-3xl bg-muted/60 animate-pulse" />
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="rounded-3xl border border-border/70 bg-card/90 p-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    Данные обращения
                  </div>
                  <div className="grid gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Контакт:</span>
                      <span className="font-semibold">
                        {ticket?.requester?.name || user?.displayName || user?.username || "-"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-semibold">
                        {ticket?.requester?.email || user?.email || "-"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Создано:</span>
                      <span className="font-semibold">
                        {formatDateTime(ticket?.createdAt, dateTimeFormatter)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Последнее обновление:</span>
                      <span className="font-semibold">
                        {formatDateTime(ticket?.updatedAt || ticket?.lastMessageAt, dateTimeFormatter)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Категория:</span>
                      <span className="font-semibold">{ticket?.category || "-"}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm">
                    {ticket?.assignee?.name ? (
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          Обращение в работе
                        </p>
                        <p className="font-semibold">{ticket.assignee.name}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        Обращение в очереди. Специалист подключится в ближайшее время.
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={closing || isClosed}
                    className="inline-flex items-center justify-center rounded-full border border-border/70 px-4 py-2 text-sm font-semibold transition-all duration-300 hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isClosed ? "Обращение закрыто" : closing ? "Закрываем..." : "Закрыть обращение"}
                  </button>
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="rounded-3xl border border-border/70 bg-card/90 p-6"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Сообщения</p>
                  <span className="text-xs text-muted-foreground">
                    {messages.length} шт.
                  </span>
                </div>

                {error ? (
                  <p className="mt-4 rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm">
                    {error}
                  </p>
                ) : null}

                <div className="mt-4 max-h-[360px] space-y-4 overflow-y-auto pr-2">
                  {messages.length ? (
                    messages.map((message) => {
                      const isMine =
                        currentUserId != null && message.authorId != null
                          ? String(currentUserId) === String(message.authorId)
                          : false
                      const bubbleClass = isMine
                        ? "bg-foreground text-background ml-auto"
                        : message.isStaff
                          ? "border border-foreground/15 bg-background"
                          : "bg-muted/80"

                      return (
                        <div
                          key={message.id}
                          className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm", bubbleClass)}
                        >
                          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                            <span>{resolveAuthorName(message)}</span>
                            <span>{formatTime(message.createdAt, timeFormatter)}</span>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm">
                            {message.message}
                          </p>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">Сообщений пока нет.</p>
                  )}
                </div>

                <div className="mt-5 space-y-3">
                  <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Новое сообщение
                  </label>
                  <textarea
                    rows={3}
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    placeholder={isClosed ? "Обращение закрыто" : "Напишите уточнение или ответ"}
                    disabled={isClosed}
                    className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sending || isClosed || !messageText.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/30 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                    {sending ? "Отправляем..." : "Отправить"}
                  </button>
                </div>
              </motion.section>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
