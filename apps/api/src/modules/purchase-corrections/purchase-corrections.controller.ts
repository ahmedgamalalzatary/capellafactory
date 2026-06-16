import type { Request, Response } from "express";
import {
  addPurchaseCorrection,
  getPurchaseCorrection,
  getPurchaseCorrections,
} from "./purchase-corrections.service.js";
import { PurchaseCorrectionValidationError } from "./purchase-corrections.validators.js";

export async function listPurchaseCorrectionsHandler(request: Request, response: Response) {
  const query = typeof request.query.q === "string" ? request.query.q : undefined;
  response.json(await getPurchaseCorrections(query));
}

export async function getPurchaseCorrectionHandler(request: Request, response: Response) {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ message: "Invalid purchase correction id" });
    return;
  }

  const correction = await getPurchaseCorrection(id);

  if (!correction) {
    response.status(404).json({ message: "Purchase correction not found" });
    return;
  }

  response.json(correction);
}

export async function createPurchaseCorrectionHandler(request: Request, response: Response) {
  try {
    const correction = await addPurchaseCorrection(request.body);
    response.status(201).json(correction);
  } catch (error) {
    if (error instanceof PurchaseCorrectionValidationError) {
      response.status(400).json({ message: error.message });
      return;
    }

    throw error;
  }
}
