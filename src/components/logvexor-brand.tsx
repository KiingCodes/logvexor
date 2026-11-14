import { ShieldCheck } from "lucide-react";

import { Link } from "@tanstack/react-router";

export function LogVexorBrand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5 text-foreground" aria-label="LogVexor home">
      <span
        className={`grid size-9 place-items-center rounded-md ${inverse ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground"}`}
      >
        <ShieldCheck className="size-5" strokeWidth={2.2} />
      </span>
      <span className={`font-display text-[17px] font-semibold ${inverse ? "text-primary-foreground" : "text-foreground"}`}>
        LogVexor
      </span>
    </Link>
  );
}