import type { BuyerInput } from "@capella/shared/buyers/buyer.types";
import {
  createBuyer,
  deleteBuyer,
  getBuyerById,
  listBuyers,
  updateBuyer,
} from "./buyers.repository.js";

export async function getBuyers(query?: string) {
  return listBuyers(query);
}

export async function getBuyer(id: number) {
  return getBuyerById(id);
}

export async function addBuyer(input: BuyerInput) {
  return createBuyer(input);
}

export async function editBuyer(id: number, input: Partial<BuyerInput>) {
  return updateBuyer(id, input);
}

export async function removeBuyer(id: number) {
  return deleteBuyer(id);
}
