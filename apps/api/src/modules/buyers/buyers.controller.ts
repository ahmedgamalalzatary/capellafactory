import type { Request, Response } from "express";
import {
  addBuyer,
  editBuyer,
  getBuyer,
  getBuyers,
  removeBuyer,
} from "./buyers.service.js";
import { BuyerLockedError, DuplicateBuyerPhoneError } from "./buyers.repository.js";

export async function listBuyersHandler(request: Request, response: Response) {
  const query = typeof request.query.q === "string" ? request.query.q : undefined;
  response.json(await getBuyers(query));
}

export async function getBuyerHandler(request: Request, response: Response) {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ message: "معرّف العميل غير صالح" });
    return;
  }

  const buyer = await getBuyer(id);

  if (!buyer) {
    response.status(404).json({ message: "العميل غير موجود" });
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
    response.status(400).json({ message: "معرّف العميل غير صالح" });
    return;
  }

  try {
    const buyer = await editBuyer(id, request.body);

    if (!buyer) {
      response.status(404).json({ message: "العميل غير موجود" });
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
    response.status(400).json({ message: "معرّف العميل غير صالح" });
    return;
  }

  try {
    const deleted = await removeBuyer(id);

    if (!deleted) {
      response.status(404).json({ message: "العميل غير موجود" });
      return;
    }

    response.status(204).send();
  } catch (error) {
    if (error instanceof BuyerLockedError) {
      response.status(409).json({ message: error.message });
      return;
    }

    throw error;
  }
}
