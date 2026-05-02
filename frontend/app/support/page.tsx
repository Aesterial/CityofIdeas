"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  HelpCircle,
  Mail,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { Header } from "@/components/header";
import { GradientButton } from "@/components/gradient-button";
import { useAuth } from "@/components/auth-provider";
import { useLanguage } from "@/components/language-provider";
import { createTicket, createTicketMessage } from "@/lib/api";

type SupportCategoryId =
  | "account_access"
  | "project_request"
  | "technical_issue"
  | "other";

type SupportFormState = {
  name: string;
  email: string;
  subject: string;
  category: SupportCategoryId;
  message: string;
};

type SupportFormErrors = Partial<Record<keyof SupportFormState, string>>;

const copyByLanguage = {
  RU: {
    title: "Задать вопрос",
    subtitle:
      "Заполните форму — наша служба поддержки свяжется с вами и поможет разобраться.",
    nameLabel: "Имя",
    namePlaceholder: "Как к вам обращаться",
    emailLabel: "Email",
    categoryLabel: "Категория",
    subjectLabel: "Тема обращения",
    subjectPlaceholder: "Коротко о проблеме",
    messageLabel: "Сообщение",
    messagePlaceholder: "Опишите ситуацию и добавьте важные детали",
    submitSending: "Отправка...",
    submitAction: "Отправить запрос",
    errorEmail: "Пожалуйста, укажите контактный email.",
    errorSubject: "Пожалуйста, добавьте тему обращения.",
    errorMessage: "Пожалуйста, опишите проблему подробнее.",
    submitError: "Не удалось отправить запрос. Попробуйте ещё раз.",
    nextTitle: "Что дальше?",
    nextBody:
      "После отправки запрос попадает в очередь поддержки. Специалист возьмёт его в работу и свяжется с вами.",
    nextNote:
      "Если в течение 48 часов не будет новых сообщений, запрос закроется автоматически.",
    historyTitle: "История обращений",
    historyBodyAuthed:
      "Отслеживайте статус запроса и продолжайте переписку с поддержкой.",
    historyBodyGuest: "Войдите, чтобы увидеть ваши обращения и сообщения.",
    historyLinkAuthed: "Перейти к истории",
    historyLinkGuest: "Войти",
    adminTitle: "Панель поддержки",
    adminBody:
      "У вас есть доступ к обращениям. Откройте список и выберите нужное.",
    adminLink: "Перейти в поддержку",
    categories: {
      accountAccess: "Аккаунт и доступ",
      projectRequest: "Проект или запрос",
      technicalIssue: "Техническая проблема",
      other: "Другое",
    },
  },

  EN: {
    title: "Ask a question",
    subtitle: "Fill out the form — our support team will contact you and help.",
    nameLabel: "Name",
    namePlaceholder: "How should we address you",
    emailLabel: "Email",
    categoryLabel: "Category",
    subjectLabel: "Subject",
    subjectPlaceholder: "Short summary of the issue",
    messageLabel: "Message",
    messagePlaceholder: "Describe the situation and include important details",
    submitSending: "Sending...",
    submitAction: "Submit request",
    errorEmail: "Please enter a contact email.",
    errorSubject: "Please add a subject.",
    errorMessage: "Please describe the issue in more detail.",
    submitError: "Failed to send the request. Please try again.",
    nextTitle: "What happens next?",
    nextBody:
      "After you submit, the request goes into the support queue. A specialist will take it and contact you.",
    nextNote:
      "If there are no new messages for 48 hours, the request will close automatically.",
    historyTitle: "Support history",
    historyBodyAuthed:
      "Track request status and continue the conversation with support.",
    historyBodyGuest: "Sign in to view your requests and messages.",
    historyLinkAuthed: "Go to history",
    historyLinkGuest: "Sign in",
    adminTitle: "Support panel",
    adminBody: "You have access to requests. Open the list and pick one.",
    adminLink: "Go to support",
    categories: {
      accountAccess: "Account & access",
      projectRequest: "Project or request",
      technicalIssue: "Technical issue",
      other: "Other",
    },
  },

  KZ: {
    title: "Сұрақ қою",
    subtitle:
      "Форманы толтырыңыз — қолдау қызметі сізбен байланысып, көмектеседі.",
    nameLabel: "Аты",
    namePlaceholder: "Сізге қалай жүгінейік",
    emailLabel: "Email",
    categoryLabel: "Санат",
    subjectLabel: "Өтініш тақырыбы",
    subjectPlaceholder: "Мәселені қысқаша сипаттаңыз",
    messageLabel: "Хабарлама",
    messagePlaceholder: "Жағдайды сипаттап, маңызды мәліметтерді қосыңыз",
    submitSending: "Жіберілуде...",
    submitAction: "Өтініш жіберу",
    errorEmail: "Байланыс email енгізіңіз.",
    errorSubject: "Өтініш тақырыбын қосыңыз.",
    errorMessage: "Мәселені толығырақ сипаттаңыз.",
    submitError: "Өтініш жіберілмеді. Қайталап көріңіз.",
    nextTitle: "Одан әрі не болады?",
    nextBody:
      "Жібергеннен кейін өтініш қолдау кезегіне түседі. Маман қарап, сізбен байланысады.",
    nextNote:
      "48 сағат ішінде жаңа хабарламалар болмаса, өтініш автоматты түрде жабылады.",
    historyTitle: "Қолдау тарихы",
    historyBodyAuthed:
      "Өтініш күйін қадағалап, қолдаумен хат алмасуды жалғастырыңыз.",
    historyBodyGuest: "Өтініштер мен хабарламаларды көру үшін кіріңіз.",
    historyLinkAuthed: "Тарихқа өту",
    historyLinkGuest: "Кіру",
    adminTitle: "Қолдау панелі",
    adminBody:
      "Сізде өтініштерге қолжетімділік бар. Тізімді ашып, керегін таңдаңыз.",
    adminLink: "Қолдауға өту",
    categories: {
      accountAccess: "Аккаунт және қолжетімділік",
      projectRequest: "Жоба немесе сұраныс",
      technicalIssue: "Техникалық мәселе",
      other: "Басқа",
    },
  },
} as const;

