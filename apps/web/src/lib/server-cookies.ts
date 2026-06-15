import { cookies } from "next/headers";

export async function getServerCookieHeader() {
  return (await cookies()).toString();
}
