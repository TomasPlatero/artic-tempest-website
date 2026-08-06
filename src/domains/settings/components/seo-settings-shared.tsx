"use client";

import { Label } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";
export { SeoTextareaField, SeoSwitchField } from "./seo-settings-form-fields";

export function SeoTextField({
  label,
  description,
  value,
  onChange,
  placeholder,
  type = "text",
  className,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </Label>
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        className="bg-background/60"
      />
    </div>
  );
}
