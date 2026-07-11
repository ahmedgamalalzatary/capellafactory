import type { Request, Response } from "express";
import {
  addSolidAsset,
  editSolidAsset,
  getSolidAsset,
  getSolidAssets,
  removeSolidAsset,
} from "./solid-assets.service.js";

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function listSolidAssetsHandler(request: Request, response: Response) {
  const query = typeof request.query.q === "string" ? request.query.q : undefined;
  response.json(await getSolidAssets(query));
}

export async function getSolidAssetHandler(request: Request, response: Response) {
  const rawId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
  const id = parseId(rawId);

  if (!id) {
    response.status(400).json({ message: "معرّف الأصل الثابت غير صالح" });
    return;
  }

  const asset = await getSolidAsset(id);

  if (!asset) {
    response.status(404).json({ message: "الأصل الثابت غير موجود" });
    return;
  }

  response.json(asset);
}

export async function createSolidAssetHandler(request: Request, response: Response) {
  const asset = await addSolidAsset(request.body);
  response.status(201).json(asset);
}

export async function updateSolidAssetHandler(request: Request, response: Response) {
  const rawId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
  const id = parseId(rawId);

  if (!id) {
    response.status(400).json({ message: "معرّف الأصل الثابت غير صالح" });
    return;
  }

  const asset = await editSolidAsset(id, request.body);

  if (!asset) {
    response.status(404).json({ message: "الأصل الثابت غير موجود" });
    return;
  }

  response.json(asset);
}

export async function deleteSolidAssetHandler(request: Request, response: Response) {
  const rawId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
  const id = parseId(rawId);

  if (!id) {
    response.status(400).json({ message: "معرّف الأصل الثابت غير صالح" });
    return;
  }

  const deleted = await removeSolidAsset(id);

  if (!deleted) {
    response.status(404).json({ message: "الأصل الثابت غير موجود" });
    return;
  }

  response.status(204).send();
}
