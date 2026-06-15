import { getBuyers } from "@/lib/api/buyers";
import { getServerCookieHeader } from "@/lib/server-cookies";
import { BuyersSearchInput } from "@/components/buyers/buyers-search-input";
import { BuyerDialog } from "@/components/buyers/buyer-dialog";
import { BuyersTable } from "@/components/buyers/buyers-table";

type BuyersPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function BuyersPage({ searchParams }: BuyersPageProps) {
  const params = (await searchParams) ?? {};
  const query = params.q?.trim() || undefined;
  const cookieHeader = await getServerCookieHeader();
  const buyers = await getBuyers(query, { cookieHeader });

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 mb-6 sm:mb-8">
        <div>
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-foreground">
            المشترون
          </h1>
          <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed max-w-[48ch]">
            إدارة بيانات المشترين: الاسم، رقم الهاتف، الموقع، والملاحظات التشغيلية.
          </p>
        </div>
        <div className="shrink-0 pt-1">
          <BuyerDialog />
        </div>
      </div>

      <div
        className="flex flex-wrap items-center gap-2.5 px-4 py-3 mb-0"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderBottom: "none",
          borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
        }}
      >
        <BuyersSearchInput initialQuery={query} />
      </div>

      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        <BuyersTable buyers={buyers} />
      </div>
    </div>
  );
}
