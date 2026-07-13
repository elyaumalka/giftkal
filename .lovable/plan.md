# Multi-page marketing site

Take the visual language from `/about` and `/contact` (cream background `#F5F5F5`, dark-navy pill navbar, gold `#AE842D` accents, white rounded cards, right-aligned RTL) and roll it out across a full marketing site with real navigation. Replace the current one-page `HomePage` with a proper home page + dedicated pages for each nav item.

## New route map

All pages sit under `MarketingLayout` (navbar + footer already built).

```
/                → Home            (short teaser home, links out to sub-pages)
/how-it-works    → איך זה עובד?    (extended 3-step flow + visual)
/why-us          → למה דווקא אנחנו? (feature grid, comparison, testimonial)
/pricing         → מחירון           (199₪ plan + add-ons + coupon note)
/faq             → שאלות ותשובות   (accordion grouped by topic)
/about           → אודות            (exists)
/contact         → יצירת קשר        (exists)
```

Update nav links in `MarketingLayout.tsx` from `/#how`, `/#features`, `/#pricing`, `/#faq` to the real routes above.

## Pages to build

Each page follows the same structural template as `/about`:
1. Hero band — badge chip, H1 (navy), gold sub-line, description, 2 CTAs, image on the opposite side
2. 1–2 supporting sections in white or cream cards with `rounded-[24px]` and soft shadow
3. Closing CTA band linking to `/contact` or `/signup`

**Home (`/`)** — Hero with tagline "המתנות המושלמות לאירוע שלך", 4-stat strip (reuse from About), 3 feature teasers linking to `/how-it-works`, `/why-us`, `/pricing`, closing "פתחו אירוע" CTA.

**How it works (`/how-it-works`)** — 3 numbered step cards (עמוד מתנות אישי / האורחים משלימים / סדר ושליטה) with expanded copy, side illustration, "מה קורה אחרי האירוע?" secondary block.

**Why us (`/why-us`)** — Feature grid (6 cards: מחיר קבוע, שקיפות, נוחות, ליווי אישי, אבטחה, איזור אישי), simple compare block vs. traditional gift envelopes, single testimonial quote card.

**Pricing (`/pricing`)** — Single big price card "199 ₪ לאירוע" with bullet list of what's included, small "מה לא כלול" note, coupon input hint, FAQ mini-link.

**FAQ (`/faq`)** — Accordion (`@/components/ui/accordion`) grouped: כללי / תשלום / אורחים / בעלי אירוע. ~10–12 questions total.

## Design tokens (reused verbatim from About)

- Background `#F5F5F5`, white cards, `#f9f7f3` soft-cream, `#f2f0eb` chip
- Navy `#051839` for headings, Gold `#AE842D` for accents/CTAs
- Radii `24px`/`30px`/`32px`, shadow `0 8px 16px rgba(0,0,0,0.06)`
- All content `dir="rtl"`, `text-right`, using lucide-react icons

## Cleanup

- Change `/` route to render a new `Home.tsx` under `MarketingLayout` (replacing the old `HomePage`)
- Delete/deprecate: `src/pages/landing/HomePage.tsx` and unused landing sub-components (`FinalCTA`, feature/how/faq/etc. one-page sections) if they are no longer imported anywhere else
- Remove the legacy `Navigate` redirects (`/pricing → /#contact`, `/benefits → /#features`, etc.) and point them to the new real routes
- Update in-page anchors (`href="#faq"`, `#pricing`, etc.) inside the new pages to real `/faq`, `/pricing` routes

## Images

I'll generate hero illustrations for each new page in the same navy+gold style as the ones on About/Contact (event hall, gift box, price tag, question-mark cluster). If you want to use Figma assets instead, export them and drop them in the chat and I'll swap them in.

## Not doing (unless you ask)

- No changes to backend, leads table, or auth flows
- No changes to logged-in areas (event/venue/admin)
- No new copy translations — Hebrew RTL only, matching existing tone