type SupportCopy = (typeof copyByLanguage)[keyof typeof copyByLanguage];

const categoryKeyById = {
  account_access: "accountAccess",
  project_request: "projectRequest",
  technical_issue: "technicalIssue",
  other: "other",
} as const;

const getCategoryLabel = (copy: SupportCopy, id: SupportCategoryId): string =>
  copy.categories[categoryKeyById[id]];

const DEFAULT_CATEGORY: SupportCategoryId = "account_access";

export default function SupportPage() {
  const router = useRouter();
  const { user, hasAdminAccess } = useAuth();
  const { language } = useLanguage();
  const copy = copyByLanguage[language] ?? copyByLanguage.RU;
  const categoryOptions = [
    { id: "account_access", label: copy.categories.accountAccess },
    { id: "project_request", label: copy.categories.projectRequest },
    { id: "technical_issue", label: copy.categories.technicalIssue },
    { id: "other", label: copy.categories.other },
  ];
  const [formData, setFormData] = useState<SupportFormState>({
    name: "",
    email: "",
    subject: "",
    category: DEFAULT_CATEGORY,
    message: "",
  });
  const [errors, setErrors] = useState<SupportFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement | null>(null);
  const categoryListRef = useRef<HTMLUListElement | null>(null);
  const selectedCategoryLabel =
    categoryOptions.find((option) => option.id === formData.category)?.label ??
    copy.categoryLabel;

  useEffect(() => {
    if (!user) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      name: prev.name || user.displayName || user.username || "",
      email: prev.email || user.email || "",
    }));
  }, [user]);

  const canManageSupport = hasAdminAccess;
  const canViewHistory = Boolean(user);
  const isGuest = !user;

  useEffect(() => {
    if (!isCategoryOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!categoryDropdownRef.current?.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCategoryOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCategoryOpen]);

  useEffect(() => {
    if (!isCategoryOpen) {
      return;
    }

    const list = categoryListRef.current;
    if (!list) {
      return;
    }

    const escapeValue =
      typeof CSS !== "undefined" && typeof CSS.escape === "function"
        ? CSS.escape
        : (value: string) => value.replace(/"/g, '\\"');
    const selected = list.querySelector(
      `[data-value="${escapeValue(formData.category)}"]`,
    ) as HTMLElement | null;

    if (selected) {
      requestAnimationFrame(() => {
        selected.scrollIntoView({ block: "nearest" });
      });
    }
  }, [formData.category, isCategoryOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }
    const nextErrors: SupportFormErrors = {};

    const resolvedEmail = formData.email.trim() || user?.email?.trim() || "";

    if (!resolvedEmail) {
      nextErrors.email = copy.errorEmail;
    }
    if (!formData.subject.trim()) {
      nextErrors.subject = copy.errorSubject;
    }
    if (!formData.message.trim()) {
      nextErrors.message = copy.errorMessage;
    }

    setErrors(nextErrors);
    setSubmitError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const subject = formData.subject.trim();
      const content = formData.message.trim();
      const brief = [subject, content].filter(Boolean).join("\n\n");
      const { id, token } = await createTicket({
        name:
          formData.name.trim() ||
          user?.displayName ||
          user?.username ||
          undefined,
        email: resolvedEmail,
        topic: getCategoryLabel(copy, formData.category),
        brief,
        content,
      });
      if (token && typeof window !== "undefined") {
        window.sessionStorage.setItem(`support.ticket.token.${id}`, token);
      }
      router.push(`/support/${encodeURIComponent(id)}`);
    } catch (error) {
      setSubmitError(copy.submitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_16%_12%,hsl(var(--foreground)/0.08),transparent_30%),radial-gradient(circle_at_88%_16%,hsl(var(--foreground)/0.06),transparent_26%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.25)_50%,hsl(var(--background)))]">
      <Header />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.16)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.12)_1px,transparent_1px)] bg-[size:78px_78px] opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/30 to-transparent" />
      </div>

      <main className="relative px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32">
        <div className="container mx-auto max-w-6xl space-y-8">
          <motion.div
            className="relative overflow-hidden rounded-[2.6rem] border border-border/70 bg-background/76 p-6 shadow-[0_36px_110px_-78px_rgba(0,0,0,0.92)] backdrop-blur-xl sm:p-8"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(620px_circle_at_12%_0%,hsl(var(--foreground)/0.12),transparent_48%)]" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/76 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  Support desk
                </span>
                <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[0.9] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                  {copy.title}
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  {copy.subtitle}
                </p>
              </div>
              <div className="grid min-w-[min(100%,22rem)] gap-3 sm:grid-cols-2">
                <div className="rounded-[1.4rem] border border-border/60 bg-card/72 p-4 shadow-[0_18px_48px_-34px_rgba(0,0,0,0.65)]">
                  <p className="text-[10px] uppercase tracking-[0.26em] text-muted-foreground">
                    Status
                  </p>
                  <p className="mt-2 text-xl font-semibold">
                    {canViewHistory ? "Account linked" : "Guest mode"}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-border/60 bg-card/72 p-4 shadow-[0_18px_48px_-34px_rgba(0,0,0,0.65)]">
                  <p className="text-[10px] uppercase tracking-[0.26em] text-muted-foreground">
                    Queue
                  </p>
                  <p className="mt-2 text-xl font-semibold">48h SLA</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-[1.28fr_0.72fr]">
            <motion.form
              onSubmit={handleSubmit}
              className="relative overflow-hidden rounded-[2.35rem] border border-border/70 bg-card/82 p-6 shadow-[0_30px_90px_-62px_rgba(0,0,0,0.9)] backdrop-blur-xl before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(520px_circle_at_0%_0%,hsl(var(--foreground)/0.08),transparent_46%)] sm:p-7"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative grid gap-5">
                {isGuest ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <User className="inline h-4 w-4 mr-2" />
                        {copy.nameLabel}
                      </label>
                      <input
                        value={formData.name}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            name: event.target.value,
                          })
                        }
                        placeholder={copy.namePlaceholder}
                        className="w-full rounded-2xl border border-border/70 bg-background/76 px-4 py-3 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-foreground/20"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <Mail className="inline h-4 w-4 mr-2" />
                        {copy.emailLabel}
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            email: event.target.value,
                          })
                        }
                        placeholder="name@example.com"
                        className="w-full rounded-2xl border border-border/70 bg-background/76 px-4 py-3 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-foreground/20"
                      />
                      {errors.email ? (
                        <p className="mt-2 text-xs text-destructive">
                          {errors.email}
                        </p>
                      ) : null}
                    </div>
                  </>
                ) : null}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <HelpCircle className="inline h-4 w-4 mr-2" />
                    {copy.categoryLabel}
                  </label>
                  <div className="relative" ref={categoryDropdownRef}>
                    <HelpCircle className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <button
                      type="button"
                      aria-haspopup="listbox"
                      aria-expanded={isCategoryOpen}
                      onClick={() => setIsCategoryOpen((prev) => !prev)}
                      className="w-full rounded-2xl border border-border/70 bg-background/76 px-10 py-3 text-left text-sm shadow-inner transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    >
                      {selectedCategoryLabel}
                    </button>
                    <ChevronDown
                      className={`pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-transform ${
                        isCategoryOpen ? "rotate-180" : "rotate-0"
                      }`}
                    />
                    <ul
                      ref={categoryListRef}
                      role="listbox"
                      aria-hidden={!isCategoryOpen}
                      className={`absolute left-0 right-0 z-20 mt-2 max-h-60 origin-top overflow-auto rounded-2xl border border-border/60 bg-card/95 p-1 shadow-[0_18px_40px_-32px_rgba(0,0,0,0.55)] backdrop-blur transition duration-150 ease-out ${
                        isCategoryOpen
                          ? "pointer-events-auto scale-100 opacity-100"
                          : "pointer-events-none scale-95 opacity-0"
                      }`}
                    >
                      {categoryOptions.map((category) => {
                        const isSelected = formData.category === category.id;
                        return (
                          <li key={category.id} role="presentation">
                            <button
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              data-value={category.id}
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  category: category.id as SupportCategoryId,
                                });
                                setIsCategoryOpen(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                                isSelected
                                  ? "bg-foreground/10"
                                  : "hover:bg-foreground/10"
                              }`}
                            >
                              <span className="truncate">{category.label}</span>
                              {isSelected ? (
                                <Check
                                  aria-hidden="true"
                                  className="h-4 w-4 text-foreground"
                                />
                              ) : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <MessageSquare className="inline h-4 w-4 mr-2" />
                    {copy.subjectLabel}
                  </label>
                  <input
                    value={formData.subject}
                    onChange={(event) =>
                      setFormData({ ...formData, subject: event.target.value })
                    }
                    placeholder={copy.subjectPlaceholder}
                    className="w-full rounded-2xl border border-border/70 bg-background/76 px-4 py-3 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                  {errors.subject ? (
                    <p className="mt-2 text-xs text-destructive">
                      {errors.subject}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <MessageSquare className="inline h-4 w-4 mr-2" />
                    {copy.messageLabel}
                  </label>
                  <textarea
                    rows={5}
                    value={formData.message}
                    onChange={(event) =>
                      setFormData({ ...formData, message: event.target.value })
                    }
                    placeholder={copy.messagePlaceholder}
                    className="min-h-40 w-full resize-none rounded-[1.45rem] border border-border/70 bg-background/76 px-4 py-3 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                  {errors.message ? (
                    <p className="mt-2 text-xs text-destructive">
                      {errors.message}
                    </p>
                  ) : null}
                </div>

                {submitError ? (
                  <p className="rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm">
                    {submitError}
                  </p>
                ) : null}

                <div className="pt-2">
                  <GradientButton
                    type="submit"
                    className="w-full justify-center px-7 py-3 shadow-[0_18px_44px_-28px_rgba(0,0,0,0.75)] sm:w-auto"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? copy.submitSending : copy.submitAction}
                  </GradientButton>
                </div>
              </div>
            </motion.form>

            <motion.aside
              className="space-y-4"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
                className="rounded-[2rem] border border-border/70 bg-card/82 p-6 shadow-[0_24px_70px_-54px_rgba(0,0,0,0.86)] backdrop-blur-xl"
              >
                <p className="text-sm font-semibold">{copy.nextTitle}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {copy.nextBody}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {copy.nextNote}
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
                className="rounded-[2rem] border border-border/70 bg-card/82 p-6 shadow-[0_24px_70px_-54px_rgba(0,0,0,0.86)] backdrop-blur-xl"
              >
                <p className="text-sm font-semibold">{copy.historyTitle}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {canViewHistory
                    ? copy.historyBodyAuthed
                    : copy.historyBodyGuest}
                </p>
                <Link
                  href={canViewHistory ? "/support/history" : "/auth"}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-4 py-2 text-xs font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:bg-foreground hover:text-background"
                >
                  {canViewHistory
                    ? copy.historyLinkAuthed
                    : copy.historyLinkGuest}
                </Link>
              </motion.div>

              {canManageSupport ? (
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-[2rem] border border-border/70 bg-card/82 p-6 shadow-[0_24px_70px_-54px_rgba(0,0,0,0.86)] backdrop-blur-xl"
                >
                  <p className="text-sm font-semibold">{copy.adminTitle}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {copy.adminBody}
                  </p>
                  <Link
                    href="/admin/support"
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-4 py-2 text-xs font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:bg-foreground hover:text-background"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {copy.adminLink}
                  </Link>
                </motion.div>
              ) : null}
            </motion.aside>
          </div>
        </div>
      </main>
    </div>
  );
}
