"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type PurchaseDateTimeFieldsProps = {
  dateId: string;
  timeId: string;
  label: string;
  hint: string;
  defaultDate: string;
  timeValue: string;
  onTimeChange: (value: string) => void;
  /**
   * When provided, the date input is controlled so it survives React's
   * post-submit form reset. Falls back to the uncontrolled `defaultDate`.
   */
  dateValue?: string;
  onDateChange?: (value: string) => void;
};

export function PurchaseDateTimeFields({
  dateId,
  timeId,
  label,
  hint,
  defaultDate,
  timeValue,
  onTimeChange,
  dateValue,
  onDateChange,
}: PurchaseDateTimeFieldsProps) {
  const displayTimeValue = toDisplayTimeValue(timeValue);

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={dateId}>
        {label}
        <span className="ms-1 text-destructive">*</span>
      </Label>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor={dateId} className="text-xs font-normal text-muted-foreground">
            التاريخ
          </Label>
          {onDateChange ? (
            <Input
              id={dateId}
              name={dateId}
              type="date"
              value={dateValue ?? defaultDate}
              onChange={(event) => onDateChange(event.target.value)}
              required
            />
          ) : (
            <Input id={dateId} name={dateId} type="date" defaultValue={defaultDate} required />
          )}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={timeId} className="text-xs font-normal text-muted-foreground">
            الوقت
          </Label>
          <input id={timeId} name={timeId} type="hidden" value={timeValue} readOnly />
          <TimePicker
            inputId={`${timeId}Display`}
            displayValue={displayTimeValue}
            timeValue={timeValue}
            onTimeChange={onTimeChange}
          />
        </div>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {hint} يمكنك كتابة الوقت يدويًا بصيغة `hh:mm AM/PM` أو اختياره من الساعة.
      </p>
    </div>
  );
}

type TimePickerProps = {
  inputId: string;
  displayValue: string;
  timeValue: string;
  onTimeChange: (value: string) => void;
};

const MINUTE_STEPS = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"));
const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);

