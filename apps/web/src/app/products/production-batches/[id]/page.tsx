import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getIngredients } from "@/lib/api/ingredients";
import { getProducts } from "@/lib/api/products";
import { getProductionBatch } from "@/lib/api/production-batches";

type ProductionBatchDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductionBatchDetailPage({
  params,
}: ProductionBatchDetailPageProps) {
  const { id } = await params;
  const batchId = Number(id);

  if (!Number.isInteger(batchId) || batchId <= 0) {
    notFound();
  }

  const [batch, products, ingredients] = await Promise.all([
    getProductionBatch(batchId).catch(() => null),
    getProducts(undefined, false).catch(() => []),
    getIngredients(undefined, false).catch(() => []),
  ]);

  if (!batch) {
    notFound();
  }

  const productName =
    products.find((product) => product.id === batch.productId)?.name ?? `منتج #${batch.productId}`;
  const ingredientNames = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient.name]));

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
      <div className="mb-5">
        <Link
          href="/products"
          className="inline-flex h-9 items-center rounded-md border px-3 text-[13px] font-semibold transition hover:bg-accent"
        >
          رجوع للمنتجات المنتجة
        </Link>
      </div>

      <section className="overflow-hidden rounded-[28px] border bg-white">
        <div className="border-b px-5 py-6 sm:px-8">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-800/80">
            Production Batch
          </p>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-[28px] font-bold leading-tight text-slate-950">
                {batch.batchCode}
              </h1>
              <p className="mt-2 text-sm text-slate-600">{productName}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-[420px]">
              <Metric label="الكمية المنتجة" value={formatQuantity(batch.producedQuantity)} />
              <Metric label="إجمالي التكلفة" value={formatAmount(batch.totalCost)} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:grid-cols-3 sm:px-8">
          <DetailItem label="وقت الإنتاج" value={formatDateTime(batch.occurredAt)} />
          <DetailItem label="وقت التسجيل" value={formatDateTime(batch.createdAt)} />
          <DetailItem label="تكلفة الوحدة" value={formatAmount(batch.unitCost)} />
          <DetailItem label="عدد الخامات" value={String(batch.lines.length)} />
          <DetailItem label="المنتج الناتج" value={productName} />
          <DetailItem label="ملاحظات" value={batch.notes ?? "لا توجد"} />
        </div>

        <div className="border-t px-5 py-5 sm:px-8">
          <h2 className="mb-4 text-[17px] font-bold text-slate-950">الخامات المستهلكة</h2>
          <div className="hidden sm:block overflow-x-auto rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-center">الخامة</TableHead>
                  <TableHead className="text-center">الكمية</TableHead>
                  <TableHead className="text-center">الكمية الأساسية</TableHead>
                  <TableHead className="text-center">تكلفة الوحدة</TableHead>
                  <TableHead className="text-center">تكلفة البند</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batch.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="text-center font-medium">
                      {ingredientNames.get(line.ingredientId) ?? `خامة #${line.ingredientId}`}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {formatQuantity(line.quantity)} {line.unit}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {formatQuantity(line.normalizedQuantity)}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {formatAmount(line.unitCost)}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {formatAmount(line.lineCost)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y sm:hidden overflow-hidden rounded-2xl border">
            {batch.lines.map((line, idx) => (
              <ProductionBatchLineCard
                key={line.id}
                line={line}
                ingredientName={ingredientNames.get(line.ingredientId) ?? `خامة #${line.ingredientId}`}
                idx={idx}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function ProductionBatchLineCard({
  line,
  ingredientName,
  idx,
}: {
  line: {
    quantity: number;
    unit: string;
    normalizedQuantity: number;
    unitCost: number;
    lineCost: number;
  };
  ingredientName: string;
  idx: number;
}) {
  return (
    <div className="flex flex-col gap-3 bg-card px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground">#{idx + 1}</span>
            <h3 className="truncate text-[15px] font-semibold leading-tight text-foreground">
              {ingredientName}
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatQuantity(line.quantity)} {line.unit}
          </p>
        </div>
        <p className="text-sm font-semibold text-foreground">{formatAmount(line.lineCost)}</p>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[12px]">
        <dt className="text-muted-foreground">الكمية الأساسية</dt>
        <dd className="text-foreground">{formatQuantity(line.normalizedQuantity)}</dd>
        <dt className="text-muted-foreground">تكلفة الوحدة</dt>
        <dd className="text-foreground">{formatAmount(line.unitCost)}</dd>
      </dl>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-slate-50/80 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-[22px] font-bold leading-none text-slate-950">{value}</p>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-slate-50/70 px-4 py-4">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 text-[15px] font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 3,
  }).format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
