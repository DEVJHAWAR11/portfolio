"use client";

import * as React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Button } from "./ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "./ui/hover-card";
import { Code2, ExternalLink } from "lucide-react";
import { SiLeetcode, SiCodeforces, SiCodechef } from "react-icons/si";

const codingPlatforms = [
  {
    name: "LeetCode",
    href: siteConfig.links.leetcode,
    icon: SiLeetcode,
    color: "#FFA116",
    bgHover: "hover:bg-[#FFA116]/10",
  },
  {
    name: "Codeforces",
    href: siteConfig.links.codeforces,
    icon: SiCodeforces,
    color: "#1F8ACB",
    bgHover: "hover:bg-[#1F8ACB]/10",
  },
  {
    name: "CodeChef",
    href: siteConfig.links.codechef,
    icon: SiCodechef,
    color: "#5B4638",
    bgHover: "hover:bg-[#5B4638]/10",
  },
];

export function CodingProfiles() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <HoverCard open={isOpen} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full transition-all hover:scale-105 hover:bg-muted"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Coding Profiles"
        >
          <Code2 className="h-[18px] w-[18px]" />
        </Button>
      </HoverCardTrigger>
      <HoverCardContent
        align="center"
        sideOffset={8}
        className="w-52 p-2"
      >
        <div className="space-y-1">
          <p className="px-2 pb-1.5 text-xs font-medium text-muted-foreground tracking-wide uppercase">
            Coding Profiles
          </p>
          <div className="h-px bg-border/60" />
          {codingPlatforms.map((platform) => (
            <Link
              key={platform.name}
              href={platform.href}
              target="_blank"
              rel="noreferrer"
              onClick={() => setIsOpen(false)}
              className={`group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-200 ${platform.bgHover} hover:translate-x-0.5`}
            >
              <platform.icon
                className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                style={{ color: platform.color }}
              />
              <span className="flex-1">{platform.name}</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
