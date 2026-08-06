"use client";

import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Switch } from "@/shared/ui/switch";

export function SeoTextareaField({
  label,
  description,
  value,
  onChange,
  placeholder,
  rows = 4,
  className,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  }) {
  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <Label className="text-[10px] uppercase tracking-[0.28em] text-white/45">
        {label}
      </Label>
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="min-h-28 rounded-2xl border-white/10 bg-background/55 text-sm text-white placeholder:text-white/30"
      />
    </div>
  );
}

export function SeoSwitchField({
  label,
  description,
  checked,
  onCheckedChange,
  className,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  className?: string;
  }) {
  return (
    <div className={className ? `flex items-start justify-between gap-4 rounded-[22px] border border-white/10 bg-background/35 p-4 ${className}` : "flex items-start justify-between gap-4 rounded-[22px] border border-white/10 bg-background/35 p-4"}>
      <div className="space-y-1">
        <Label className="text-sm font-medium text-white">{label}</Label>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
