import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";
import { ArrowLeft, Copy, Check, Download, PlayCircle } from "lucide-react";
import { useState } from "react";
// @ts-ignore - vite raw import
import mdContent from "@/content/partner-api.md?raw";
import logoAsset from "@/assets/logo.png.asset.json";

export default function PartnerApiDocs() {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "giftkal-partner-api.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#f7f5f0]" dir="rtl">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-[#051839]/95 backdrop-blur text-white border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoAsset.url} alt="Giftkal" className="h-9 w-auto" />
            <span className="text-sm text-white/70 hidden sm:inline">Partner API Documentation</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/docs/partner-api-explorer"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-sm transition"
            >
              <PlayCircle className="w-4 h-4" />
              Try it (Swagger)
            </Link>
            <button
              onClick={copyLink}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-sm transition"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "הועתק" : "העתק קישור"}
            </button>
            <button
              onClick={download}
              className="flex items-center gap-2 bg-[#95742F] hover:bg-[#7d621f] px-3 py-2 rounded-lg text-sm transition"
            >
              <Download className="w-4 h-4" />
              הורד .md
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12" dir="rtl">
        <article className="prose prose-slate max-w-none bg-white rounded-2xl shadow-sm p-8 md:p-12
          prose-headings:text-[#051839]
          prose-h1:text-4xl prose-h1:font-bold prose-h1:mb-2
          prose-h2:text-2xl prose-h2:mt-10 prose-h2:pb-2 prose-h2:border-b prose-h2:border-slate-200
          prose-h3:text-lg prose-h3:mt-6
          prose-a:text-[#95742F] hover:prose-a:underline
          prose-code:text-[#c41e3a] prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-[#0b1a33] prose-pre:text-slate-100 prose-pre:rounded-xl prose-pre:text-sm
          prose-table:text-sm prose-th:bg-slate-100 prose-th:text-[#051839] prose-td:align-top
          prose-hr:my-10">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{mdContent}</ReactMarkdown>
        </article>

        <footer className="text-center text-sm text-slate-500 mt-8">
          © Giftkal · <a href="mailto:support@giftkal.com" className="text-[#95742F] hover:underline">support@giftkal.com</a>
        </footer>
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
