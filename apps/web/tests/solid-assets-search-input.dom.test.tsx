import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/solid-assets",
  useSearchParams: () => new URLSearchParams(),
}));

import { SolidAssetsSearchInput } from "../src/components/solid-assets/solid-assets-search-input";

describe("SolidAssetsSearchInput", () => {
  test("exposes an accessible name for the search field", () => {
    render(<SolidAssetsSearchInput initialQuery="" />);

    expect(screen.getByRole("searchbox", { name: "بحث باسم الأصل" })).toBeInTheDocument();
  });
});
