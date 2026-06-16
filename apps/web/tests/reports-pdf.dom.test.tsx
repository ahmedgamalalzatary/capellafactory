import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";

import { ReportPdfDownloadButton } from "@/components/reports/report-pdf-download-button";

describe("ReportPdfDownloadButton", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("prints the report without opening a blank browser window", async () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);

    render(
      <>
        <table id="report-table-sales">
          <tbody>
            <tr>
              <td>SAL-001</td>
            </tr>
          </tbody>
        </table>
        <ReportPdfDownloadButton
          label="تحميل PDF"
          filename="capella-sales-report.pdf"
          tableId="report-table-sales"
        />
      </>,
    );

    await userEvent.click(screen.getByRole("button", { name: "تحميل PDF" }));

    expect(openSpy).not.toHaveBeenCalled();
    expect(printSpy).toHaveBeenCalledTimes(1);
  });
});
