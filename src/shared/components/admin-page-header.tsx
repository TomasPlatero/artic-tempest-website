import type React from "react";
import Link from "next/link";
import { IconArrowLeft } from "@/shared/ui/tabler-icons";
import { Button } from "@/shared/ui/button";

type AdminPageHeaderProps = {
  title: string;
  description: string;
  backHref?: string;
  action?: React.ReactNode;
};

export function AdminPageHeader({
  title,
  description,
  backHref,
  action,
}: AdminPageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-4 sm:gap-6">
        {backHref ? (
          <Link href={backHref}>
            <Button
              variant="outline"
              size="icon"
              className="size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10  shadow-xl"
            >
              <IconArrowLeft className="size-6" />
            </Button>
          </Link>
        ) : null}
        <div>
          <h1 className="text-3xl font-semibold font-heading italic tracking-tight uppercase flex items-center gap-3">
            {title}
          </h1>
          <p className="text-sm font-medium text-white/40 mt-2 uppercase tracking-widest leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
