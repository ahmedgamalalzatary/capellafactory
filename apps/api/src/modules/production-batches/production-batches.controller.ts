import type { Request, Response } from "express";
import {
  addProductionBatch,
  getProductionBatch,
  getProductionBatches,
} from "./production-batches.service.js";
import { ProductionBatchValidationError } from "./production-batches.validators.js";

export async function listProductionBatchesHandler(request: Request, response: Response) {
  const query = typeof request.query.q === "string" ? request.query.q : undefined;
  response.json(await getProductionBatches(query));
}

export async function getProductionBatchHandler(request: Request, response: Response) {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ message: "معرّف التشغيلة غير صالح" });
    return;
  }

  const batch = await getProductionBatch(id);

  if (!batch) {
    response.status(404).json({ message: "التشغيلة غير موجودة" });
    return;
  }

  response.json(batch);
}

export async function createProductionBatchHandler(request: Request, response: Response) {
  try {
    const batch = await addProductionBatch(request.body);
    response.status(201).json(batch);
  } catch (error) {
    if (error instanceof ProductionBatchValidationError) {
      response.status(400).json({ message: error.message });
      return;
    }

    throw error;
  }
}
