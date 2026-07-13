import { Link } from "react-router-dom";

export default function ClosingCTA({
  title = "מוכנים לפתוח אירוע?",
  subtitle = "199 ₪ לאירוע, ללא הפתעות ובלי עלויות נסתרות.",
  primary = { label: "פתחו אירוע עכשיו ←", to: "/signup" },
  secondary = { label: "דברו איתנו", to: "/contact" },
}: {
  title?: string;
  subtitle?: string;
  primary?: { label: string; to: string };
  secondary?: { label: string; to: string };
}) {
  return (
    <section className="max-w-[1440px] mx-auto px-3 md:px-6 pb-16">
      <div className="rounded-[30px] bg-[#051839] text-white px-6 md:px-16 py-14 lg:py-16 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="text-right flex-1">
          <h2 className="text-[28px] lg:text-[36px] font-extrabold">{title}</h2>
          <p className="mt-3 text-white/80 font-light text-[16px] lg:text-[18px]">{subtitle}</p>
        </div>
        <div className="flex gap-3 flex-wrap justify-end">
          <Link
            to={secondary.to}
            className="rounded-[12px] border-2 border-white/40 text-white px-6 py-3.5 font-semibold hover:bg-white/10 transition"
          >
            {secondary.label}
          </Link>
          <Link
            to={primary.to}
            className="rounded-[12px] bg-[#AE842D] hover:opacity-90 transition text-white px-8 py-3.5 font-bold"
          >
            {primary.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
