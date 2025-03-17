import { NavLink } from "react-router";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between md:py-12">
        <div className="flex flex-col gap-2">
          <NavLink to="/" className="flex items-center gap-2">
            <img src="/elizaos-icon.png" alt="ElizaOS Logo" className="h-6 w-auto" />
            <span className="font-bold">ElizaOS</span>
          </NavLink>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ElizaOS. All rights reserved.
          </p>
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          <NavLink to="/agents" className="text-sm font-medium hover:text-primary">
            Agents
          </NavLink>
          <NavLink to="https://elizaos.github.io/eliza/docs/intro/" target="_blank" className="text-sm font-medium hover:text-primary">
            Documentation
          </NavLink>
          <NavLink to="#" className="text-sm font-medium hover:text-primary">
            Privacy Policy
          </NavLink>
          <NavLink to="#" className="text-sm font-medium hover:text-primary">
            Terms of Service
          </NavLink>
        </div>
      </div>
    </footer>
  );
}
