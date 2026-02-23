"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import SiteHeader from "@/components/site/SiteHeader";
import { supabase } from "@/lib/supabase";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 w-full items-center justify-center rounded-xl bg-white/5">
      <span className="text-sm text-white/30">Laster kart…</span>
    </div>
  ),
});

// ─── Types ─────────────────────────────────────────────────────────────────

type Mode = "photo" | "video" | null;
type VideoInputState = "options" | "camera" | "selected";
type LocationState = "options" | "gps" | "map";
type LocationData = { lat: number; lng: number; method: "gps" | "manual" };

// ─── Constants ──────────────────────────────────────────────────────────────

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;  // 10 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;  // 50 MB
const MIN_RECORD_S = 5;
const MAX_RECORD_S = 10;

const COMPASS_DIRS = ["N", "NØ", "Ø", "SØ", "S", "SV", "V", "NV"];
const SEA_STATES = [
  { value: "rolig", label: "Rolig havflate" },
  { value: "smaa", label: "Små bølger" },
  { value: "store", label: "Større bølger" },
  { value: "vanskelig", label: "Vanskelig å se" },
];
const DIRECTIONS = [
  { value: "N", label: "N – Nord" },
  { value: "NØ", label: "NØ – Nordøst" },
  { value: "Ø", label: "Ø – Øst" },
  { value: "SØ", label: "SØ – Sørøst" },
  { value: "S", label: "S – Sør" },
  { value: "SV", label: "SV – Sørvest" },
  { value: "V", label: "V – Vest" },
  { value: "NV", label: "NV – Nordvest" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Opplasting feilet (${xhr.status})`));
    });
    xhr.addEventListener("error", () => reject(new Error("Opplasting feilet")));
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.send(file);
  });
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); resolve(v.duration); };
    v.onerror = () => { URL.revokeObjectURL(v.src); reject(new Error("Kunne ikke lese video")); };
    v.src = URL.createObjectURL(file);
  });
}

function headingToDir(h: number) {
  return COMPASS_DIRS[Math.round(((h % 360) + 360) % 360 / 45) % 8];
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ObservasjonerPage() {
  // Mode
  const [mode, setMode] = useState<Mode>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  // Video
  const [videoInputState, setVideoInputState] = useState<VideoInputState>("options");
  const [capturedVideoFile, setCapturedVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Location
  const [locationState, setLocationState] = useState<LocationState>("options");
  const [location, setLocation] = useState<LocationData | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Form fields
  const [displayName, setDisplayName] = useState("");
  const [comment, setComment] = useState("");
  const [seaState, setSeaState] = useState("");
  const [windDir, setWindDir] = useState("");
  const [waveDir, setWaveDir] = useState("");
  const [consent, setConsent] = useState(false);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [submitPhase, setSubmitPhase] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Compass
  const [compassTarget, setCompassTarget] = useState<"wind" | "wave" | null>(null);
  const [compassHeading, setCompassHeading] = useState(0);
  const [compassReady, setCompassReady] = useState(false);
  const [compassStatusText, setCompassStatusText] = useState("Initialiserer kompass…");

  // Refs
  const cameraPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStartRef = useRef(0);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const compassHandlerRef = useRef<EventListener | null>(null);

  // ── Load logged-in username ──────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const meta = data.user?.user_metadata?.username as string | undefined;
      if (mounted) setUserName(meta ?? null);
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // ── Cleanup media on unmount ─────────────────────────────────────────────

  useEffect(() => {
    return () => {
      stopCamera();
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Camera ─────────────────────────────────────────────────────────────

  async function startCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (cameraPreviewRef.current) cameraPreviewRef.current.srcObject = stream;
      setVideoInputState("camera");
    } catch {
      setCameraError(
        "Kunne ikke starte kamera. Sjekk at du har gitt nettleseren tilgang."
      );
    }
  }

  function startRecording() {
    if (!mediaStreamRef.current) return;
    recordedChunksRef.current = [];

    const mimeTypes = [
      "video/mp4;codecs=h264",
      "video/webm;codecs=h264",
      "video/webm;codecs=vp9",
      "video/webm",
      "video/mp4",
    ];
    let mime = "";
    for (const m of mimeTypes) {
      if (MediaRecorder.isTypeSupported(m)) { mime = m; break; }
    }

    try {
      const opts: MediaRecorderOptions = { videoBitsPerSecond: 8_000_000 };
      if (mime) opts.mimeType = mime;
      mediaRecorderRef.current = new MediaRecorder(mediaStreamRef.current, opts);
    } catch {
      mediaRecorderRef.current = new MediaRecorder(mediaStreamRef.current);
    }

    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    mediaRecorderRef.current.onstop = processRecording;
    mediaRecorderRef.current.start(100);
    recordingStartRef.current = Date.now();
    setIsRecording(true);
    setRecordingTime(0);

    recordingTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - recordingStartRef.current) / 1000;
      setRecordingTime(elapsed);
      if (elapsed >= MAX_RECORD_S) stopRecording();
    }, 100);
  }

  function stopRecording() {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    const elapsed = recordingStartRef.current
      ? (Date.now() - recordingStartRef.current) / 1000
      : 0;

    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
    setIsRecording(false);
    setRecordingTime(0);

    if (elapsed < MIN_RECORD_S) {
      setCameraError(`For kort (minimum ${MIN_RECORD_S} sek). Prøv igjen.`);
      recordedChunksRef.current = [];
    }
  }

  function processRecording() {
    if (recordedChunksRef.current.length === 0) return;
    const mimeType = mediaRecorderRef.current?.mimeType || "video/webm";
    const blob = new Blob(recordedChunksRef.current, { type: mimeType });
    const ext = mimeType.includes("mp4") ? "mp4" : "webm";
    const file = new File([blob], `opptak.${ext}`, { type: mimeType });
    stopCamera();
    attachVideoFile(file);
  }

  function stopCamera() {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    if (cameraPreviewRef.current) cameraPreviewRef.current.srcObject = null;
    setIsRecording(false);
    setRecordingTime(0);
  }

  function attachVideoFile(file: File) {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setCapturedVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    setVideoInputState("selected");
  }

  function clearVideo() {
    stopCamera();
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setCapturedVideoFile(null);
    setVideoPreviewUrl(null);
    setVideoInputState("options");
    setCameraError(null);
    if (videoFileInputRef.current) videoFileInputRef.current.value = "";
  }

  // ─── Photo ──────────────────────────────────────────────────────────────

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  }

  function clearPhoto() {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
  }

  // ─── GPS ────────────────────────────────────────────────────────────────

  async function handleUseGPS() {
    if (!navigator.geolocation) {
      alert("GPS er ikke tilgjengelig i denne nettleseren.");
      return;
    }
    setGpsLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, {
          enableHighAccuracy: true,
          timeout: 10000,
        })
      );
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, method: "gps" });
      setLocationState("gps");
    } catch {
      alert("Kunne ikke hente GPS-posisjon. Velg på kart i stedet.");
    } finally {
      setGpsLoading(false);
    }
  }

  // ─── Compass ────────────────────────────────────────────────────────────

  function openCompass(target: "wind" | "wave") {
    setCompassTarget(target);
    setCompassHeading(0);
    setCompassReady(false);
    setCompassStatusText("Initialiserer kompass…");

    if (!window.DeviceOrientationEvent) {
      setCompassStatusText("⚠️ Kompass støttes ikke på denne enheten.");
      return;
    }

    const DOE = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };

    if (typeof DOE.requestPermission === "function") {
      setCompassStatusText("Trykk «Tillat» for å aktivere kompasset.");
      DOE.requestPermission()
        .then((state) => {
          if (state === "granted") activateCompass();
          else setCompassStatusText("⚠️ Tillatelse avslått.");
        })
        .catch(() => setCompassStatusText("⚠️ Kunne ikke aktivere kompass."));
    } else {
      activateCompass();
    }
  }

  function activateCompass() {
    setCompassStatusText("Pek telefonen dit du vil måle retningen.");
    setCompassReady(true);

    const handler = (e: DeviceOrientationEvent) => {
      const ext = e as DeviceOrientationEvent & { webkitCompassHeading?: number };
      let h: number | null = null;
      if (e.absolute && e.alpha !== null) h = (360 - e.alpha + 360) % 360;
      else if (ext.webkitCompassHeading !== undefined) h = ext.webkitCompassHeading;
      else if (e.alpha !== null) h = (360 - e.alpha + 360) % 360;
      if (h !== null) setCompassHeading(Math.round(h));
    };

    compassHandlerRef.current = handler as EventListener;
    window.addEventListener("deviceorientationabsolute", handler as EventListener, true);
    window.addEventListener("deviceorientation", handler as EventListener, true);
  }

  function confirmCompass() {
    const val = `${headingToDir(compassHeading)} (${compassHeading}°)`;
    if (compassTarget === "wind") setWindDir(val);
    else if (compassTarget === "wave") setWaveDir(val);
    closeCompass();
  }

  function closeCompass() {
    if (compassHandlerRef.current) {
      window.removeEventListener(
        "deviceorientationabsolute",
        compassHandlerRef.current,
        true
      );
      window.removeEventListener(
        "deviceorientation",
        compassHandlerRef.current,
        true
      );
      compassHandlerRef.current = null;
    }
    setCompassTarget(null);
    setCompassReady(false);
    setCompassHeading(0);
  }

  // ─── Reset ──────────────────────────────────────────────────────────────

  function resetAll() {
    clearPhoto();
    clearVideo();
    setMode(null);
    setLocation(null);
    setLocationState("options");
    setDisplayName("");
    setComment("");
    setSeaState("");
    setWindDir("");
    setWaveDir("");
    setConsent(false);
    setMessage(null);
    setUploadProgress(null);
    setSubmitPhase("");
  }

  // ─── Submit ─────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const isVideo = mode === "video";
    const file = isVideo ? capturedVideoFile : photoFile;

    if (!file) {
      setMessage({
        type: "error",
        text: isVideo ? "Du må ta opp eller velge en video." : "Du må velge et bilde.",
      });
      return;
    }
    if (!isVideo && file.size > MAX_PHOTO_BYTES) {
      setMessage({ type: "error", text: "Bildet er for stort (maks 10 MB)." });
      return;
    }
    if (isVideo && file.size > MAX_VIDEO_BYTES) {
      setMessage({ type: "error", text: "Videoen er for stor (maks 50 MB)." });
      return;
    }
    if (!location) {
      setMessage({ type: "error", text: "Du må oppgi en posisjon." });
      return;
    }
    if (!consent) {
      setMessage({ type: "error", text: "Du må bekrefte personvernerklæringen." });
      return;
    }

    if (isVideo) {
      try {
        const dur = await getVideoDuration(file);
        // MediaRecorder WebM files often report Infinity — skip check in that case
        if (isFinite(dur)) {
          if (dur < MIN_RECORD_S) {
            setMessage({ type: "error", text: `Videoen er for kort (minimum ${MIN_RECORD_S} sek).` });
            return;
          }
          if (dur > MAX_RECORD_S + 1) {
            setMessage({ type: "error", text: `Videoen er for lang (maks ${MAX_RECORD_S} sek).` });
            return;
          }
        }
      } catch {
        // if duration check fails, proceed
      }
    }

    setSubmitting(true);
    setUploadProgress(0);

    try {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const safeName = file.name.replace(/\s+/g, "-");
      const path = `submissions/${id}/${safeName}`;

      setSubmitPhase("Klargjør opplasting…");
      const signRes = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, contentType: file.type || "application/octet-stream" }),
      });
      if (!signRes.ok) {
        const err = await signRes.json();
        throw new Error(err.error || "Kunne ikke starte opplasting.");
      }
      const { uploadUrl } = await signRes.json();

      setSubmitPhase(isVideo ? "Laster opp video…" : "Laster opp bilde…");
      await uploadWithProgress(uploadUrl, file, setUploadProgress);

      setSubmitPhase("Lagrer observasjon…");
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const submitRes = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          level: isVideo ? 2 : 1,
          media_type: mode,
          media_path_original: path,
          display_name: userName || displayName || null,
          comment: comment || null,
          valg: seaState || null,
          wind_dir: windDir || null,
          wave_dir: waveDir || null,
          lat: location.lat,
          lng: location.lng,
          location_method: location.method,
          is_public: true,
        }),
      });
      if (!submitRes.ok) {
        const err = await submitRes.json();
        throw new Error(err.error || "Kunne ikke lagre innsending.");
      }

      setMessage({
        type: "success",
        text: "Takk! Din observasjon er registrert og vil snart vises på kartet.",
      });
      setSubmitPhase("");
      setUploadProgress(null);
      setTimeout(resetAll, 4000);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Noe gikk galt. Prøv igjen.",
      });
      setSubmitPhase("");
      setUploadProgress(null);
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Derived ─────────────────────────────────────────────────────────────

  const progressPct = recordingTime / MAX_RECORD_S;
  const isWarning = recordingTime >= MAX_RECORD_S - 2;
  const compassDir = headingToDir(compassHeading);

  // ─── Shared class strings ────────────────────────────────────────────────

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10";
  const selectCls = inputCls + " [color-scheme:dark]";
  const sectionCls = "rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5";
  const labelCls = "block mb-2 text-sm font-semibold text-white/60";
  const locationBtnBase =
    "flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition";

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#050916] text-white">
      <SiteHeader variant="dark" />

      <main className="mx-auto max-w-xl px-4 pb-24 pt-12">
        {/* ── Page heading ── */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-400">
            Kystobservatørene
          </p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-tight md:text-5xl">
            Send inn
          </h1>
          <p className="mt-3 text-base text-white/50">
            Del observasjoner av havflaten. Du trenger ikke konto, men
            registrerte brukere tjener badges og kan følge bidragene sine.
          </p>
        </div>

        {/* ── Notices ── */}
        <div className="mb-8 space-y-3">
          <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.08] px-4 py-3 text-sm text-blue-300">
            <span className="mt-0.5 shrink-0">🗺️</span>
            <span>
              Bilder og videoer du sender inn vises automatisk på det offentlige
              kartet.
            </span>
          </div>

          {userName ? (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-300">
              <span className="shrink-0">👤</span>
              <span>
                Logget inn som{" "}
                <strong className="text-emerald-200">{userName}</strong> —
                bidragene dine spores automatisk.
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm">
              <span className="text-white/40">
                Registrer deg for å spore bidrag og tjene badges
              </span>
              <a
                href="/login"
                className="font-semibold text-blue-400 transition hover:text-blue-300"
              >
                Logg inn →
              </a>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════
            STEP 1 — Type selection
        ══════════════════════════════════════════════ */}
        {!mode && (
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-white/30">
              Velg type observasjon
            </p>
            <div className="grid grid-cols-2 gap-4">
              {(
                [
                  { type: "photo", icon: "📸", label: "Bilde", sub: "Stillbilde av havflaten" },
                  { type: "video", icon: "🎥", label: "Video", sub: "5–10 sekunders klipp" },
                ] as const
              ).map(({ type, icon, label, sub }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMode(type)}
                  className="group flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 text-center transition-all hover:border-blue-500/40 hover:bg-blue-500/[0.07] active:scale-[0.98]"
                >
                  <span className="text-5xl transition-transform group-hover:scale-110">
                    {icon}
                  </span>
                  <div>
                    <div className="text-lg font-bold">{label}</div>
                    <div className="mt-1 text-xs text-white/40">{sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            STEP 2 — Form (photo or video)
        ══════════════════════════════════════════════ */}
        {mode && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {mode === "photo" ? "Last opp bilde" : "Last opp video"}
              </h2>
              <button
                type="button"
                onClick={() => { if (mode === "video") stopCamera(); resetAll(); }}
                className="text-sm text-white/40 transition hover:text-white/70"
              >
                ← Tilbake
              </button>
            </div>

            {/* ── PHOTO: file upload ── */}
            {mode === "photo" && (
              <div className={sectionCls}>
                <p className="mb-3 text-sm font-semibold text-white/60">Bilde</p>

                {!photoFile ? (
                  <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/[0.03] transition hover:border-blue-500/40 hover:bg-blue-500/[0.05]">
                    <span className="text-3xl">📷</span>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white/70">
                        Trykk for å velge bilde
                      </p>
                      <p className="mt-1 text-xs text-white/30">
                        Maks 10 MB · JPG, PNG, HEIC · Mobil kan bruke kamera direkte
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </label>
                ) : (
                  <div className="space-y-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoPreviewUrl!}
                      alt="Forhåndsvisning"
                      className="max-h-64 w-full rounded-xl object-cover"
                    />
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white/80">
                          {photoFile.name}
                        </p>
                        <p className="text-xs text-white/40">
                          {formatSize(photoFile.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={clearPhoto}
                        className="ml-3 shrink-0 rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20"
                      >
                        Fjern
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── VIDEO: camera + gallery ── */}
            {mode === "video" && (
              <div className={sectionCls}>
                <p className="mb-3 text-sm font-semibold text-white/60">
                  Video (5–10 sekunder)
                </p>

                {/* Options state */}
                {videoInputState === "options" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-5 text-sm font-semibold transition hover:border-blue-500/40 hover:bg-blue-500/[0.07]"
                      >
                        <span className="text-3xl">📷</span>
                        Film nå
                      </button>
                      <button
                        type="button"
                        onClick={() => videoFileInputRef.current?.click()}
                        className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-5 text-sm font-semibold transition hover:border-blue-500/40 hover:bg-blue-500/[0.07]"
                      >
                        <span className="text-3xl">🖼️</span>
                        Fra galleri
                      </button>
                    </div>
                    {cameraError && (
                      <p className="rounded-xl border border-rose-500/20 bg-rose-500/[0.08] px-4 py-3 text-sm text-rose-300">
                        ⚠️ {cameraError}
                      </p>
                    )}
                    <input
                      ref={videoFileInputRef}
                      type="file"
                      accept="video/mp4,video/quicktime,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) attachVideoFile(f);
                      }}
                    />
                  </div>
                )}

                {/* Camera recording state */}
                {videoInputState === "camera" && (
                  <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
                    <video
                      ref={cameraPreviewRef}
                      autoPlay
                      playsInline
                      muted
                      className="block max-h-[340px] w-full object-cover"
                    />
                    {/* Progress bar */}
                    <div className="h-1 w-full bg-white/10">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${Math.min(progressPct * 100, 100)}%`,
                          backgroundColor: isWarning ? "#ef4444" : "#3b82f6",
                        }}
                      />
                    </div>
                    {/* Controls */}
                    <div className="flex items-center justify-between gap-4 bg-black/80 px-5 py-4">
                      <div className="text-sm text-white/50">
                        {isRecording ? "Tar opp…" : "Klar"}
                      </div>
                      <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-white"
                        style={{
                          background: isRecording ? "#ef4444" : "#ef4444",
                          animation: isRecording
                            ? "ko-pulse 1s infinite"
                            : undefined,
                        }}
                      >
                        {isRecording && (
                          <span className="block h-5 w-5 rounded-sm bg-white" />
                        )}
                      </button>
                      <div
                        className="min-w-[48px] text-right text-lg font-bold tabular-nums"
                        style={{ color: isWarning ? "#ef4444" : "#fff" }}
                      >
                        {recordingTime.toFixed(1)}s
                      </div>
                    </div>
                    {cameraError && (
                      <p className="border-t border-white/10 px-4 py-3 text-sm text-rose-300">
                        ⚠️ {cameraError}
                      </p>
                    )}
                  </div>
                )}

                {/* Selected/recorded video state */}
                {videoInputState === "selected" && capturedVideoFile && (
                  <div className="space-y-3">
                    {videoPreviewUrl && (
                      <video
                        src={videoPreviewUrl}
                        controls
                        playsInline
                        preload="metadata"
                        className="max-h-64 w-full rounded-xl bg-black"
                      />
                    )}
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white/80">
                          {capturedVideoFile.name}
                        </p>
                        <p className="text-xs text-white/40">
                          {formatSize(capturedVideoFile.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={clearVideo}
                        className="ml-3 shrink-0 rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20"
                      >
                        Fjern
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── LOCATION ── */}
            <div className={sectionCls}>
              <p className="mb-3 text-sm font-semibold text-white/60">
                {mode === "photo" ? "Hvor tok du bildet?" : "Hvor tok du videoen?"}
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={gpsLoading}
                  onClick={handleUseGPS}
                  className={`${locationBtnBase} ${
                    locationState === "gps"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                      : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {gpsLoading ? (
                    <span className="text-xs">Henter…</span>
                  ) : (
                    <>📍 Min posisjon</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setLocationState("map")}
                  className={`${locationBtnBase} ${
                    locationState === "map"
                      ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
                      : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:text-white"
                  }`}
                >
                  🗺️ Velg på kart
                </button>
              </div>

              {/* GPS success */}
              {locationState === "gps" && location && (
                <p className="mt-3 text-sm text-emerald-400">
                  ✓ GPS-posisjon hentet:{" "}
                  <span className="font-mono text-xs text-white/50">
                    {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                  </span>
                </p>
              )}

              {/* Map */}
              {locationState === "map" && (
                <div className="mt-3 space-y-2">
                  <LocationPicker
                    onLocationSelect={(lat, lng) =>
                      setLocation({ lat, lng, method: "manual" })
                    }
                  />
                  {location ? (
                    <p className="text-sm text-emerald-400">
                      ✓ Posisjon valgt:{" "}
                      <span className="font-mono text-xs text-white/50">
                        {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                      </span>
                    </p>
                  ) : (
                    <p className="text-xs text-white/30">
                      Klikk på kartet for å merke posisjonen
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── VIDEO-ONLY: extra metadata ── */}
            {mode === "video" && (
              <>
                {/* Comment */}
                <div className={sectionCls}>
                  <label className={labelCls} htmlFor="ko-comment">
                    Kommentar (valgfritt)
                  </label>
                  <textarea
                    id="ko-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Kort beskrivelse av forholdene…"
                    rows={3}
                    className={inputCls + " resize-none"}
                  />
                </div>

                {/* Sea state */}
                <div className={sectionCls}>
                  <label className={labelCls} htmlFor="ko-sea-state">
                    Havflate
                  </label>
                  <select
                    id="ko-sea-state"
                    value={seaState}
                    onChange={(e) => setSeaState(e.target.value)}
                    className={selectCls}
                  >
                    <option value="" style={{ color: "#111827", background: "#fff" }}>Velg…</option>
                    {SEA_STATES.map((s) => (
                      <option key={s.value} value={s.value} style={{ color: "#111827", background: "#fff" }}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Wind + Wave direction */}
                <div className={sectionCls}>
                  <p className="mb-4 text-sm font-semibold text-white/60">
                    Retninger (valgfritt)
                  </p>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {(
                      [
                        {
                          id: "wind",
                          label: "Vindretning",
                          value: windDir,
                          set: setWindDir,
                        },
                        {
                          id: "wave",
                          label: "Bølgeretning",
                          value: waveDir,
                          set: setWaveDir,
                        },
                      ] as const
                    ).map(({ id, label, value, set }) => (
                      <div key={id}>
                        <label className={labelCls}>{label}</label>
                        <div className="mb-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => openCompass(id)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-sm font-semibold transition hover:border-blue-500/40 hover:bg-blue-500/[0.07]"
                          >
                            🧭 Kompass
                          </button>
                          {value && (
                            <div className="flex items-center rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] px-3 text-sm font-bold text-emerald-300">
                              {value}
                            </div>
                          )}
                        </div>
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) set(e.target.value);
                            e.target.value = "";
                          }}
                          className={selectCls + " text-white/40"}
                        >
                          <option value="" style={{ color: "#111827", background: "#fff" }}>Eller velg manuelt…</option>
                          {DIRECTIONS.map((d) => (
                            <option key={d.value} value={d.value} style={{ color: "#111827", background: "#fff" }}>
                              {d.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── Name field (if not logged in) ── */}
            {!userName && (
              <div className={sectionCls}>
                <label className={labelCls} htmlFor="ko-name">
                  Ditt navn (valgfritt)
                </label>
                <input
                  id="ko-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="F.eks. Ola Nordmann"
                  className={inputCls}
                />
              </div>
            )}

            {/* ── Consent ── */}
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 transition hover:border-white/[0.12]">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-blue-500"
              />
              <span className="text-sm text-white/50">
                Jeg bekrefter at jeg har lest og forstått{" "}
                <a
                  href="/personvernserklaring"
                  target="_blank"
                  className="font-semibold text-blue-400 underline hover:text-blue-300"
                >
                  personvernerklæringen
                </a>
                .
              </span>
            </label>

            {/* ── Message ── */}
            {message && (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  message.type === "success"
                    ? "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300"
                    : "border-rose-500/20 bg-rose-500/[0.08] text-rose-300"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* ── Submit ── */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={submitting}
                className="relative w-full overflow-hidden rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {/* Upload progress bar */}
                {uploadProgress !== null && (
                  <span
                    className="absolute inset-y-0 left-0 bg-blue-400/30 transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                )}
                <span className="relative">
                  {submitting
                    ? submitPhase || "Sender…"
                    : mode === "photo"
                    ? "Send inn bilde"
                    : "Send inn video"}
                  {uploadProgress !== null && ` (${uploadProgress}%)`}
                </span>
              </button>

              {submitting && uploadProgress !== null && (
                <p className="text-center text-xs text-white/30">
                  {uploadProgress < 100
                    ? `Laster opp… ${uploadProgress}%`
                    : "Ferdig opplastet — lagrer…"}
                </p>
              )}
            </div>
          </form>
        )}
      </main>

      {/* ══════════════════════════════════════════════
          COMPASS MODAL
      ══════════════════════════════════════════════ */}
      {compassTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCompass();
          }}
        >
          <div className="w-full max-w-sm rounded-3xl border border-white/[0.1] bg-[#0a1628] p-7 shadow-2xl">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold">
                {compassTarget === "wind" ? "Vindretning" : "Bølgeretning"}
              </h3>
              <button
                type="button"
                onClick={closeCompass}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/60 transition hover:bg-white/20 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Compass rose */}
            <div className="relative mx-auto mb-6 h-60 w-60">
              {/* Ring */}
              <div className="h-full w-full rounded-full border border-white/[0.1] bg-white/[0.03]">
                {/* Cardinals */}
                {[
                  { label: "N", cls: "top-2 left-1/2 -translate-x-1/2 text-red-400" },
                  { label: "S", cls: "bottom-2 left-1/2 -translate-x-1/2" },
                  { label: "Ø", cls: "right-3 top-1/2 -translate-y-1/2" },
                  { label: "V", cls: "left-3 top-1/2 -translate-y-1/2" },
                ].map(({ label, cls }) => (
                  <span
                    key={label}
                    className={`absolute text-sm font-bold text-white/60 ${cls}`}
                  >
                    {label}
                  </span>
                ))}

                {/* SVG needle */}
                <svg
                  viewBox="0 0 100 100"
                  className="absolute inset-0 h-full w-full"
                  style={{ transform: `rotate(${compassHeading}deg)` }}
                >
                  <polygon points="50,8 44,50 56,50" fill="#ef4444" />
                  <polygon points="50,92 44,50 56,50" fill="#64748b" />
                  <circle cx="50" cy="50" r="5" fill="#fff" />
                </svg>
              </div>
            </div>

            {/* Reading */}
            <div className="mb-4 text-center">
              <div className="text-4xl font-black tracking-tight">
                {compassDir}
              </div>
              <div className="mt-1 text-lg text-white/40">{compassHeading}°</div>
            </div>

            {/* Status */}
            <p
              className={`mb-4 rounded-xl px-4 py-2.5 text-center text-sm ${
                compassReady
                  ? "border border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300"
                  : "border border-white/[0.07] bg-white/[0.03] text-white/40"
              }`}
            >
              {compassStatusText}
            </p>

            {compassReady && (
              <button
                type="button"
                onClick={confirmCompass}
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
              >
                Bekreft {compassDir} ({compassHeading}°)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Recording pulse animation */}
      <style>{`
        @keyframes ko-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.6); }
          50%        { box-shadow: 0 0 0 10px rgba(239,68,68,0); }
        }
      `}</style>
    </div>
  );
}
