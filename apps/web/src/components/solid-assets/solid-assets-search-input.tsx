"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type SolidAssetsSearchInputProps = {
  initialQuery?: string;
};

export function SolidAssetsSearchInput({ initialQuery }: SolidAssetsSearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery ?? "");
  const [, startTransition] = useTransition();

  useEffect(() => {
    setValue(initialQuery ?? "");
  }, [initialQuery]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextValue = value.trim();
      const nextParams = new URLSearchParams(searchParams.toString());

      if (nextValue) {
        nextParams.set("q", nextValue);
      } else {
        nextParams.delete("q");
      }

      const nextQueryString = nextParams.toString();
      const nextUrl = nextQueryString ? `${pathname}?${nextQueryString}` : pathname;

      startTransition(() => {
        router.replace(nextUrl);
      });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [pathname, router, searchParams, value]);

  return (
    <input
      type="search"
      aria-label="بحث باسم الأصل"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder="بحث باسم الأصل…"
      className="h-8 w-56 border border-border bg-secondary px-3 text-[13px] placeholder:text-muted-foreground outline-none transition-colors focus:border-foreground"
      style={{ borderRadius: "var(--radius-sm)" }}
    />
  );
}
