import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Accessibility,
  X,
  ZoomIn,
  ZoomOut,
  Contrast,
  Droplet,
  Link2,
  Type,
  Pause,
  MousePointer2,
  RotateCcw,
  AlignJustify,
} from "lucide-react";

const NAVY = "#051839";
const GOLD = "#AE842D";
const STORAGE_KEY = "a11y-settings-v1";

type Settings = {
  fontScale: number;
  contrast: boolean;
  grayscale: boolean;
  highlightLinks: boolean;
  readableFont: boolean;
  stopAnimations: boolean;
  bigCursor: boolean;
  spacing: boolean;
};

const DEFAULTS: Settings = {
  fontScale: 1,
  contrast: false,
  grayscale: false,
  highlightLinks: false,
  readableFont: false,
  stopAnimations: false,
  bigCursor: false,
  spacing: false,
};

const applySettings = (s: Settings) => {
  const root = document.documentElement;
  root.style.setProperty("--a11y-font-scale", String(s.fontScale));
  root.classList.toggle("a11y-font-scale", s.fontScale !== 1);
  root.classList.toggle("a11y-contrast", s.contrast);
  root.classList.toggle("a11y-grayscale", s.grayscale);
  root.classList.toggle("a11y-links", s.highlightLinks);
  root.classList.toggle("a11y-readable", s.readableFont);
  root.classList.toggle("a11y-no-anim", s.stopAnimations);
  root.classList.toggle("a11y-cursor", s.bigCursor);
  root.classList.toggle("a11y-spacing", s.spacing);
};

const AccessibilityWidget = () => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = { ...DEFAULTS, ...JSON.parse(raw) } as Settings;
        setSettings(parsed);
        applySettings(parsed);
        return;
      }
    } catch {
      /* ignore */
    }
    applySettings(DEFAULTS);
  }, []);

  const update = (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      applySettings(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const reset = () => {
    setSettings(DEFAULTS);
    applySettings(DEFAULTS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const toggles: { key: keyof Settings; label: string; icon: typeof Contrast }[] = [
    { key: "contrast", label: "ניגודיות גבוהה", icon: Contrast },
    { key: "grayscale", label: "גווני אפור", icon: Droplet },
    { key: "highlightLinks", label: "הדגשת קישורים", icon: Link2 },
    { key: "readableFont", label: "גופן קריא", icon: Type },
    { key: "spacing", label: "ריווח שורות", icon: AlignJustify },
    { key: "stopAnimations", label: "עצירת אנימציות", icon: Pause },
    { key: "bigCursor", label: "סמן גדול", icon: MousePointer2 },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="פתיחת תפריט נגישות"
        aria-expanded={open}
        className="fixed bottom-5 left-5 z-[9998] w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#AE842D]/40"
        style={{ background: NAVY }}
      >
        <Accessibility className="w-7 h-7" />
      </button>

      {open && (
        <div
          dir="rtl"
          role="dialog"
          aria-label="תפריט נגישות"
          className="fixed bottom-24 left-5 z-[9999] w-[300px] max-w-[calc(100vw-2.5rem)] rounded-[24px] bg-white p-5 shadow-2xl border"
          style={{ borderColor: `${GOLD}33` }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold" style={{ color: NAVY }}>
              תפריט נגישות
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="סגירת תפריט נגישות"
              className="p-1.5 rounded-full hover:bg-black/5"
              style={{ color: NAVY }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 mb-3 rounded-[16px] p-2" style={{ background: "#F5F5F5" }}>
            <button
              type="button"
              onClick={() => update({ fontScale: Math.max(0.9, +(settings.fontScale - 0.1).toFixed(2)) })}
              aria-label="הקטנת גודל טקסט"
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm"
              style={{ color: NAVY }}
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold" style={{ color: NAVY }}>
              גודל טקסט {Math.round(settings.fontScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => update({ fontScale: Math.min(1.6, +(settings.fontScale + 0.1).toFixed(2)) })}
              aria-label="הגדלת גודל טקסט"
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm"
              style={{ color: NAVY }}
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {toggles.map(({ key, label, icon: Icon }) => {
              const active = Boolean(settings[key]);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => update({ [key]: !active } as Partial<Settings>)}
                  aria-pressed={active}
                  className="flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm font-medium transition border text-right"
                  style={{
                    background: active ? GOLD : "#fff",
                    color: active ? "#fff" : NAVY,
                    borderColor: active ? GOLD : `${NAVY}1A`,
                  }}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={reset}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-[14px] py-2.5 text-sm font-bold text-white"
            style={{ background: NAVY }}
          >
            <RotateCcw className="w-4 h-4" />
            איפוס הגדרות
          </button>

          <Link
            to="/accessibility"
            onClick={() => setOpen(false)}
            className="mt-3 block text-center text-sm underline"
            style={{ color: GOLD }}
          >
            להצהרת הנגישות המלאה
          </Link>
        </div>
      )}
    </>
  );
};

export default AccessibilityWidget;
