"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type InventorySearchInputProps = {
  initialQuery?: string;
  placeholder: string;
};

export function InventorySearchInput({
  initialQuery,
  placeholder,
}: InventorySearchInputProps) {
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
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder={placeholder}
      className="h-10 min-w-[220px] rounded-full border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
    />
  );
}
