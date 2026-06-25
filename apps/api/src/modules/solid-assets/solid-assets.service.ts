import type { SolidAssetInput } from "@capella/shared/solid-assets/solid-asset.types";
import {
  createSolidAsset,
  deleteSolidAsset,
  getSolidAssetById,
  listSolidAssets,
  updateSolidAsset,
} from "./solid-assets.repository.js";

export async function getSolidAssets(query?: string) {
  return listSolidAssets(query);
}

export async function getSolidAsset(id: number) {
  return getSolidAssetById(id);
}

export async function addSolidAsset(input: SolidAssetInput) {
  return createSolidAsset(input);
}

export async function editSolidAsset(id: number, input: Partial<SolidAssetInput>) {
  return updateSolidAsset(id, input);
}

export async function removeSolidAsset(id: number) {
  return deleteSolidAsset(id);
}
