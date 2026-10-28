"use client";

import { Tag } from "@/components/ui/Tag";
import { validateAddress } from "@/lib/address/validate";
import { looksLikeSecret } from "@/lib/address/seedGuard";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/provider";
import { CircleAlert, CircleCheck, ClipboardPaste, X } from "lucide-react";
import { useId, type ClipboardEvent, type RefObject } from "react";

export interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Called when typed or pasted text looks like a seed phrase or key (the field has been cleared). */
  onSecret: () => void;
  /** Accept DEMO- placeholders (mock mode or a backend running on the synthetic fixture). */
  allowDemo: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  disabled?: boolean;
  /** Hide the validation line (stage mode). */
  quiet?: boolean;
  size?: "md" | "lg";
}

/**
 * The address field: monospace, paste and clear buttons, character counter and live FORMAT validation
 * ("format looks valid", never a claim of a perfect check: the backend verifies checksums).
 * Seed phrases and private keys are stopped here: the field is cleared, nothing is sent or stored.
 */
export function AddressInput({ value, onChange, onSecret, allowDemo, inputRef, disabled, quiet, size = "md" }: AddressInputProps) {
  const { t } = useT();
  const id = useId();
  const hintId = `${id}-hint`;
  const check = value.trim() === "" ? null : validateAddress(value, { allowDemo });
  const invalid = check !== null && !check.ok;

  const accept = (raw: string) => {
    if (looksLikeSecret(raw)) {
      onChange("");
      onSecret();
      return false;
    }
    onChange(raw);
    return true;
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (looksLikeSecret(text)) {
      e.preventDefault();
      onChange("");
      onSecret();
    }
  };

  const pasteFromClipboard = async () => {
    try {
      accept((await navigator.clipboard.readText()).trim());
      inputRef?.current?.focus();
    } catch {
      inputRef?.current?.focus(); // clipboard blocked: the person can paste with the keyboard
    }
  };

  return (
    <div>
      <label htmlFor={id} className={cn("mb-[9px] block font-medium", size === "lg" ? "text-body-lg" : "text-body")}>
        {t("check.input.label")}
      </label>
      <div className="relative">
        <input
          id={id}
          ref={inputRef}
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          disabled={disabled}
          value={value}
          placeholder={t("check.input.placeholder")}
          aria-invalid={invalid || undefined}
          aria-describedby={hintId}
          onChange={(e) => accept(e.target.value)}
          onPaste={onPaste}
          className={cn(
            "w-full rounded-input border bg-plaster pr-[118px] pl-[26px] font-mono text-body-lg text-carbon placeholder:font-sans placeholder:text-slate-gray hover:border-obsidian disabled:cursor-not-allowed disabled:text-slate-gray",
            size === "lg" ? "h-[64px]" : "h-[53px]",
            invalid ? "border-block" : "border-carbon",
          )}
        />
        <div className="absolute inset-y-0 right-[7px] flex items-center gap-[2px]">
          {value !== "" && (
            <button type="button" aria-label={t("action.clear")} onClick={() => onChange("")} disabled={disabled} className="inline-flex size-11 items-center justify-center rounded-full hover:bg-bone">
              <X className="size-4" aria-hidden />
            </button>
          )}
          <button type="button" aria-label={t("check.input.pasteAria")} title={t("check.input.pasteAria")} onClick={pasteFromClipboard} disabled={disabled} className="inline-flex size-11 items-center justify-center rounded-full hover:bg-bone">
            <ClipboardPaste className="size-5" aria-hidden />
          </button>
        </div>
      </div>
      <div id={hintId} className="mt-[9px] flex min-h-6 flex-wrap items-center justify-between gap-x-[13px] gap-y-1 text-small" aria-live="polite">
        {quiet ? (
          <span />
        ) : check === null ? (
          <span className="text-ash-gray">{t("safety.public")}</span>
        ) : check.ok ? (
          <Tag tone={check.kind === "demo" ? "bone" : "allow"} className="py-[3px]">
            <CircleCheck className="size-4" aria-hidden />
            {check.kind === "demo" ? t("check.input.demo") : t("check.input.valid")}
          </Tag>
        ) : (
          <span className="inline-flex items-center gap-[7px] font-semibold text-block-ink">
            <CircleAlert className="size-4 flex-none" aria-hidden />
            {check.reason === "mixed_case" ? t("check.input.err.mixed") : t("check.input.err.format")}
          </span>
        )}
        {!quiet && value !== "" && <span className="text-ash-gray">{t("check.input.counter", { n: value.length })}</span>}
      </div>
    </div>
  );
}
