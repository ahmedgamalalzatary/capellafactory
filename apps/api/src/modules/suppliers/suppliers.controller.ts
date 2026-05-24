import type { Request, Response } from "express";
import {
  addSupplier,
  editSupplier,
  getSupplier,
  getSuppliers,
  removeSupplier,
} from "./suppliers.service.js";
import { DuplicateSupplierPhoneError } from "./suppliers.repository.js";

export async function listSuppliersHandler(_request: Request, response: Response) {
  response.json(await getSuppliers());
}

export async function getSupplierHandler(request: Request, response: Response) {
  const supplier = await getSupplier(Number(request.params.id));

  if (!supplier) {
    response.status(404).json({ message: "Supplier not found" });
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
  try {
    const supplier = await editSupplier(Number(request.params.id), request.body);

    if (!supplier) {
      response.status(404).json({ message: "Supplier not found" });
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
  const deleted = await removeSupplier(Number(request.params.id));

  if (!deleted) {
    response.status(404).json({ message: "Supplier not found" });
    return;
  }

  response.status(204).send();
}
