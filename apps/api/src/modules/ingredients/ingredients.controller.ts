import type { Request, Response } from "express";
import {
  addIngredient,
  archiveIngredientRecord,
  editIngredient,
  getIngredient,
  getIngredients,
  reactivateIngredientRecord,
  removeIngredient,
} from "./ingredients.service.js";
import {
  DuplicateIngredientNameError,
  IngredientArchiveConflictError,
  IngredientDeleteConflictError,
  IngredientLockedError,
} from "./ingredients.repository.js";

export async function listIngredientsHandler(request: Request, response: Response) {
  const query = typeof request.query.q === "string" ? request.query.q : undefined;
  const includeArchived = request.query.archived === "true";
  response.json(await getIngredients(query, includeArchived));
}

export async function getIngredientHandler(request: Request, response: Response) {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ message: "معرّف الخامة غير صالح" });
    return;
  }

  const ingredient = await getIngredient(id);

  if (!ingredient) {
    response.status(404).json({ message: "الخامة غير موجودة" });
    return;
  }

  response.json(ingredient);
}

export async function createIngredientHandler(request: Request, response: Response) {
  try {
    const ingredient = await addIngredient(request.body);
    response.status(201).json(ingredient);
  } catch (error) {
    if (error instanceof DuplicateIngredientNameError) {
      response.status(409).json({ message: error.message });
      return;
    }

    throw error;
  }
}

export async function updateIngredientHandler(request: Request, response: Response) {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ message: "معرّف الخامة غير صالح" });
    return;
  }

  try {
    const ingredient = await editIngredient(id, request.body);

    if (!ingredient) {
      response.status(404).json({ message: "الخامة غير موجودة" });
      return;
    }

    response.json(ingredient);
  } catch (error) {
    if (
      error instanceof DuplicateIngredientNameError ||
      error instanceof IngredientLockedError
    ) {
      response.status(409).json({ message: error.message });
      return;
    }

    throw error;
  }
}

export async function archiveIngredientHandler(request: Request, response: Response) {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ message: "معرّف الخامة غير صالح" });
    return;
  }

  try {
    const ingredient = await archiveIngredientRecord(id);

    if (!ingredient) {
      response.status(404).json({ message: "الخامة غير موجودة" });
      return;
    }

    response.json(ingredient);
  } catch (error) {
    if (error instanceof IngredientArchiveConflictError) {
      response.status(409).json({ message: error.message });
      return;
    }

    throw error;
  }
}

export async function reactivateIngredientHandler(request: Request, response: Response) {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ message: "معرّف الخامة غير صالح" });
    return;
  }

  const ingredient = await reactivateIngredientRecord(id);

  if (!ingredient) {
    response.status(404).json({ message: "الخامة غير موجودة" });
    return;
  }

  response.json(ingredient);
}

export async function deleteIngredientHandler(request: Request, response: Response) {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ message: "معرّف الخامة غير صالح" });
    return;
  }

  try {
    const deleted = await removeIngredient(id);

    if (!deleted) {
      response.status(404).json({ message: "الخامة غير موجودة" });
      return;
    }

    response.status(204).send();
  } catch (error) {
    if (error instanceof IngredientDeleteConflictError) {
      response.status(409).json({ message: error.message });
      return;
    }

    throw error;
  }
}
