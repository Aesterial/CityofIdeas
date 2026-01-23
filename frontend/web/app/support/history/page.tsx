"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, CalendarDays, MessageSquare } from "lucide-react"
import { Header } from "@/components/header"
import { useAuth } from "@/components/auth-provider"
import { useLanguage } from "@/components/language-provider"
import { fetchTickets } from "@/lib/api"
import { mapTicket, type Ticket, type TicketStatus } from "@/lib/tickets"
import { cn } from "@/lib/utils"

const statusLabel: Record<TicketStatus, string> = {
  new: "Waiting",
  in_progress: "In progress",
  closed: "Closed",
}

const statusStyles: Record<TicketStatus, string> = {
  new: "bg-foreground/5 text-foreground",
  in_progress: "bg-foreground text-background",
  closed: "border border-foreground/15 text-muted-foreground",
}

const resolveLocale = (language: string) =>
  language === "KZ" ? "kk-KZ" : language === "RU" ? "ru-RU" : "en-US"

const formatDateTime = (
  value: string | undefined,
  formatter: Intl.DateTimeFormat,
) => {
  if (!value) {
    return "-"
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "-"
  }
  return formatter.format(date)
}

export default function SupportHistoryPage() {
  const { status } = useAuth()
  const { language } = useLanguage()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const loadTickets = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const list = await fetchTickets({ signal })
      if (signal?.aborted) {
        return
      }
      const mapped = list
        .map((item) => mapTicket(item))
        .filter((item): item is Ticket => Boolean(item))
      mapped.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA
      })
      setTickets(mapped)
    } catch (err) {
      if (!signal?.aborted) {
        setError("Failed to load support history.")
        setTickets([])
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false)
      return
    }
    const controller = new AbortController()
    void loadTickets(controller.signal)
    return () => controller.abort()
  }, [status, loadTickets])

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-12 px-4 sm:pt-28 sm:pb-16 sm:px-6">
        <div className="container mx-auto max-w-5xl space-y-6">
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
              Back to support
            </Link>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Support
                </p>
                <h1 className="text-2xl font-bold sm:text-3xl">
                  Support history
                </h1>
              </div>
              <Link
                href="/support"
                className="inline-flex items-center gap-2 rounded-full border border-border/70 px-4 py-2 text-xs font-semibold transition-all duration-300 hover:bg-foreground hover:text-background"
              >
                <MessageSquare className="h-4 w-4" />
                New ticket
              </Link>
            </div>
          </motion.div>

          {status === "loading" || loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 rounded-3xl bg-muted/60 animate-pulse"
                />
              ))}
            </div>
          ) : status !== "authenticated" ? (
            <div className="rounded-3xl border border-border/70 bg-card/90 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Sign in to view your support history.
              </p>
              <Link
                href="/auth"
                className="mt-4 inline-flex rounded-full border border-border/70 px-5 py-2 text-sm font-semibold transition-all duration-300 hover:bg-foreground hover:text-background"
              >
                Go to login
              </Link>
            </div>
          ) : (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="rounded-3xl border border-border/70 bg-card/90 p-5"
            >
              {error ? (
                <p className="mb-4 rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm">
                  {error}
                </p>
              ) : null}
              {tickets.length ? (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={`/support/${encodeURIComponent(ticket.id)}`}
                      className="block rounded-3xl border border-border/60 bg-background/70 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            {ticket.category || "Uncategorized"}
                          </p>
                          <p className="mt-2 text-base font-semibold">
                            {ticket.subject || "Untitled ticket"}
                          </p>
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarDays className="h-4 w-4" />
                            <span>
                              {formatDateTime(
                                ticket.createdAt,
                                dateTimeFormatter,
                              )}
                            </span>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-semibold",
                            statusStyles[ticket.status],
                          )}
                        >
                          {statusLabel[ticket.status]}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No tickets yet. Start a new request from the support form.
                </p>
              )}
            </motion.section>
          )}
        </div>
      </main>
    </div>
  )
}
