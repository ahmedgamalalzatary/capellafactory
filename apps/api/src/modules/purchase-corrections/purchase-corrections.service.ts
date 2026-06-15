import type { PurchaseCorrectionInput } from "@capella/shared/purchase-corrections/purchase-correction.types";
import {
  createPurchaseCorrection,
  getPurchaseCorrectionById,
  listPurchaseCorrections,
} from "./purchase-corrections.repository.js";

export async function getPurchaseCorrections(query?: string) {
  return listPurchaseCorrections(query);
}

export async function getPurchaseCorrection(id: number) {
  return getPurchaseCorrectionById(id);
}

export async function addPurchaseCorrection(input: PurchaseCorrectionInput) {
  return createPurchaseCorrection(input);
}