function TimePicker({ inputId, displayValue, timeValue, onTimeChange }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(displayValue);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelTitleId = useId();

  const { hour12, minute, period } = toTwelveHourParts(timeValue);
  const selectedHour = Number(hour12);
  // Hand angle: 12 sits at the top, each hour advances 30°.
  const handAngle = (selectedHour % 12) * 30;

  useEffect(() => {
    setDraft(displayValue);
  }, [displayValue]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function commitDraft(next: string) {
    const normalized = parseDisplayTimeValue(next);

    if (normalized) {
      onTimeChange(normalized);
    } else {
      setDraft(displayValue);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          id={inputId}
          type="text"
          inputMode="numeric"
          dir="ltr"
          className="pe-10 text-center font-medium tabular-nums tracking-wide"
          placeholder="مثال: 09:15 AM"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            const normalized = parseDisplayTimeValue(event.target.value);

            if (normalized) {
              onTimeChange(normalized);
            }
          }}
          onBlur={(event) => commitDraft(event.target.value)}
        />
        <button
          type="button"
          aria-label="اختيار الوقت"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "absolute end-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors sm:size-7",
            "hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            open && "bg-accent text-foreground",
          )}
        >
          <Clock className="size-4" />
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-labelledby={panelTitleId}
          dir="ltr"
          className={cn(
            "absolute inset-x-0 z-50 mt-2 mx-auto w-full max-w-[20rem] origin-top rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-xl",
            "animate-in fade-in-0 zoom-in-95",
          )}
        >
          <div className="flex items-baseline justify-between">
            <span id={panelTitleId} className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Time
            </span>
            <span className="font-semibold tabular-nums tracking-wide">{displayValue}</span>
          </div>

          {/* Analog clock face — click a number to set the hour */}
          <div className="relative mx-auto mt-3 aspect-square w-52 max-w-full sm:w-44">
            <div className="absolute inset-0 rounded-full border border-border bg-gradient-to-b from-muted/40 to-background shadow-inner" />
            {/* hour hand */}
            <div
              className="absolute left-1/2 top-1/2 h-[34%] w-0.5 origin-bottom rounded-full bg-primary/80 transition-transform duration-200 ease-out"
              style={{ transform: `translate(-50%, -100%) rotate(${handAngle}deg)` }}
            />
            <div className="absolute left-1/2 top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />

            {HOURS.map((hour) => {
              const angle = (hour / 12) * 2 * Math.PI;
              const radius = 38; // percent of the face
              const x = 50 + Math.sin(angle) * radius;
              const y = 50 - Math.cos(angle) * radius;
              const isSelected = hour === selectedHour;

              return (
                <button
                  key={hour}
                  type="button"
                  onClick={() => onTimeChange(fromTwelveHourParts(String(hour), minute, period))}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  className={cn(
                    "absolute grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-sm tabular-nums transition-colors sm:size-8",
                    isSelected
                      ? "bg-primary font-semibold text-primary-foreground shadow"
                      : "text-foreground hover:bg-accent active:bg-accent",
                  )}
                >
                  {hour}
                </button>
              );
            })}
          </div>

          {/* AM / PM */}
          <div className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(["AM", "PM"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onTimeChange(fromTwelveHourParts(hour12, minute, value))}
                className={cn(
                  "rounded-md py-2.5 text-sm font-medium transition-colors sm:py-1.5",
                  period === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {value}
              </button>
            ))}
          </div>

          {/* Minutes — 5-minute steps; exact minutes still typeable above */}
          <div className="mt-3">
            <span className="text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground">
              Minutes
            </span>
            <div className="mt-1.5 grid grid-cols-6 gap-1">
              {MINUTE_STEPS.map((value) => {
                const isSelected = value === minute;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onTimeChange(fromTwelveHourParts(hour12, value, period))}
                    className={cn(
                      "rounded-md py-2 text-xs tabular-nums transition-colors sm:py-1",
                      isSelected
                        ? "bg-primary font-semibold text-primary-foreground"
                        : "bg-muted/60 text-foreground hover:bg-accent",
                    )}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onTimeChange(getLocalTimeInputValue(new Date()))}
              className="text-xs font-medium text-primary hover:underline"
            >
              الآن
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              تم
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function toTwelveHourParts(value: string) {
  const [hourRaw = "00", minute = "00"] = value.split(":");
  const hour24 = Number(hourRaw);
  const period: "AM" | "PM" = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return {
    hour12: String(hour12),
    minute,
    period,
  };
}

function fromTwelveHourParts(hour12: string, minute: string, period: "AM" | "PM") {
  const normalizedHour12 = Number(hour12);
  let hour24 = normalizedHour12 % 12;

  if (period === "PM") {
    hour24 += 12;
  }

  return `${String(hour24).padStart(2, "0")}:${minute}`;
}

function toDisplayTimeValue(value: string) {
  const { hour12, minute, period } = toTwelveHourParts(value);
  return `${hour12.padStart(2, "0")}:${minute} ${period}`;
}

function parseDisplayTimeValue(value: string) {
  const normalized = value.trim().toUpperCase();
  const match = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);

  if (!match) {
    return null;
  }

  const [, hourRaw, minute, periodRaw] = match;
  const hour = Number(hourRaw);
  const minuteValue = Number(minute);

  if (hour < 1 || hour > 12 || minuteValue < 0 || minuteValue > 59) {
    return null;
  }

  return fromTwelveHourParts(String(hour), minute, periodRaw as "AM" | "PM");
}

export function getLocalDateInputValue(value: Date) {
  const offset = value.getTimezoneOffset();
  const localValue = new Date(value.getTime() - offset * 60_000);
  return localValue.toISOString().slice(0, 10);
}

export function getLocalTimeInputValue(value: Date) {
  const offset = value.getTimezoneOffset();
  const localValue = new Date(value.getTime() - offset * 60_000);
  return localValue.toISOString().slice(11, 16);
}

export function buildIsoDateTime(date: FormDataEntryValue | null, time: FormDataEntryValue | null) {
  const dateValue = String(date ?? "").trim();
  const timeValue = String(time ?? "").trim();

  if (!dateValue || !timeValue) {
    throw new Error("التاريخ والوقت مطلوبان.");
  }

  const dt = new Date(`${dateValue}T${timeValue}`);

  if (Number.isNaN(dt.getTime())) {
    throw new Error("التاريخ أو الوقت غير صالح.");
  }

  return dt.toISOString();
}
