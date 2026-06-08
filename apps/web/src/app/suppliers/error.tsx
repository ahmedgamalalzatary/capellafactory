"use client";

import Link from "next/link";

export default function SuppliersError() {
  return (
    <div className="px-8 py-16 max-w-6xl mx-auto">
      <div
        className="max-w-lg p-6"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <p className="text-[11px] text-destructive font-semibold tracking-wide uppercase mb-1">
          خطأ في الاتصال
        </p>
        <h1 className="text-[18px] font-semibold text-foreground mt-1">
          تعذّر تحميل بيانات الموردين
        </h1>
        <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">
          لم تستجب الواجهة البرمجية. تأكد من تشغيل خدمة الواجهة الخلفية وأن
          قاعدة البيانات قابلة للوصول.
        </p>
        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="h-9 px-4 bg-primary text-primary-foreground text-[13px] font-medium transition-colors hover:opacity-90"
            style={{ borderRadius: "var(--radius)" }}
          >
            إعادة المحاولة
          </button>
          <Link
            href="/"
            className="h-9 px-4 border border-border text-[13px] font-medium inline-flex items-center transition-colors hover:bg-accent"
            style={{ borderRadius: "var(--radius)" }}
          >
            الرجوع للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
