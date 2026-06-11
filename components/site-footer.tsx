export const dynamic = "auto";

export async function SiteFooter() {
  return (
    <footer className="py-2 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-wrapper">
        <div className="container flex flex-col items-center justify-center py-4 space-y-2">
          <div className="max-w-3xl text-xs leading-relaxed text-center sm:text-sm text-balance text-muted-foreground">
            Dev Jhawar © 2026
          </div>
          <div className="text-xs text-center sm:text-sm text-muted-foreground">
            Developed with ❤️
          </div>
        </div>
      </div>
    </footer>
  );
}