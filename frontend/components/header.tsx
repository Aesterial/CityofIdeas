"use client";

import {
  Bell,
  ChevronDown,
  ChevronLeft,
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
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
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
  DEFAULT_CITY,
  cities as defaultCities,
  emitCityChange,
  getStoredCity,
  setGlobalCities,
  type City,
} from "@/lib/cities";
import { fetchCities } from "@/lib/api";

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
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCityOpen, setMobileCityOpen] = useState(false);
  const [city, setCity] = useState<City>(DEFAULT_CITY);
  const [citiesList, setCitiesList] = useState<City[]>(defaultCities);

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
    fetchCities()
      .then((res) => {
        setGlobalCities(res);
        const list = res.map((c) => c.name);
        setCitiesList(list);
        setCity((prev) => {
          const stored = getStoredCity();
          if (list.includes(stored)) return stored;
          if (list.includes(prev)) return prev;
          return list[0] || prev;
        });
      })
      .catch(() => {
        setCity(getStoredCity());
      });
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(CITY_STORAGE_KEY, city);
    emitCityChange(city);
  }, [city, mounted]);

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
      <div className="w-full max-w-[1380px]">
        <div className="relative overflow-hidden rounded-[38px] border border-border/70 bg-background/70 px-[18px] py-[14px] shadow-[0_36px_90px_-42px_rgba(0,0,0,0.58)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-x-[16%] top-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
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
                  className="w-[85vw] max-w-[360px] border-r border-border/70 bg-background/95 p-0 backdrop-blur-2xl [&>button]:hidden"
                >
                  <SheetHeader className="sr-only">
                    <SheetTitle>{t("menuLabel")}</SheetTitle>
                  </SheetHeader>
                  <div className="flex h-full flex-col overflow-y-auto overscroll-contain">
                    <div className="flex items-center justify-between border-b border-border/60 px-4 py-4">
                      <Logo className="h-8 w-8" showText={false} />
                      <SheetClose asChild>
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background text-foreground transition-colors hover:bg-foreground hover:text-background"
                          aria-label="Close menu"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                      </SheetClose>
                    </div>

                    <div className="flex-1 space-y-2 px-3 py-4">
                      <div className="rounded-2xl border border-border/60 bg-card/80">
                        <button
                          type="button"
                          onClick={() => setMobileCityOpen((open) => !open)}
                          className="flex w-full items-center gap-3 px-4 py-3.5"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
                            <MapPin className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1 text-left">
                            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                              {t("city") || "Город"}
                            </p>
                            <p className="text-sm font-semibold">{city}</p>
                          </div>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                              mobileCityOpen && "rotate-180",
                            )}
                          />
                        </button>
                        {mobileCityOpen ? (
                          <div className="mobile-collapse-panel border-t border-border/60 px-3 pb-3 pt-2">
                            <div className="grid grid-cols-2 gap-1.5">
                              {citiesList.map((cityName) => (
                                <button
                                  key={cityName}
                                  type="button"
                                  onClick={() => setCity(cityName)}
                                  className={cn(
                                    "rounded-xl px-3 py-2 text-left text-xs font-semibold transition-colors",
                                    cityName === city
                                      ? "bg-foreground text-background"
                                      : "bg-muted/60 text-foreground/75 hover:bg-foreground hover:text-background",
                                  )}
                                >
                                  {cityName}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="space-y-1.5">
                        {mobileNavItems.map((item) => (
                          <SheetClose asChild key={item.href}>
                            <Link
                              href={item.href}
                              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/80 px-4 py-3 transition-colors hover:bg-muted/60 active:scale-[0.99]"
                            >
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
                                <item.icon className="h-4 w-4" />
                              </span>
                              <span className="text-sm font-semibold">{item.label}</span>
                            </Link>
                          </SheetClose>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-border/60 px-3 py-3">
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card/80 px-4 py-3 transition-colors hover:bg-muted/60"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-foreground">
                          {mounted ? (
                            theme === "light" ? (
                              <Moon className="h-4 w-4" />
                            ) : (
                              <Sun className="h-4 w-4" />
                            )
                          ) : null}
                        </span>
                        <span className="text-sm font-semibold">
                          {mounted
                            ? theme === "light"
                              ? t("adminThemeDark") || "Тёмная тема"
                              : t("adminThemeLight") || "Светлая тема"
                            : null}
                        </span>
                      </button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="flex min-w-0 items-center gap-2">
              <Link href="/" className="shrink-0">
                <Logo className="h-9 w-9" showText />
              </Link>

              <div className="hidden lg:flex">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(shellClass, "h-11 rounded-full px-3.5")}
                    >
                      <MapPin className="h-4 w-4" />
                      <span className="max-w-[132px] truncate">{city}</span>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-[540px] rounded-[2rem] border-border/70 p-4"
                  >
                    <DropdownMenuLabel className="px-0 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                      Города
                    </DropdownMenuLabel>
                    <div className="grid grid-cols-2 gap-2 pt-2 sm:grid-cols-3">
                      {citiesList.map((cityName) => (
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
              </div>
            </div>

            <div className="hidden xl:flex flex-1 justify-center">
              <motion.nav
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card/75 p-1 shadow-[0_18px_46px_-30px_rgba(0,0,0,0.42)] backdrop-blur-md"
              >
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: 0.06 * index,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <Link
                      href={item.href}
                      className="block rounded-full px-4 py-2 text-sm font-medium text-foreground/72 transition-colors duration-300 hover:bg-foreground hover:text-background"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </motion.nav>
            </div>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              <div className="hidden lg:flex items-center gap-2">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="hidden"
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
                      {citiesList.map((cityName) => (
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

                <DropdownMenu modal={false}>
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
                className={cn(shellClass, "hidden h-11 w-11 rounded-full xl:flex")}
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
              {status === "authenticated" && user ? (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        shellClass,
                        "flex min-w-0 items-center gap-2 rounded-full border px-2 py-2 sm:px-2.5 sm:pr-3",
                      )}
                    >
                      <Avatar className="h-7 w-7 shrink-0 sm:h-8 sm:w-8">
                        {avatarSrc ? (
                          <AvatarImage src={avatarSrc} alt={displayName || user.username} />
                        ) : null}
                        <AvatarFallback className="text-[10px] font-semibold">
                          {avatarLabel}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden max-w-[120px] truncate text-sm font-semibold xl:inline">
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
                <div className="h-9 w-20 rounded-full bg-muted/80 animate-pulse sm:h-11 sm:w-24" />
              ) : (
                <Button
                  asChild
                  className="h-9 rounded-full px-4 text-sm shadow-[0_16px_40px_-24px_rgba(0,0,0,0.55)] sm:h-11 sm:px-5"
                >
                  <Link href="/auth">{t("login")}</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
