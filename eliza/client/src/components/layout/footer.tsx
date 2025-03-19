export function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex flex-col sm:flex-row items-center justify-between py-6 gap-4">
        <div className="flex items-center gap-2">
          <img
            alt="ElizaOS Logo"
            className="h-8 w-8"
            src="/elizaos-icon.png"
          />
          <span className="text-lg font-semibold">ADAS</span>
        </div>
        <div className="flex gap-4">
          <a
            href="/agents"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Agents
          </a>
          <a
            href="/docs"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Documentation
          </a>
        </div>
        <div className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} ADAS. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
