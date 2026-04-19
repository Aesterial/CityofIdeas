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
  CheckCircle2,
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
  CardDescription,
  CardHeader,
  CardTitle,
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

const glowStyle = {
  "--glow-x": "50%",
  "--glow-y": "50%",
} as CSSProperties;

const updateGlow = (event: MouseEvent<HTMLDivElement>) => {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--glow-x", `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty("--glow-y", `${event.clientY - rect.top}px`);
};

const resetGlow = (event: MouseEvent<HTMLDivElement>) => {
  event.currentTarget.style.setProperty("--glow-x", "50%");
  event.currentTarget.style.setProperty("--glow-y", "50%");
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
  const [selectedCity, setSelectedCity] = useState<City>(getStoredCity());
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
    setSelectedCity(getStoredCity());
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
          `${t("projectTitleFallback")} ${selectedCity}`,
        description: trimmedDescription,
        category,
        location: {
          city: selectedCity,
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
    <div className="min-h-screen bg-background">
      <Header />

      <main className="overflow-hidden px-4 pb-16 pt-28 sm:px-6 sm:pt-32">
        <div className="container mx-auto">
          <div className="grid gap-8 xl:grid-cols-[0.88fr_1.12fr]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <Badge
                variant="outline"
                className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.24em]"
              >
                <MapPin className="h-3.5 w-3.5" />
                {selectedCity}
              </Badge>

              <h1 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-6xl">
                <span className="block">{heroLead[language]}</span>
                <span className="mt-2 block">
                  <TextMorph
                    words={heroWords[language]}
                    className="inline-flex text-foreground"
                    charClassName="tracking-[-0.05em]"
                  />
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                {t("describeIssue")}
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-3 xl:grid-cols-1">
                {[
                  t("projectTitleLabel"),
                  t("photos"),
                  t("markOnMap"),
                ].map((item, index) => (
                  <motion.div
                    key={item}
                    style={glowStyle}
                    onMouseMove={updateGlow}
                    onMouseLeave={resetGlow}
                    whileHover={{ y: -8 }}
                    className="group relative"
                  >
                    <Card className="rounded-[1.75rem] border-border/70 bg-card/86 before:pointer-events-none before:absolute before:inset-0 before:rounded-[1.75rem] before:bg-[radial-gradient(260px_circle_at_var(--glow-x)_var(--glow-y),rgba(255,255,255,0.18),transparent_42%)] before:opacity-0 before:transition-opacity before:duration-300 group-hover:before:opacity-100 dark:before:bg-[radial-gradient(260px_circle_at_var(--glow-x)_var(--glow-y),rgba(255,255,255,0.1),transparent_42%)]">
                      <CardContent className="relative flex items-center gap-3 px-5 py-5">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground text-background">
                          {index === 0 ? (
                            <Type className="h-4 w-4" />
                          ) : index === 1 ? (
                            <Camera className="h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{item}</p>
                          <p className="text-xs text-muted-foreground">
                            {index === 0
                              ? t("projectTitlePlaceholder")
                              : index === 1
                                ? t("dragImagesOrSelect")
                                : t("clickMapToMark")}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.form
              onSubmit={handleSubmit}
              className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
            >
              <motion.div
                style={glowStyle}
                onMouseMove={updateGlow}
                onMouseLeave={resetGlow}
                whileHover={{ y: -6 }}
                className="group relative"
              >
                <Card className="rounded-[2rem] border-border/70 bg-card/88 before:pointer-events-none before:absolute before:inset-0 before:rounded-[2rem] before:bg-[radial-gradient(340px_circle_at_var(--glow-x)_var(--glow-y),rgba(255,255,255,0.18),transparent_42%)] before:opacity-0 before:transition-opacity before:duration-300 group-hover:before:opacity-100 dark:before:bg-[radial-gradient(340px_circle_at_var(--glow-x)_var(--glow-y),rgba(255,255,255,0.1),transparent_44%)]">
                  <CardHeader className="relative px-6 pt-6">
                    <CardTitle className="text-2xl font-semibold tracking-[-0.03em]">
                      {t("suggestIdea")}
                    </CardTitle>
                    <CardDescription>{t("projectCityHint")}</CardDescription>
                  </CardHeader>
                  <CardContent className="relative space-y-5 px-6 pb-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("projectCityLabel")}</label>
                      <Input value={selectedCity} readOnly className="h-12 rounded-2xl px-4" />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <Type className="h-4 w-4" />
                        {t("projectTitleLabel")}
                      </label>
                      <Input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder={t("projectTitlePlaceholder")}
                        maxLength={80}
                        className="h-12 rounded-2xl px-4"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <ListFilter className="h-4 w-4" />
                        {t("category")}
                      </label>
                      <Select
                        value={category}
                        onValueChange={(value) => setCategory(value as SuggestCategoryId)}
                      >
                        <SelectTrigger className="h-12 w-full rounded-2xl px-4">
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

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4" />
                        {t("description")}
                      </label>
                      <Textarea
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder={t("describeYourIdea")}
                        className="min-h-[160px] rounded-[1.5rem] px-4 py-3"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <Camera className="h-4 w-4" />
                        {t("photos")}
                      </label>
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
                          "rounded-[1.75rem] border-2 border-dashed p-6 text-center transition",
                          isDragging
                            ? "border-foreground bg-foreground/5"
                            : "border-border hover:border-foreground/40",
                        )}
                      >
                        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-3 text-sm text-muted-foreground">
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

                      {images.length > 0 ? (
                        <div className="flex flex-wrap gap-3 pt-2">
                          {images.map((image, index) => (
                            <div
                              key={image.id}
                              className="group relative h-24 w-24 overflow-hidden rounded-2xl border border-border/70"
                            >
                              <img
                                src={image.preview}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-foreground/80 text-background opacity-0 transition group-hover:opacity-100"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <div className="space-y-6">
                <motion.div
                  style={glowStyle}
                  onMouseMove={updateGlow}
                  onMouseLeave={resetGlow}
                  whileHover={{ y: -6 }}
                  className="group relative"
                >
                  <Card className="rounded-[2rem] border-border/70 bg-card/88 before:pointer-events-none before:absolute before:inset-0 before:rounded-[2rem] before:bg-[radial-gradient(340px_circle_at_var(--glow-x)_var(--glow-y),rgba(255,255,255,0.18),transparent_42%)] before:opacity-0 before:transition-opacity before:duration-300 group-hover:before:opacity-100 dark:before:bg-[radial-gradient(340px_circle_at_var(--glow-x)_var(--glow-y),rgba(255,255,255,0.1),transparent_44%)]">
                    <CardHeader className="relative px-6 pt-6">
                      <CardTitle className="text-2xl font-semibold tracking-[-0.03em]">
                        {t("markOnMap")}
                      </CardTitle>
                      <CardDescription>
                        {mapSelection
                          ? `${t("mapSelectedCoordinates")}: ${mapSelection[1].toFixed(5)}, ${mapSelection[0].toFixed(5)}`
                          : t("clickMapToMark")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative space-y-4 px-6 pb-6">
                      <MapLibreMap
                        className="min-h-[320px]"
                        center={mapCenter}
                        markers={
                          mapSelection
                            ? [
                                {
                                  id: "selection",
                                  coordinates: mapSelection,
                                  title: t("markOnMap"),
                                },
                              ]
                            : []
                        }
                        onMapClick={(coordinates) => setMapSelection(coordinates)}
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Card className="rounded-[1.5rem] border-border/70 bg-background/60">
                          <CardContent className="px-5 py-5">
                            <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                              {t("projectCityLabel")}
                            </p>
                            <p className="mt-2 text-lg font-semibold">{selectedCity}</p>
                          </CardContent>
                        </Card>
                        <Card className="rounded-[1.5rem] border-border/70 bg-background/60">
                          <CardContent className="px-5 py-5">
                            <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                              {t("photos")}
                            </p>
                            <p className="mt-2 text-lg font-semibold">{images.length}</p>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {submitError ? (
                  <Alert
                    variant="destructive"
                    className="rounded-[1.75rem] border-destructive/30"
                  >
                    <AlertTitle>{t("projectSubmitErrorGeneric")}</AlertTitle>
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                ) : null}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-14 w-full rounded-full text-base shadow-[0_22px_48px_-28px_rgba(0,0,0,0.55)]"
                >
                  {isSubmitting ? t("projectSubmitSending") : t("submitIdea")}
                </Button>
              </div>
            </motion.form>
          </div>
        </div>
      </main>
    </div>
  );
}
