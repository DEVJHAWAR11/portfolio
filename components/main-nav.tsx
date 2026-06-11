"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { Icons } from "./icons";

export function MainNav() {
  const pathname = usePathname();

  return (
    <div className="mr-4 hidden md:flex">
      <Link href="/" className="mr-6 flex items-center gap-2.5">
        <Icons.logo className="h-6 w-6" />
        <span className="hidden font-semibold tracking-tight lg:inline-block">
          {siteConfig.name}
        </span>
      </Link>
      <nav className="flex items-center gap-6 text-sm">
        <Link
          href="/"
          className={cn(
            "transition-colors hover:text-foreground",
            pathname === "/"
              ? "font-medium text-foreground"
              : "text-muted-foreground"
          )}
        >
          Home
        </Link>

        <Link
          target="_blank"
          href={siteConfig.links.linkedin}
          className="group flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          LinkedIn
          <ExternalLink className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>

        <Link
          href={siteConfig.links.resume}
          target="_blank"
          className="group flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          Resume
          <ExternalLink className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </nav>
    </div>
  );
}