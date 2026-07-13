import { Link } from "react-router-dom";

const NAVY = "#051839";
const GOLD = "#AE842D";

interface Props {
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  imageAlt: string;
  primaryCta?: { label: string; to: string };
  secondaryCta?: { label: string; to: string };
  imageContain?: boolean;
}

export default function PageHero({
  badge,
  title,
  subtitle,
  description,
  image,
  imageAlt,
  primaryCta,
  secondaryCta,
  imageContain = false,
}: Props) {
  return (
    <section className="max-w-[1440px] mx-auto flex flex-col-reverse lg:flex-row items-stretch">
      <div className="flex-1 flex flex-col justify-center gap-7 px-6 lg:px-16 py-12 lg:py-20 text-right">
        <span
          className="inline-block self-start rounded-[20px] px-4 py-1.5 text-[13px] font-semibold text-white uppercase"
          style={{ background: GOLD }}
        >
          {badge}
        </span>
        <div>
          <h1
            className="font-extrabold leading-[1.15] text-[40px] lg:text-[56px]"
            style={{ color: NAVY }}
          >
            {title}
          </h1>
          <p className="mt-3 text-[18px] lg:text-[22px] font-light" style={{ color: GOLD }}>
            {subtitle}
          </p>
        </div>
        <p className="text-[17px] leading-[1.65] font-light" style={{ color: NAVY }}>
          {description}
        </p>
        {(primaryCta || secondaryCta) && (
          <div className="flex flex-wrap gap-4 items-center justify-start">
            {primaryCta && (
              <Link
                to={primaryCta.to}
                className="rounded-[12px] px-8 py-3.5 text-[16px] font-bold text-white transition hover:opacity-90"
                style={{ background: GOLD }}
              >
                {primaryCta.label}
              </Link>
            )}
            {secondaryCta && (
              <Link
                to={secondaryCta.to}
                className="rounded-[12px] border-2 px-7 py-3.5 text-[16px] font-semibold transition hover:bg-[#ae842d]/5"
                style={{ borderColor: GOLD, color: GOLD }}
              >
                {secondaryCta.label}
              </Link>
            )}
          </div>
        )}
      </div>
      <div className="flex-1 min-h-[320px] lg:min-h-[540px] p-4 lg:p-6">
        <img
          src={image}
          alt={imageAlt}
          className={`w-full h-full rounded-[30px] ${imageContain ? "object-contain" : "object-cover"}`}
        />
      </div>
    </section>
  );
}
