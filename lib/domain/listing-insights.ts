import { formatCOP } from "@/lib/domain/format";
import type { Listing } from "@/lib/domain/types";

export interface ListingCostSummary {
  hasAdminFee: boolean;
  hasUtilitiesRange: boolean;
  hasBreakdown: boolean;
  utilitiesMin: number;
  utilitiesMax: number;
  totalMin: number;
  totalMax: number;
  totalLabel: string;
  breakdownLabel: string;
  insightLabel: string;
  adminLabel: string;
  totalLineLabel: string;
}

function buildBreakdownLabel(
  hasAdminFee: boolean,
  hasUtilitiesRange: boolean
): string {
  if (hasAdminFee && hasUtilitiesRange) {
    return "Canon + administración del edificio y servicios estimados";
  }

  if (hasAdminFee) {
    return "Canon + administración del edificio";
  }

  if (hasUtilitiesRange) {
    return "Canon + servicios estimados";
  }

  return "Canon mensual";
}

function buildInsightLabel(
  hasAdminFee: boolean,
  hasUtilitiesRange: boolean
): string {
  if (hasAdminFee && hasUtilitiesRange) {
    return "Ya ves el total mensual estimado";
  }

  if (hasAdminFee) {
    return "Ya ves canon + administración";
  }

  if (hasUtilitiesRange) {
    return "Ya ves el total con servicios estimados";
  }

  return "Canon mensual";
}

export function buildListingCostSummary(
  listing: Pick<
    Listing,
    "price_cop" | "admin_fee_cop" | "utilities_cop_min" | "utilities_cop_max"
  >
): ListingCostSummary {
  const hasAdminFee = listing.admin_fee_cop > 0;
  const hasUtilitiesRange =
    listing.utilities_cop_min != null || listing.utilities_cop_max != null;
  const hasBreakdown = hasAdminFee || hasUtilitiesRange;

  const utilitiesMin = listing.utilities_cop_min ?? 0;
  const utilitiesMax = listing.utilities_cop_max ?? listing.utilities_cop_min ?? 0;
  const totalMin = listing.price_cop + listing.admin_fee_cop + utilitiesMin;
  const totalMax = listing.price_cop + listing.admin_fee_cop + utilitiesMax;

  return {
    hasAdminFee,
    hasUtilitiesRange,
    hasBreakdown,
    utilitiesMin,
    utilitiesMax,
    totalMin,
    totalMax,
    totalLabel:
      totalMin === totalMax
        ? formatCOP(totalMin)
        : `${formatCOP(totalMin)} - ${formatCOP(totalMax)}`,
    breakdownLabel: buildBreakdownLabel(hasAdminFee, hasUtilitiesRange),
    insightLabel: buildInsightLabel(hasAdminFee, hasUtilitiesRange),
    adminLabel: "Administración del edificio",
    totalLineLabel: "Total mensual aprox.",
  };
}
