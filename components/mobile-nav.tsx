"use client";

import * as React from "react";
import Link, { LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { docsConfig } from "@/config/docs";
import { cn } from "@/lib/utils";
import { useMetaColor } from "@/hooks/use-meta-color";
import { Button } from "./ui/button";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { ModeSwitcher } from "./mode-switcher";
import { siteConfig } from "@/config/site";
import { Icons } from "./icons";

export function MobileNav() {
  const [mounted, setMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [time, setTime] = React.useState(new Date());
  const { setMetaColor, metaColor } = useMetaColor();

  React.useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const onOpenChange = React.useCallback(
    (open: boolean) => {
      setOpen(open);
      setMetaColor(open ? "#09090b" : metaColor);
    },
    [setMetaColor, metaColor]
  );

  const formattedTime = mounted ? time.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }) : "00:00 AM";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full transition-all hover:scale-105 hover:bg-muted md:hidden"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
          </svg>
        </Button>
      </DrawerTrigger>

      <DrawerTitle className="sr-only">Navigation Menu</DrawerTitle>
      
      <DrawerContent className="h-[88vh] border-t border-border/40 bg-background/95 backdrop-blur-xl">
        <div className="flex h-full flex-col">
          {/* Compact Header */}
          <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
            <div className="flex items-center gap-2.5">
              <Icons.logo className="h-5 w-5" />
              <span className="text-base font-semibold">{siteConfig.name}</span>
            </div>

            <div className="flex items-center gap-1">
              {/* Small Clock with AM/PM */}
              <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span className="text-xs font-medium tabular-nums">{formattedTime}</span>
              </div>

              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
                <div><ModeSwitcher className="h-4 w-4" /></div>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Main Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="space-y-6">
              {/* Primary Nav */}
              <div className="space-y-1">
                <MobileLink
                  href="/"
                  onOpenChange={setOpen}
                  className="group flex items-center justify-between rounded-xl border border-border/40 bg-muted/30 px-4 py-3 text-sm font-medium transition-all hover:border-border hover:bg-muted/50"
                >
                  <span>Home</span>
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </MobileLink>
              </div>

              {/* All Sections - Modern Cards */}
              {docsConfig.sidebarNav.map((section, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/50 to-transparent" />
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                      {section.title}
                    </h3>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border/50 to-transparent" />
                  </div>
                  <div className="space-y-1">
                    {section?.items?.map((item: any) => (
                      item.href && !item.disabled && (
                        <MobileLink
                          key={item.href}
                          href={item.href}
                          onOpenChange={setOpen}
                          className="group flex items-center justify-between rounded-lg border border-border/30 bg-background/50 px-3 py-2.5 text-sm transition-all hover:border-border/60 hover:bg-muted/30"
                        >
                          <span className="font-medium">{item.title}</span>
                          <div className="flex items-center gap-2">
                            {item.label && (
                              <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                                {item.label}
                              </span>
                            )}
                            <svg className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </MobileLink>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>


        </div>
      </DrawerContent>
    </Drawer>
  );
}

interface MobileLinkProps extends LinkProps {
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

function MobileLink({ href, onOpenChange, className, children, ...props }: MobileLinkProps) {
  const router = useRouter();
  return (
    <Link
      href={href}
      onClick={() => {
        router.push(href.toString());
        onOpenChange?.(false);
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </Link>
  );
}