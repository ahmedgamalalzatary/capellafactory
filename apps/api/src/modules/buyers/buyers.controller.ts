import type { Request, Response } from "express";
import {
  addBuyer,
  editBuyer,
  getBuyer,
  getBuyers,
  removeBuyer,
} from "./buyers.service.js";
import { DuplicateBuyerPhoneError } from "./buyers.repository.js";

export async function listBuyersHandler(request: Request, response: Response) {
  const query = typeof request.query.q === "string" ? request.query.q : undefined;
  response.json(await getBuyers(query));
}

export async function getBuyerHandler(request: Request, response: Response) {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ message: "Invalid buyer id" });
    return;
  }

  const buyer = await getBuyer(id);

  if (!buyer) {
    response.status(404).json({ message: "Buyer not found" });
    return;
  }

  response.json(buyer);
}

export async function createBuyerHandler(request: Request, response: Response) {
  try {
    const buyer = await addBuyer(request.body);
    response.status(201).json(buyer);
  } catch (error) {
    if (error instanceof DuplicateBuyerPhoneError) {
      response.status(409).json({ message: error.message });
      return;
    }

    throw error;
  }
}

export async function updateBuyerHandler(request: Request, response: Response) {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ message: "Invalid buyer id" });
    return;
  }

  try {
    const buyer = await editBuyer(id, request.body);

    if (!buyer) {
      response.status(404).json({ message: "Buyer not found" });
      return;
    }

    response.json(buyer);
  } catch (error) {
    if (error instanceof DuplicateBuyerPhoneError) {
      response.status(409).json({ message: error.message });
      return;
    }

    throw error;
  }
}

export async function deleteBuyerHandler(request: Request, response: Response) {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ message: "Invalid id" });
    return;
  }

  const deleted = await removeBuyer(id);

  if (!deleted) {
    response.status(404).json({ message: "Buyer not found" });
    return;
  }

  response.status(204).send();
}
