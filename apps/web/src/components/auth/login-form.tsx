"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      await login({ username, password });
      router.push("/suppliers");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "فشل تسجيل الدخول",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-border shadow-xl shadow-black/5">
      <CardHeader className="space-y-2 text-right">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Admin Access
        </p>
        <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="username">اسم المستخدم</Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? "جاري الدخول..." : "دخول"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
