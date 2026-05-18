"use client";

import type React from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { motion } from "motion/react";
import {
  Camera,
  FileText,
  ListFilter,
  MapPin,
  Type,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { TextMorph } from "@/components/forgeui/text-morph";
import { useAuth } from "@/components/auth-provider";
import { useLanguage } from "@/components/language-provider";
import { MapLibreMap } from "@/components/maplibre-map";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createProject, uploadProjectPhotos } from "@/lib/api";
import {
  CITY_CHANGE_EVENT,
  CITY_STORAGE_KEY,
  getStoredCity,
  resolveCity,
  resolveCityCenter,
  resolveCityId,
  type City,
} from "@/lib/cities";
import { cn } from "@/lib/utils";

type SelectedImage = {
  id: string;
  file: File;
  preview: string;
};

type SuggestCategoryId =
  | "improvement"
  | "roadsidewalks"
  | "lighting"
  | "playgrounds"
  | "parks"
  | "other";

const heroLead = {
  RU: "Предлагайте",
  EN: "Share",
  KZ: "Ұсыныңыз",
} as const;

const heroWords = {
  RU: ["решения", "проекты", "обновления"],
  EN: ["solutions", "projects", "updates"],
  KZ: ["шешімдер", "жобалар", "жаңартулар"],
} as const;

const mapSectionTitle = {
  RU: "\u041C\u0435\u0441\u0442\u043E \u043F\u0440\u043E\u0435\u043A\u0442\u0430",
  EN: "Project location",
  KZ: "\u0416\u043E\u0431\u0430 \u043E\u0440\u043D\u044B",
} as const;

const mapSectionDescription = {
  RU: "Локация",
  EN: "Location",
  KZ: "Орналасқан жері"
} as const;

const glowStyle = {
  "--glow-x": "50%",
  "--glow-y": "50%",
} as CSSProperties;

const updateGlow = (event: MouseEvent<HTMLDivElement>) => {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--glow-x", `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty("--glow-y", `${event.clientY - rect.top}px`);
};

const resetGlow = (_event: MouseEvent<HTMLDivElement>) => {
  //
};

