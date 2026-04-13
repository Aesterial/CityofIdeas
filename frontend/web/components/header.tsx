"use client";

import { motion, useMotionValueEvent, useScroll } from "motion/react";
import {
  Bell,
  ChevronDown,
  Clock,
  Globe,
  Lightbulb,
  LogIn,
  LogOut,
  MapPin,
  MessageSquare,
  Moon,
  PanelLeft,
  Settings,
  Shield,
  Sun,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { useAuth } from "./auth-provider";
import { useLanguage } from "./language-provider";
import { Logo } from "./logo";
import { useNotifications } from "./notifications-provider";
import { useTheme } from "./theme-provider";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { cn } from "@/lib/utils";
import {
  CITY_STORAGE_KEY,
  cities,
  emitCityChange,
  getStoredCity,
  type City,
} from "@/lib/cities";

export { cities, type City } from "@/lib/cities";

const shellClass =
  "rounded-full border border-border/70 bg-background/72 shadow-[0_14px_40px_-28px_rgba(0,0,0,0.45)] backdrop-blur-md";

const getInitials = (value: string) => {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const resolveAvatarSrc = (
  avatar?: { url?: string; contentType?: string; data?: string } | null,
) => {
  if (!avatar) return "";
  if (avatar.url) return avatar.url;
  if (avatar.contentType && avatar.data) {
    return `data:${avatar.contentType};base64,${avatar.data}`;
  }
  return "";
};

const formatNotificationDate = (
  value: string | undefined,
  language: string,
) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const locale =
    language === "KZ" ? "kk-KZ" : language === "RU" ? "ru-RU" : "en-US";
  return parsed.toLocaleString(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const resolveNotificationText = (
  type: string | undefined,
  body: string | undefined,
  t: (key: string) => string,
) => {
  if (body) return body;
  const normalized = type?.trim().toLowerCase() ?? "";
  if (normalized === "message") return t("notificationsTypeMessage");
  if (normalized === "notify") return t("notificationsTypeNotify");
  return t("notificationsTypeDefault");
};

const updateGlow = (event: MouseEvent<HTMLDivElement>) => {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--glow-x", `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty("--glow-y", `${event.clientY - rect.top}px`);
};

const resetGlow = (event: MouseEvent<HTMLDivElement>) => {
  event.currentTarget.style.setProperty("--glow-x", "50%");
  event.currentTarget.style.setProperty("--glow-y", "50%");
};

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, status, hasAdminAccess, logout } = useAuth();
  const {
    notifications,
    unreadCount,
    isLoading: notificationsLoading,
    refresh: refreshNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const { scrollY } = useScroll();
  const lastScrollY = useRef(0);

  const [mounted, setMounted] = useState(false);
  const [compact, setCompact] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCityOpen, setMobileCityOpen] = useState(false);
  const [city, setCity] = useState<City>(cities[0]);

  const languages = [
    { code: "RU" as const, label: "RU" },
    { code: "EN" as const, label: "EN" },
    { code: "KZ" as const, label: "KZ" },
  ];

  const navItems = [
    { href: "/voting", label: t("voting"), icon: Users },
    { href: "/suggest", label: t("suggestIdea"), icon: Lightbulb },
    { href: "/support", label: t("askQuestion"), icon: MessageSquare },
  ];

  const mobileNavItems = [
    ...navItems,
    ...(status === "authenticated"
      ? [
          { href: "/support/history", label: t("supportHistory"), icon: Clock },
          { href: "/account", label: t("account"), icon: UserCircle },
        ]
      : [{ href: "/auth", label: t("login"), icon: LogIn }]),
    ...(hasAdminAccess
      ? [{ href: "/admin", label: t("adminPanel"), icon: Shield }]
      : []),
  ];

  useEffect(() => {
    setMounted(true);
    setCity(getStoredCity());
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(CITY_STORAGE_KEY, city);
    emitCityChange(city);
  }, [city, mounted]);

  useMotionValueEvent(scrollY, "change", (value) => {
    const previous = lastScrollY.current;
    const goingDown = value > previous;

    if (value < 12) {
      setCompact(false);
    } else if (goingDown && value > 72) {
      setCompact(true);
    } else if (!goingDown) {
      setCompact(false);
    }

    lastScrollY.current = value;
  });

  const displayName = user?.displayName || user?.username || "";
  const avatarLabel = getInitials(displayName || user?.username || "User");
  const avatarSrc = resolveAvatarSrc(user?.avatar);
  const unreadBadge = unreadCount > 99 ? "99+" : String(unreadCount);
  const visibleNotifications = notifications.slice(0, 8);

  return (
    <header
      className="fixed inset-x-0 z-50 flex justify-center px-2 pt-3 sm:px-5 sm:pt-4"
      style={{ top: "var(--maintenance-banner-height)" }}
    >
      <motion.div
        className="w-full"
        animate={{
          maxWidth: compact ? 1120 : 1380,
          y: compact ? -4 : 0,
        }}
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          onMouseMove={updateGlow}
          onMouseLeave={resetGlow}
          className="relative overflow-hidden border border-border/70 bg-background/70 backdrop-blur-2xl"
          style={
            {
              "--glow-x": "50%",
              "--glow-y": "50%",
            } as CSSProperties
          }
          animate={{
            borderRadius: compact ? 28 : 38,
            paddingTop: compact ? 8 : 14,
            paddingBottom: compact ? 8 : 14,
            paddingLeft: compact ? 12 : 18,
            paddingRight: compact ? 12 : 18,
            boxShadow: compact
              ? "0 22px 56px -34px rgba(0,0,0,0.55)"
              : "0 36px 90px -42px rgba(0,0,0,0.58)",
          }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="absolute inset-0 bg-[radial-gradient(420px_circle_at_var(--glow-x)_var(--glow-y),rgba(255,255,255,0.24),transparent_42%)] opacity-70 dark:bg-[radial-gradient(420px_circle_at_var(--glow-x)_var(--glow-y),rgba(255,255,255,0.12),transparent_44%)]" />
            <div className="absolute inset-x-[16%] top-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
            <div className="absolute -left-20 top-0 h-28 w-40 rounded-full bg-foreground/6 blur-3xl" />
            <div className="absolute -right-12 bottom-0 h-20 w-32 rounded-full bg-foreground/6 blur-3xl" />
          </div>

          <div className="relative flex items-center gap-3">
            <div className="xl:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    className={cn(shellClass, "h-11 w-11 rounded-full")}
                    aria-label={t("menuLabel")}
                  >
                    <PanelLeft className="h-4 w-4" />
                  </Button>
                </SheetTrigger>

                <SheetContent
                  side="left"
                  className="w-[90vw] max-w-[420px] border-r border-border/70 bg-background/92 p-0 backdrop-blur-2xl [&>button]:hidden"
                >
                  <SheetHeader className="sr-only">
                    <SheetTitle>{t("menuLabel")}</SheetTitle>
                  </SheetHeader>
                  <div className="flex h-full flex-col overflow-y-auto px-5 py-5">
                    <div className="mb-6 flex items-center justify-between">
                      <Logo className="h-9 w-9" />
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className={cn(shellClass, "h-10 w-10 rounded-full")}
                          onClick={toggleTheme}
                        >
                          {mounted ? (
                            theme === "light" ? (
                              <Moon className="h-4 w-4" />
                            ) : (
                              <Sun className="h-4 w-4" />
                            )
                          ) : null}
                        </Button>
                        <SheetClose asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            className={cn(shellClass, "h-10 w-10 rounded-full")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </SheetClose>
                      </div>
                    </div>

                    <div className="rounded-[2rem] border border-border/70 bg-card/80 p-4">
                      <button
                        type="button"
                        onClick={() => setMobileCityOpen((open) => !open)}
                        className="flex w-full items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-background">
                            <MapPin className="h-5 w-5" />
                          </span>
                          <div className="text-left">
                            <p className="text-[10px] uppercase tracking-[0.26em] text-muted-foreground">
                              Город
                            </p>
                            <p className="text-sm font-semibold">{city}</p>
                          </div>
                        </div>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            mobileCityOpen && "rotate-180",
                          )}
                        />
                      </button>
                      {mobileCityOpen ? (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          {cities.map((cityName) => (
                            <button
                              key={cityName}
                              type="button"
                              onClick={() => setCity(cityName)}
                              className={cn(
                                "rounded-xl px-3 py-2 text-left text-xs font-semibold transition",
                                cityName === city
                                  ? "bg-foreground text-background"
                                  : "bg-muted/70 text-foreground/75 hover:bg-foreground hover:text-background",
                              )}
                            >
                              {cityName}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-5 grid gap-3">
                      {mobileNavItems.map((item) => (
                        <SheetClose asChild key={item.href}>
                          <Link
                            href={item.href}
                            className="flex items-center gap-4 rounded-[2rem] border border-border/70 bg-card/80 px-4 py-3 transition hover:bg-muted/70"
                          >
                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-background">
                              <item.icon className="h-5 w-5" />
                            </span>
                            <span className="text-sm font-semibold">{item.label}</span>
                          </Link>
                        </SheetClose>
                      ))}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <Link href="/" className="shrink-0">
              <Logo className={compact ? "h-8 w-8" : "h-9 w-9"} showText />
            </Link>

            <div className="hidden xl:flex flex-1 justify-center">
              <motion.nav
                className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card/75 p-1 shadow-[0_18px_46px_-30px_rgba(0,0,0,0.42)] backdrop-blur-md"
                animate={{
                  scale: compact ? 0.92 : 1,
                  y: compact ? -1 : 0,
                }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full px-4 py-2 text-sm font-medium text-foreground/72 transition hover:bg-foreground hover:text-background"
                  >
                    {item.label}
                  </Link>
                ))}
              </motion.nav>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(shellClass, "hidden h-11 rounded-full px-4 lg:inline-flex")}
                    >
                      <MapPin className="h-4 w-4" />
                      <span className="max-w-[140px] truncate">{city}</span>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-[540px] rounded-[2rem] border-border/70 p-4"
                  >
                    <DropdownMenuLabel className="px-0 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                      Город
                    </DropdownMenuLabel>
                    <div className="grid grid-cols-2 gap-2 pt-2 sm:grid-cols-3">
                      {cities.map((cityName) => (
                        <button
                          key={cityName}
                          type="button"
                          onClick={() => setCity(cityName)}
                          className={cn(
                            "rounded-2xl px-3 py-2 text-left text-xs font-semibold transition sm:text-sm",
                            cityName === city
                              ? "bg-foreground text-background"
                              : "bg-muted/70 text-foreground/75 hover:bg-foreground hover:text-background",
                          )}
                        >
                          {cityName}
                        </button>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(shellClass, "h-11 rounded-full px-4")}
                    >
                      <Globe className="h-4 w-4" />
                      {language}
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="center"
                    sideOffset={10}
                    className="min-w-[88px] rounded-2xl border-border/70 p-1"
                  >
                    {languages
                      .filter((item) => item.code !== language)
                      .map((item) => (
                      <DropdownMenuItem
                        key={item.code}
                        onSelect={() => setLanguage(item.code)}
                        className="justify-center rounded-xl"
                      >
                        {item.label}
                      </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Button
                size="icon"
                variant="outline"
                className={cn(shellClass, "h-11 w-11 rounded-full")}
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {mounted ? (
                  theme === "light" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )
                ) : null}
              </Button>

              {status === "authenticated" ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      className={cn(shellClass, "relative h-11 w-11 rounded-full")}
                    >
                      <Bell className="h-4 w-4" />
                      {unreadCount > 0 ? (
                        <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-semibold text-background">
                          {unreadBadge}
                        </span>
                      ) : null}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-[360px] rounded-[2rem] border-border/70 p-0"
                  >
                    <div className="flex items-center justify-between px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                        {t("notificationsTitle")}
                      </p>
                      {unreadCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => void markAllAsRead()}
                          className="text-xs font-semibold text-foreground/75 transition hover:text-foreground"
                        >
                          {t("notificationsMarkAllRead")}
                        </button>
                      ) : null}
                    </div>
                    <DropdownMenuSeparator />
                    {notificationsLoading ? (
                      <div className="px-4 py-4 text-sm text-muted-foreground">
                        {t("notificationsLoading")}
                      </div>
                    ) : visibleNotifications.length === 0 ? (
                      <div className="px-4 py-4 text-sm text-muted-foreground">
                        {t("notificationsEmpty")}
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto p-2">
                        {visibleNotifications.map((notification) => {
                          const isUnread = !notification.readAt;
                          return (
                            <DropdownMenuItem
                              key={notification.id}
                              onSelect={(event) => {
                                event.preventDefault();
                                if (isUnread) void markAsRead(notification.id);
                              }}
                              className="mb-1 items-start gap-3 rounded-2xl px-3 py-3"
                            >
                              <span
                                className={cn(
                                  "mt-1 h-2 w-2 rounded-full",
                                  isUnread ? "bg-foreground" : "bg-muted-foreground/40",
                                )}
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium leading-snug">
                                  {resolveNotificationText(
                                    notification.type,
                                    notification.body,
                                    t,
                                  )}
                                </span>
                                {notification.createdAt ? (
                                  <span className="mt-1 block text-[11px] text-muted-foreground">
                                    {formatNotificationDate(
                                      notification.createdAt,
                                      language,
                                    )}
                                  </span>
                                ) : null}
                              </span>
                            </DropdownMenuItem>
                          );
                        })}
                      </div>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        void refreshNotifications({ silent: true });
                      }}
                    >
                      {t("notificationsRefresh")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}

              {status === "authenticated" && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        shellClass,
                        "flex min-w-0 items-center gap-3 rounded-full border px-2.5 py-2.5 pr-3",
                      )}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        {avatarSrc ? (
                          <AvatarImage src={avatarSrc} alt={displayName || user.username} />
                        ) : null}
                        <AvatarFallback className="text-xs font-semibold">
                          {avatarLabel}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden max-w-[180px] truncate text-sm font-semibold xl:inline">
                        {displayName || user.username}
                      </span>
                      <ChevronDown className="hidden h-4 w-4 text-muted-foreground xl:inline" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-60 rounded-[2rem] border-border/70"
                  >
                    <DropdownMenuLabel className="space-y-1">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                        {t("account")}
                      </p>
                      <p className="text-sm font-semibold">
                        {displayName || user.username}
                      </p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/account" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        {t("accountSettings")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/support/history" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {t("supportHistory")}
                      </Link>
                    </DropdownMenuItem>
                    {hasAdminAccess ? (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          {t("adminPanel")}
                        </Link>
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        void logout();
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      {t("logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : status === "loading" ? (
                <div className="h-11 w-24 rounded-full bg-muted/80 animate-pulse" />
              ) : (
                <Button
                  asChild
                  className="h-11 rounded-full px-5 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.55)]"
                >
                  <Link href="/auth">{t("login")}</Link>
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </header>
  );
}
