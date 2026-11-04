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

### F-02 [P3] open - Coding standards TODO describes starter files this feature removed

**File:** blueprint/context/coding-standards.md:102
**Found:** 2026-11-04 by /audit independent (scope: current; lens: quality)
**Why it matters:** The TODO says the scaffold still ships client/src/App.css and the Vite starter markup, and that dark/light handling is undecided. This feature deleted both and the spec records that there is no theme toggle, so the standards file now misstates the code.
**Suggested fix:** Remove the TODO. No current requirement would be lost.
**Resolution:**