const createImageId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export default function SuggestPage() {
  const router = useRouter();
  const { status, user } = useAuth();
  const { language, t } = useLanguage();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<SuggestCategoryId>("improvement");
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [mapSelection, setMapSelection] = useState<[number, number] | null>(null);
  const [selectedCity, setSelectedCity] = useState<City>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const imagesRef = useRef<SelectedImage[]>([]);

  const categoryOptions = [
    { id: "improvement", label: t("landscaping") },
    { id: "roadsidewalks", label: t("roadsAndSidewalks") },
    { id: "lighting", label: t("lighting") },
    { id: "playgrounds", label: t("playgrounds") },
    { id: "parks", label: t("parksAndSquares") },
    { id: "other", label: t("other") },
  ] as const;

  const mapCenter = useMemo(
    () => resolveCityCenter(selectedCity),
    [selectedCity],
  );

  useEffect(() => {
    const storedCity = getStoredCity();
    if (storedCity) {
      setSelectedCity(storedCity);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleCityChange = (event: Event) => {
      const payload = event as CustomEvent<{ city?: string }>;
      const nextCity = resolveCity(payload.detail?.city);
      if (nextCity) setSelectedCity(nextCity);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== CITY_STORAGE_KEY) return;
      const nextCity = resolveCity(event.newValue);
      if (nextCity) setSelectedCity(nextCity);
    };

    window.addEventListener(
      CITY_CHANGE_EVENT,
      handleCityChange as EventListener,
    );
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        CITY_CHANGE_EVENT,
        handleCityChange as EventListener,
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    setMapSelection(null);
  }, [selectedCity]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.preview));
    };
  }, []);

  const addImages = useCallback((files: File[]) => {
    const next = files
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: createImageId(),
        file,
        preview: URL.createObjectURL(file),
      }));

    if (next.length === 0) return;
    setImages((prev) => [...prev, ...next]);
  }, []);

  const removeImage = (index: number) => {
    setImages((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) {
      setSubmitError(t("projectSubmitErrorTitle"));
      return;
    }
    if (!trimmedDescription) {
      setSubmitError(t("projectSubmitErrorDescription"));
      return;
    }
    if (!mapSelection) {
      setSubmitError(t("projectSubmitErrorCoordinates"));
      return;
    }
    if (images.length === 0) {
      setSubmitError(t("projectSubmitErrorPhotos"));
      return;
    }

    setIsSubmitting(true);

    try {
      const { id } = await createProject({
        title:
          trimmedTitle.slice(0, 80).trim() ||
          [t("projectTitleFallback"), selectedCity].filter(Boolean).join(" "),
        description: trimmedDescription,
        category,
        location: {
          city: resolveCityId(selectedCity),
          latitude: mapSelection[1],
          longitude: mapSelection[0],
        },
      });

      if (!id) {
        throw new Error(t("projectSubmitErrorMissingId"));
      }

      await uploadProjectPhotos(
        id,
        images.map((image) => image.file),
      );

      router.push(`/projects/${encodeURIComponent(String(id))}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : t("projectSubmitErrorGeneric"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="px-4 pb-12 pt-28 sm:px-6 sm:pt-32">
          <div className="container mx-auto">
            <div className="h-12 w-48 rounded-full bg-muted/80 animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="px-4 pb-12 pt-28 sm:px-6 sm:pt-32">
          <div className="container mx-auto max-w-2xl">
            <Card className="rounded-[2rem] border-border/70 bg-card/88">
              <CardContent className="px-8 py-10 text-center">
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  {t("authorization")}
                </Badge>
                <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em]">
                  {t("welcome")}
                </h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {t("describeIssue")}
                </p>
                <Button asChild className="mt-6 rounded-full px-6">
                  <Link href="/auth">{t("login")}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (user && !user.emailVerified) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="px-4 pb-12 pt-28 sm:px-6 sm:pt-32">
          <div className="container mx-auto max-w-2xl">
            <Card className="rounded-[2rem] border-border/70 bg-card/88">
              <CardContent className="px-8 py-10 text-center">
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  {t("emailVerifyTitle")}
                </Badge>
                <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em]">
                  {t("emailVerificationRequiredTitle")}
                </h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {t("emailVerificationRequiredProjectsBody")}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button asChild className="rounded-full px-6">
                    <Link href="/account">{t("emailVerificationGoToAccount")}</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full px-6">
                    <Link href="/support">{t("emailVerificationGoToSupport")}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_10%,hsl(var(--foreground)/0.08),transparent_28%),radial-gradient(circle_at_88%_12%,hsl(var(--foreground)/0.06),transparent_26%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.22)_48%,hsl(var(--background)))]">
      <Header />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.14)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.1)_1px,transparent_1px)] bg-[size:80px_80px] opacity-45 [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/30 to-transparent" />
      </div>

      <main className="relative w-full max-w-full overflow-x-hidden px-4 pb-14 pt-24 sm:px-6 sm:pb-16 sm:pt-28">
        <div className="container mx-auto max-w-7xl">
          <motion.section
            className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-background/78 p-5 shadow-[0_32px_100px_-72px_rgba(0,0,0,0.92)] backdrop-blur-xl sm:p-6"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(580px_circle_at_10%_0%,hsl(var(--foreground)/0.12),transparent_48%)]" />
            <div className="relative max-w-4xl">
              <h1 className="mt-4 max-w-4xl text-[clamp(2.75rem,5vw,5.6rem)] font-semibold leading-[0.92] tracking-[-0.055em]">
                {heroLead[language]}{" "}
                <TextMorph
                  words={heroWords[language]}
                  className="inline-flex text-foreground"
                  charClassName="tracking-[-0.055em]"
                />
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                {t("describeIssue")}
              </p>
            </div>
          </motion.section>

          <motion.form
            onSubmit={handleSubmit}
            className="mt-5 grid grid-flow-dense gap-4 xl:grid-cols-12"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.section
              style={glowStyle}
              onMouseMove={updateGlow}
              onMouseLeave={resetGlow}
              className="group relative xl:col-span-5"
            >
              <Card className="h-full rounded-[1.8rem] border-border/70 bg-card/84 shadow-[0_28px_86px_-62px_rgba(0,0,0,0.9)] backdrop-blur-xl before:pointer-events-none before:absolute before:inset-0 before:rounded-[1.8rem] before:bg-[radial-gradient(360px_circle_at_var(--glow-x)_var(--glow-y),rgba(255,255,255,0.16),transparent_44%)] before:opacity-0 before:transition-opacity before:duration-300 group-hover:before:opacity-100">
                <CardContent className="relative space-y-4 p-4 sm:p-5">
                  <div className="grid gap-3 sm:grid-cols-[1fr_0.72fr]">
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        <Type className="h-3.5 w-3.5" />
                        {t("projectTitleLabel")}
                      </label>
                      <Input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder={t("projectTitlePlaceholder")}
                        maxLength={80}
                        className="h-11 rounded-2xl border-border/70 bg-background/76 px-4 shadow-inner"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        <ListFilter className="h-3.5 w-3.5" />
                        {t("category")}
                      </label>
                      <Select
                        value={category}
                        onValueChange={(value) => setCategory(value as SuggestCategoryId)}
                      >
                        <SelectTrigger className="h-11 w-full rounded-2xl border-border/70 bg-background/76 px-4 shadow-inner">
                          <SelectValue placeholder={t("category")} />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {categoryOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      {t("description")}
                    </label>
                    <Textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder={t("describeYourIdea")}
                      className="min-h-[132px] rounded-[1.35rem] border-border/70 bg-background/76 px-4 py-3 shadow-inner"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[0.82fr_1fr]">
                    <div
                      onDrop={(event) => {
                        event.preventDefault();
                        setIsDragging(false);
                        addImages(Array.from(event.dataTransfer.files));
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      className={cn(
                        "flex min-h-32 flex-col items-center justify-center rounded-[1.35rem] border border-dashed bg-background/54 px-4 py-4 text-center shadow-inner transition",
                        isDragging
                          ? "border-foreground bg-foreground/5"
                          : "border-border hover:border-foreground/40",
                      )}
                    >
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {t("dragImagesOrSelect")}{" "}
                        <label className="cursor-pointer font-semibold text-foreground hover:underline">
                          {t("selectFiles")}
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(event) => {
                              addImages(Array.from(event.target.files || []));
                              event.currentTarget.value = "";
                            }}
                          />
                        </label>
                      </p>
                    </div>

                    <div className="min-h-32 rounded-[1.35rem] border border-border/60 bg-background/48 p-2 shadow-inner">
                      {images.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {images.slice(0, 6).map((image, index) => (
                            <div
                              key={image.id}
                              className="group relative aspect-square overflow-hidden rounded-xl border border-border/70"
                            >
                              <img
                                src={image.preview}
                                alt=""
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/85 text-background opacity-0 transition group-hover:opacity-100"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-full min-h-28 items-center justify-center rounded-xl border border-dashed border-border/60 text-center text-xs text-muted-foreground">
                          {t("photos")}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.section>

            <motion.section
              style={glowStyle}
              onMouseMove={updateGlow}
              onMouseLeave={resetGlow}
              className="group relative xl:col-span-7"
            >
              <Card className="h-full rounded-[1.8rem] border-border/70 bg-card/84 shadow-[0_28px_86px_-62px_rgba(0,0,0,0.9)] backdrop-blur-xl before:pointer-events-none before:absolute before:inset-0 before:rounded-[1.8rem] before:bg-[radial-gradient(420px_circle_at_var(--glow-x)_var(--glow-y),rgba(255,255,255,0.16),transparent_44%)] before:opacity-0 before:transition-opacity before:duration-300 group-hover:before:opacity-100">
                <CardContent className="relative p-3 sm:p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
                    <div>
                      <h2 className="text-xl font-semibold tracking-[-0.035em]">
                        {mapSectionTitle[language]}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {mapSelection
                          ? `${mapSelection[1].toFixed(5)}, ${mapSelection[0].toFixed(5)}`
                          : t("clickMapToMark")}
                      </p>
                    </div>
                    <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-semibold text-muted-foreground">
                      {selectedCity || t("city") || "Город"}
                    </span>
                  </div>
                  <MapLibreMap
                    className="min-h-[430px] overflow-hidden rounded-[1.45rem] border border-border/70 shadow-[0_24px_70px_-52px_rgba(0,0,0,0.76)]"
                    center={mapCenter}
                    markers={
                      mapSelection
                        ? [
                          {
                            id: "selection",
                            coordinates: mapSelection,
                            title: mapSectionDescription[language],
                          },
                        ]
                        : []
                    }
                    onMapClick={(coordinates) => setMapSelection(coordinates)}
                  />
                </CardContent>
              </Card>
            </motion.section>

            <motion.div
              className="xl:col-span-12"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: 0.12 }}
            >
              <div className="flex flex-col gap-3">
                {submitError ? (
                  <Alert
                    variant="destructive"
                    className="rounded-2xl border-destructive/30 px-3 py-2 text-xs"
                  >
                    <AlertTitle className="text-xs">{t("projectSubmitErrorGeneric")}</AlertTitle>
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                ) : null}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-14 w-full justify-center rounded-[1.4rem] text-base font-semibold shadow-[0_28px_72px_-32px_rgba(0,0,0,0.78)] transition-transform hover:-translate-y-0.5"
                >
                  {isSubmitting ? t("projectSubmitSending") : t("submitIdea")}
                </Button>
              </div>
            </motion.div>
          </motion.form>
        </div>
      </main>
    </div>
  );
}
