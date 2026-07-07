import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen } from "lucide-react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import logoAsset from "@/assets/logo.png.asset.json";

export default function PartnerApiExplorer() {
  const [spec, setSpec] = useState<string | null>(null);

  useEffect(() => {
    fetch("/partner-api.openapi.yaml")
      .then((r) => r.text())
      .then(setSpec)
      .catch(() => setSpec(null));
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f5f0]">
      <header className="sticky top-0 z-40 bg-[#051839]/95 backdrop-blur text-white border-b border-white/10" dir="rtl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoAsset.url} alt="Giftkal" className="h-9 w-auto" />
            <span className="text-sm text-white/70 hidden sm:inline">Partner API Explorer</span>
          </Link>
          <Link
            to="/docs/partner-api"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-sm transition"
          >
            <BookOpen className="w-4 h-4" />
            למסמך המלא
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6">
          {spec ? (
            <SwaggerUI spec={spec} docExpansion="list" defaultModelsExpandDepth={1} tryItOutEnabled />
          ) : (
            <div className="text-center text-slate-500 py-16" dir="rtl">טוען מפרט…</div>
          )}
        </div>
      </main>

      <Link
        to="/"
        className="fixed bottom-6 left-6 bg-[#051839] text-white p-3 rounded-full shadow-lg hover:bg-[#0a2555] transition"
        aria-label="חזרה"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>
    </div>
  );
}
