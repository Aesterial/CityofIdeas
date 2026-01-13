"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { HelpCircle, Mail, MessageSquare, ShieldCheck, User } from "lucide-react"
import { Header } from "@/components/header"
import { GradientButton } from "@/components/gradient-button"
import { useAuth } from "@/components/auth-provider"
import { createTicket } from "@/lib/api"

type SupportFormState = {
  name: string
  email: string
  subject: string
  category: string
  message: string
}

type SupportFormErrors = Partial<Record<keyof SupportFormState, string>>

const categories = [
  { value: "Аккаунт и доступ", label: "Аккаунт и доступ" },
  { value: "Проект или заявка", label: "Проект или заявка" },
  { value: "Техническая проблема", label: "Техническая проблема" },
  { value: "Другое", label: "Другое" },
]

export default function SupportPage() {
  const router = useRouter()
  const { user, hasAdminAccess } = useAuth()
  const [formData, setFormData] = useState<SupportFormState>({
    name: "",
    email: "",
    subject: "",
    category: categories[0].value,
    message: "",
  })
  const [errors, setErrors] = useState<SupportFormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!user) {
      return
    }
    setFormData((prev) => ({
      ...prev,
      name: prev.name || user.displayName || user.username || "",
      email: prev.email || user.email || "",
    }))
  }, [user])

  const canManageSupport = hasAdminAccess

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) {
      return
    }
    const nextErrors: SupportFormErrors = {}

    if (!formData.email.trim()) {
      nextErrors.email = "Укажите контактный email."
    }
    if (!formData.subject.trim()) {
      nextErrors.subject = "Добавьте тему обращения."
    }
    if (!formData.message.trim()) {
      nextErrors.message = "Опишите вопрос подробнее."
    }

    setErrors(nextErrors)
    setSubmitError(null)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)
    try {
      const subject = formData.subject.trim()
      const message = formData.message.trim()
      const brief = [subject, message].filter(Boolean).join("\n\n")
      const id = await createTicket({
        name: formData.name.trim() || undefined,
        email: formData.email.trim(),
        topic: formData.category,
        brief,
      })
      router.push(`/support/${encodeURIComponent(id)}`)
    } catch (error) {
      setSubmitError("Не удалось отправить обращение. Попробуйте еще раз.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-12 px-4 sm:pt-28 sm:pb-16 sm:px-6">
        <div className="container mx-auto max-w-5xl space-y-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 className="text-3xl font-bold sm:text-4xl">Задать вопрос</h1>
            <p className="mt-2 text-muted-foreground">
              Заполните форму — команда поддержки свяжется с вами и поможет разобраться.
            </p>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <motion.form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-[0_24px_60px_-45px_rgba(0,0,0,0.35)]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              <div className="grid gap-5">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <User className="inline h-4 w-4 mr-2" />
                    Имя
                  </label>
                  <input
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                    placeholder="Как к вам обращаться"
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Mail className="inline h-4 w-4 mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                    placeholder="name@example.com"
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                  {errors.email ? <p className="mt-2 text-xs text-destructive">{errors.email}</p> : null}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <HelpCircle className="inline h-4 w-4 mr-2" />
                    Категория
                  </label>
                  <select
                    value={formData.category}
                    onChange={(event) => setFormData({ ...formData, category: event.target.value })}
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <MessageSquare className="inline h-4 w-4 mr-2" />
                    Тема обращения
                  </label>
                  <input
                    value={formData.subject}
                    onChange={(event) => setFormData({ ...formData, subject: event.target.value })}
                    placeholder="Коротко о проблеме"
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                  {errors.subject ? <p className="mt-2 text-xs text-destructive">{errors.subject}</p> : null}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Сообщение</label>
                  <textarea
                    rows={5}
                    value={formData.message}
                    onChange={(event) => setFormData({ ...formData, message: event.target.value })}
                    placeholder="Опишите ситуацию и приложите важные детали"
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
                  />
                  {errors.message ? <p className="mt-2 text-xs text-destructive">{errors.message}</p> : null}
                </div>

                {submitError ? (
                  <p className="rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm">
                    {submitError}
                  </p>
                ) : null}

                <div className="pt-2">
                  <GradientButton
                    type="submit"
                    className="w-full justify-center sm:w-auto"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Отправляем..." : "Отправить обращение"}
                  </GradientButton>
                </div>
              </div>
            </motion.form>

            <motion.aside
              className="space-y-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="rounded-3xl border border-border/70 bg-card/90 p-6">
                <p className="text-sm font-semibold">Что дальше?</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  После отправки обращение попадет в очередь поддержки. Специалист возьмет его в работу и свяжется с вами.
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Если новых сообщений не будет в течение 48 часов, обращение закроется автоматически.
                </p>
              </div>

              {canManageSupport ? (
                <div className="rounded-3xl border border-border/70 bg-card/90 p-6">
                  <p className="text-sm font-semibold">Панель поддержки</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    У вас есть доступ к обращениям. Откройте список и возьмите обращение.
                  </p>
                  <Link
                    href="/admin/support"
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-border/70 px-4 py-2 text-xs font-semibold transition-all duration-300 hover:bg-foreground hover:text-background"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Перейти в поддержку
                  </Link>
                </div>
              ) : null}
            </motion.aside>
          </div>
        </div>
      </main>
    </div>
  )
}
