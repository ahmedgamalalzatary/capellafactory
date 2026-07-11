import type { Request, Response } from "express";
import {
  addProduct,
  archiveProductRecord,
  editProduct,
  getProduct,
  getProducts,
  reactivateProductRecord,
  removeProduct,
} from "./products.service.js";
import {
  DuplicateProductNameError,
  ProductArchiveConflictError,
  ProductDeleteConflictError,
  ProductLockedError,
} from "./products.repository.js";

export async function listProductsHandler(request: Request, response: Response) {
  const query = typeof request.query.q === "string" ? request.query.q : undefined;
  const includeArchived = request.query.archived === "true";
  response.json(await getProducts(query, includeArchived));
}

export async function getProductHandler(request: Request, response: Response) {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ message: "معرّف المنتج غير صالح" });
    return;
  }

  const product = await getProduct(id);

  if (!product) {
    response.status(404).json({ message: "المنتج غير موجود" });
    return;
  }

  response.json(product);
}

export async function createProductHandler(request: Request, response: Response) {
  try {
    const product = await addProduct(request.body);
    response.status(201).json(product);
  } catch (error) {
    if (error instanceof DuplicateProductNameError) {
      response.status(409).json({ message: error.message });
      return;
    }

    throw error;
  }
}

export async function updateProductHandler(request: Request, response: Response) {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ message: "معرّف المنتج غير صالح" });
    return;
  }

  try {
    const product = await editProduct(id, request.body);

    if (!product) {
      response.status(404).json({ message: "المنتج غير موجود" });
      return;
    }

    response.json(product);
  } catch (error) {
    if (error instanceof DuplicateProductNameError || error instanceof ProductLockedError) {
      response.status(409).json({ message: error.message });
      return;
    }

    throw error;
  }
}

export async function archiveProductHandler(request: Request, response: Response) {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ message: "معرّف المنتج غير صالح" });
    return;
  }

  try {
    const product = await archiveProductRecord(id);

    if (!product) {
      response.status(404).json({ message: "المنتج غير موجود" });
      return;
    }

    response.json(product);
  } catch (error) {
    if (error instanceof ProductArchiveConflictError) {
      response.status(409).json({ message: error.message });
      return;
    }

    throw error;
  }
}

export async function reactivateProductHandler(request: Request, response: Response) {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ message: "معرّف المنتج غير صالح" });
    return;
  }

  const product = await reactivateProductRecord(id);

  if (!product) {
    response.status(404).json({ message: "المنتج غير موجود" });
    return;
  }

  response.json(product);
}

export async function deleteProductHandler(request: Request, response: Response) {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ message: "معرّف المنتج غير صالح" });
    return;
  }

  try {
    const deleted = await removeProduct(id);

    if (!deleted) {
      response.status(404).json({ message: "المنتج غير موجود" });
      return;
    }

    response.status(204).send();
  } catch (error) {
    if (error instanceof ProductDeleteConflictError) {
      response.status(409).json({ message: error.message });
      return;
    }

    throw error;
  }
}
