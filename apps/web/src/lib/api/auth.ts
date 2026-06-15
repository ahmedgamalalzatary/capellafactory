import { CLIENT_API_URL, handleApiResponse, withApiCredentials } from "./request";

export async function login(input: { username: string; password: string }) {
  const response = await fetch(
    `${CLIENT_API_URL}/auth/login`,
    withApiCredentials({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );

  await handleApiResponse(response, "فشل تسجيل الدخول");
  return (await response.json()) as { ok: true; user: { username: string } };
}

export async function logout() {
  const response = await fetch(
    `${CLIENT_API_URL}/auth/logout`,
    withApiCredentials({ method: "POST" }),
  );

  if (response.status === 401 || response.status === 204) {
    return;
  }

  await handleApiResponse(response, "فشل تسجيل الخروج");
}
