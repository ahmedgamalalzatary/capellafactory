import type { Request, Response } from "express";
import {
  addSupplier,
  editSupplier,
  getSupplier,
  getSuppliers,
  removeSupplier,
} from "./suppliers.service.js";
import {
  DuplicateSupplierPhoneError,
  SupplierHasPurchaseHistoryError,
} from "./suppliers.repository.js";

export async function listSuppliersHandler(request: Request, response: Response) {
  const query =
    typeof request.query.q === "string" ? request.query.q : undefined;

  response.json(await getSuppliers(query));
}

export async function getSupplierHandler(request: Request, response: Response) {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ message: "معرّف المورد غير صالح" });
    return;
  }

  const supplier = await getSupplier(id);

  if (!supplier) {
    response.status(404).json({ message: "المورد غير موجود" });
    return;
  }

  response.json(supplier);
}

export async function createSupplierHandler(request: Request, response: Response) {
  try {
    const supplier = await addSupplier(request.body);
    response.status(201).json(supplier);
  } catch (error) {
    if (error instanceof DuplicateSupplierPhoneError) {
      response.status(409).json({ message: error.message });
      return;
    }

    throw error;
  }
}

export async function updateSupplierHandler(request: Request, response: Response) {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ message: "معرّف المورد غير صالح" });
    return;
  }

  try {
    const supplier = await editSupplier(id, request.body);

    if (!supplier) {
      response.status(404).json({ message: "المورد غير موجود" });
      return;
    }

    response.json(supplier);
  } catch (error) {
    if (error instanceof DuplicateSupplierPhoneError) {
      response.status(409).json({ message: error.message });
      return;
    }

    throw error;
  }
}

export async function deleteSupplierHandler(request: Request, response: Response) {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ message: "معرّف المورد غير صالح" });
    return;
  }

  try {
    const deleted = await removeSupplier(id);

    if (!deleted) {
      response.status(404).json({ message: "المورد غير موجود" });
      return;
    }

    response.status(204).send();
  } catch (error) {
    if (error instanceof SupplierHasPurchaseHistoryError) {
      response.status(409).json({ message: error.message });
      return;
    }

    throw error;
  }
}
