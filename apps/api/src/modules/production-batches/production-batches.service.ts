import type { ProductionBatchInput } from "@capella/shared/production-batches/production-batch.types";
import {
  createProductionBatch,
  getProductionBatchById,
  listProductionBatches,
} from "./production-batches.repository.js";

export async function getProductionBatches(query?: string) {
  return listProductionBatches(query);
}

export async function getProductionBatch(id: number) {
  return getProductionBatchById(id);
}

export async function addProductionBatch(input: ProductionBatchInput) {
  return createProductionBatch(input);
}
