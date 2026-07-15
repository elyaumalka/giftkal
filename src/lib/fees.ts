/**
 * Gift fee model — central calculator for the gross-up pricing used by giftkal.
 *
 * Business model (confirmed with Elyau + PayMe):
 *   - PayMe charges giftkal's master account ~0.9% per transaction (negotiated rate).
 *   - giftkal adds a platform margin of ~1.1% per transaction.
 *   - For installment payments, PayMe levies an additional (prime + 4.4) / 12 %
 *     PER INSTALLMENT (it's a monthly-equivalent rate).
 *   - All three fees are passed to the GUEST (gross-up). The couple receives the
 *     full gift amount they were intended to receive; the guest's card is
 *     charged the gift + fees.
 *
 * Two UX modes for the guest:
 *   - "gift" mode (default): guest enters the amount the couple should receive.
 *     We compute the total charge = gift × (1 + total_fee_rate).
 *   - "total" mode: guest enters the amount they want charged on their card.
 *     We compute the gift to couple = total / (1 + total_fee_rate).
 *
 * All percentages are stored as percent values (1.10 means 1.10%).
 *
 * In Phase C the per-seller fee rates will move into events.payment_setup_data
 * (admin will edit them per seller in the dashboard). For now we use platform
 * defaults so the gross-up math is consistent across all events.
 */

export type FeeMode = "gift" | "total";

export interface FeeConfig {
  /** PayMe processing fee, % (charged to giftkal master, passed through). */
  paymePct: number;
  /** giftkal's platform margin, %. */
  platformPct: number;
  /** Bank of Israel prime rate, %. Used to compute installment surcharge. */
  primeRate: number;
  /** PayMe installment surcharge constant: monthly rate = (prime + 4.4) / 12. */
  installmentSurchargeBase: number;
  /** Partner's cut, %. Only applied when the event was created by a partner. */
  partnerCommissionPct?: number;
  /** Giftkal's cut of the partner-referral markup, %. */
  platformPartnerPct?: number;
}

/** Platform-wide defaults. Overridden per-seller once Phase C ships fee config. */
export const DEFAULT_FEE_CONFIG: FeeConfig = {
  paymePct: 0.9,
  platformPct: 1.1,
  primeRate: 6.0,
  installmentSurchargeBase: 4.4,
};

/**
 * Compute the total fee rate (as a percent) for a transaction.
 * For installments > 1, includes the monthly surcharge × number of installments.
 * Partner-referral markup is added on top when the event has a partner.
 */
export function feeRatePct(installments: number, cfg: FeeConfig = DEFAULT_FEE_CONFIG): number {
  const installmentRatePct =
    installments > 1
      ? ((cfg.primeRate + cfg.installmentSurchargeBase) / 12) * installments
      : 0;
  const partnerRatePct = (cfg.partnerCommissionPct ?? 0) + (cfg.platformPartnerPct ?? 0);
  return cfg.paymePct + cfg.platformPct + installmentRatePct + partnerRatePct;
}

export interface FeeBreakdown {
  /** The amount the couple will receive (gift intent). */
  giftAmount: number;
  /** What the guest's card will be charged. */
  totalCharge: number;
  /** Sum of all fees, in ₪. */
  feeAmount: number;
  /** Individual fee components in ₪ (for transparency in the UI). */
  components: {
    payme: number;
    platform: number;
    installments: number;
  };
  /** Effective fee rate (totalCharge / giftAmount - 1), as percent. */
  effectiveRatePct: number;
  /** Number of installments. */
  installments: number;
}

/**
 * Compute the full breakdown given either (a) the gift amount the couple should
 * receive, or (b) the total the guest wants charged. Inputs are validated and
 * rounded to the nearest agora to match PayMe's display.
 */
export function computeBreakdown(
  inputAmount: number,
  mode: FeeMode,
  installments: number,
  cfg: FeeConfig = DEFAULT_FEE_CONFIG,
): FeeBreakdown {
  const cleanInstallments = Math.max(1, Math.floor(installments || 1));
  const totalRatePct = feeRatePct(cleanInstallments, cfg);
  const totalRate = totalRatePct / 100;

  let giftAmount: number;
  let totalCharge: number;

  if (mode === "gift") {
    giftAmount = roundAgorot(inputAmount);
    totalCharge = roundAgorot(giftAmount * (1 + totalRate));
  } else {
    totalCharge = roundAgorot(inputAmount);
    giftAmount = roundAgorot(totalCharge / (1 + totalRate));
  }

  const feeAmount = roundAgorot(totalCharge - giftAmount);
  const paymeFee = roundAgorot(giftAmount * (cfg.paymePct / 100));
  const platformFee = roundAgorot(giftAmount * (cfg.platformPct / 100));
  // Whatever is left over after PayMe + platform components is the installment portion.
  // Computing it as the residual avoids the cumulative rounding error of computing
  // each rate independently.
  const installmentFee = roundAgorot(Math.max(0, feeAmount - paymeFee - platformFee));

  return {
    giftAmount,
    totalCharge,
    feeAmount,
    components: {
      payme: paymeFee,
      platform: platformFee,
      installments: installmentFee,
    },
    effectiveRatePct:
      giftAmount > 0 ? ((totalCharge - giftAmount) / giftAmount) * 100 : 0,
    installments: cleanInstallments,
  };
}

function roundAgorot(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100) / 100;
}

/** Format a ₪ amount the same way across the UI. */
export function formatILS(amount: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
