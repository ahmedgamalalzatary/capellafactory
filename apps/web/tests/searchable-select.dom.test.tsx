import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { SearchableSelect } from "@/components/shared/searchable-select";

describe("SearchableSelect", () => {
  test("supports keyboard navigation and selection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <SearchableSelect
        value=""
        onChange={onChange}
        options={[
          { value: "1", label: "Alpha" },
          { value: "2", label: "Beta" },
          { value: "3", label: "Gamma", disabled: true },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /اختر/i }));

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: "Alpha" })).toHaveClass("bg-accent");

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: "Beta" })).toHaveClass("bg-accent");

    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledWith("2");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  test("closes the dropdown when escape is pressed", async () => {
    const user = userEvent.setup();

    render(
      <SearchableSelect
        value=""
        onChange={() => {}}
        options={[{ value: "1", label: "Alpha" }]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /اختر/i }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
