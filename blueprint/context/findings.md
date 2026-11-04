# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to land while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

### F-01 [P3] open - client/README.md is still the Vite template

**File:** client/README.md:1
**Found:** 2026-11-04 by /audit independent (scope: current; lens: quality)
**Why it matters:** Step 4's done-when says no starter content remains, but this file still opens with "# React + Vite" and describes the template. It is not on the spec's delete list and the In scope bullet names only markup and assets, so this is a loose end rather than a broken contract. Nothing renders it.
**Suggested fix:** Delete client/README.md or replace it with a line pointing at the root README. No current requirement would be lost.
**Resolution:**

### F-04 [P3] unverified - Form alert may not be announced when it stops being display:none

**File:** client/src/pages/LoginPage.jsx:25
**Found:** 2026-11-04 by /audit (scope: current; lens: quality)
**Why it matters:** The `role="alert"` element stays mounted, which helps announcements, but `empty:hidden` removes it from the accessibility tree until text arrives. Some browser and screen reader pairs announce a live region unreliably when it becomes visible and gains content in one update. The same markup is in RegisterPage.jsx:25. The DOM and visible text were checked in Chrome, but no screen reader was run, so this is a lead and not a confirmed defect.
**Suggested fix:** Test the failed-login message with NVDA or Narrator. If it is not announced, remove `empty:hidden` and drop the empty element's spacing another way. No current requirement would be lost.
**Resolution:** Re-examined by /audit independent at c006fba and still unverified, since no screen reader was run. The delta moved the lines above by one and adds the same pattern to the logout error at client/src/components/layout/AccountNav.jsx:59, so any test should cover that region too.

### F-05 [P3] open - "Try again" drops keyboard focus on every session retry

**File:** client/src/components/auth/ProtectedRoute.jsx:7
**Found:** 2026-11-04 by /audit independent (scope: current; lens: quality)
**Why it matters:** `retrySession` sets `loading` first (client/src/context/AuthContext.jsx:79), so the guard swaps the error block for the status text and React removes the focused "Try again" button (ProtectedRoute.jsx:23). Focus falls back to the document body. If the check fails again during an outage, a keyboard user has to Tab back through the navbar for each retry. This follows the spec's state table and is not a route change, so Feature 14's route-focus work does not obviously cover it. Found by reading the code path, not run in a browser.
**Suggested fix:** Move focus to the new "Try again" button when the guard re-enters `error` after a retry, or keep the button mounted with `aria-disabled` during the retry. No current requirement would be lost.
**Resolution:**
