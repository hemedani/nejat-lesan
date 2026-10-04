import { PanelGuard } from "@/components/system/PanelGuard";
import { PanelScopeProvider } from "@/components/system/PanelScopeProvider";
import { PanelShell } from "@/components/system/PanelShell";

/**
 * The profile panel's chrome.
 *
 * `/user` had no layout at all, so the one panel every unmatched viewer is
 * redirected to was also the only one rendering without a guard, a scope provider
 * or a sidebar — and it did so with hardcoded placeholder data. Same three layers
 * as every other panel: guard, scope, shell.
 *
 * `scopeKind="organization"`: the roles section resolves organization names from
 * the scope provider, and every level but a level-less viewer has one.
 */
export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelGuard panel="profile">
      <PanelScopeProvider>
        <PanelShell panel="profile" scopeKind="organization">
          {children}
        </PanelShell>
      </PanelScopeProvider>
    </PanelGuard>
  );
}