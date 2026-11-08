# Feature: UX polish

**From build-plan:** feature 14
**Build attempt:** 1
**Branch:** feature/ux-polish
**Status:** verified

## Goal

Make the app feel finished on every screen: loading skeletons in place of
"Loading..." text, clear and helpful empty states, short toast confirmations
after the user changes their library or lists, a collapsible navbar on narrow
screens, and a keyboard accessibility pass (skip link, consistent focus rings,
full keyboard operation). Client only; no API, data, or server change.

## In scope

- **Loading skeletons** for the page-level data views: home movie rows
  (`MovieSection`), search results (first load), movie details, library,
  lists, list details, and profile.
- **Empty states** as one shared presentation for: library *Want to watch* and
  *Watched* tabs, lists page, list details with no movies, search with no
  matches, search idle prompt, and a home row with no movies.
- **Toast notifications** confirming successful user actions: watchlist
  add/remove, mark watched/unwatched, list created, list renamed, list deleted,
  movie removed from a list.
- **Responsive navbar**: below 860px, a Menu button toggles a panel holding the
  main links and the account controls; 860px and up keeps today's layout.
- **Keyboard accessibility pass**: a skip link, one consistent visible focus
  ring for every focusable element, and a walkthrough of every route fixing
  any control that cannot be reached or operated by keyboard.

## Out of scope

- Any server, API, or data-model change.
- Replacing the existing inline error messages (`role="alert"` next to the
  failing control) with toasts. Errors stay inline where they are announced
  and associated today; toasts are for success only.
- Toasts for star ratings and for the Add-to-list dialog checkboxes. The stars
  and checkboxes already show the new state, and the modal dialog sits in the
  top layer above any toast.
- Skeletons for small inline loads: the Add-to-list dialog's list, "Load more"
  on search, and the genre filter's "Loading genres..." option. They keep
  their current text.
- Moving focus on route change, page titles per route, and light mode.
- Release work (feature 15) and anything under "Later".
- A test runner or browser harness (opt-in via `/tests`).

## Build loop

`workflow.stepReview` is `feature`: build all steps, then stop once for review
at the end. `workflow.checkpointCommits` is `disabled`: no commits between
steps; `/complete` makes the single feature commit. After each step run
`npm run lint` from the repo root and `npm run build` in `client/`.

## Build steps

- [x] **1. Focus ring and skip link.**
  - In `client/src/index.css` `@layer base`, add one `:focus-visible` rule:
    2px solid `var(--color-accent)` outline with 2px offset. Utilities that
    already set `outline-none` (the movie card link, which draws its ring on
    the poster; `tabIndex={-1}` focus targets) keep winning because utilities
    sit above the base layer. Remove nothing else in this step.
  - In `Layout.jsx`, add a "Skip to main content" link as the first focusable
    element: visually hidden until focused (`sr-only focus:not-sr-only` plus
    positioned, raised-surface styling), pointing at `#main-content`. Give
    `<main>` `id="main-content"` and `tabIndex={-1}` with `outline-none`, so
    activating the link moves focus there.
  - Done when: lint and build pass; in the browser, the first Tab on any route
    shows the skip link, Enter moves focus into main (next Tab lands on the
    first control in the page), and the navbar links, logo, footer link and
    inline text links (e.g. 404 "Go back home") all show the accent ring when
    tabbed to, while movie cards still show the ring only on the poster.

- [x] **2. Responsive navbar.**
  - In `Navbar.jsx`, below 860px show the logo and a Menu button at the right
    (hamburger icon, `aria-label="Menu"`, `aria-expanded`, `aria-controls`
    pointing at the panel). The panel holds the existing Main nav and the
    single `AccountNav` instance, stacked, and pushes the page content down
    (in flow, not an overlay, no focus trap).
  - At 860px and up, hide the button and show the panel inline exactly as
    today (`min-[860px]:flex` or equivalent), so `AccountNav` renders once
    and its logout pending/error state is not duplicated.
  - The menu starts closed, closes on any location change (`useLocation`
    pathname or search), and closes on Escape while focus is inside the panel
    or on the button, returning focus to the Menu button.
  - Main links in the open panel are full-width rows with at least 40px tap
    height; the active link keeps `aria-current="page"` from `NavLink`.
  - Done when: lint and build pass; at 320px and 375px wide the header shows
    only the logo and Menu button with no horizontal scroll; the button
    toggles the panel and its `aria-expanded`; choosing a link navigates and
    closes it; Escape closes it and focuses the button; signed-in (username,
    Log out, logout error) and signed-out (Log in, Register) account controls
    work from the panel; at 860px+ the header looks and behaves as before.

- [x] **3. Loading skeletons.**
  - Add `client/src/components/feedback/Skeletons.jsx` with small
    presentational pieces built from one base block
    (`animate-pulse rounded bg-surface-raised motion-reduce:animate-none`):
    a movie card skeleton (2:3 poster at `--poster-width` with 10px corners,
    two title lines, year line), a movie row skeleton (6 cards in the same
    sideways flex row as `MovieRow`, overflow hidden), a movie grid skeleton
    (12 cards in the same grid classes as `MovieGrid`), a list-cards skeleton
    (4 cards in the `ListsPage` grid), a profile skeleton (4 stat cards in the
    `ProfilePage` grid plus two panels), and a details skeleton (poster plus
    heading and text lines in the `MovieHero` layout; check its classes).
  - Every skeleton wrapper is `aria-hidden="true"`. Each view keeps its
    existing loading text as a visually hidden `role="status"` sibling
    (e.g. `<p role="status" className="sr-only">Loading your library...</p>`),
    so screen reader output does not change.
  - Swap the visible loading text for the matching skeleton in
    `MovieSection.jsx`, `SearchResults.jsx` (first load only),
    `MovieDetails.jsx`, `LibraryPage.jsx`, `ListsPage.jsx`,
    `ListDetailsPage.jsx` (heading line plus grid), and `ProfilePage.jsx`.
    Retry flows keep their current focus handling.
  - Done when: lint and build pass; with the network throttled, each listed
    view shows a skeleton the same size and layout as its loaded content (no
    large jump when data arrives), the pulse stops with reduced motion
    enabled, and a screen reader (or the accessibility tree) still exposes the
    loading status text and no skeleton content.

- [x] **4. Empty states.**
  - Add `client/src/components/feedback/EmptyState.jsx`: a bordered,
    centered surface panel (`rounded-card border border-border bg-surface
    shadow-soft`) with a decorative `aria-hidden` icon, a short title, an
    optional message, and an optional action (a `Link` or children). It
    accepts and forwards `ref`, `tabIndex`, and `role` so existing focus
    targets keep working (React 19 `ref` as a prop, as `MovieGrid` does).
    Text is rendered as React children only (no HTML injection); long user
    text such as a search query wraps (`wrap-anywhere`).
  - Use it for:
    - Library *Want to watch*: "Nothing on your watchlist yet", link "Find a
      movie" to `/search`. *Watched*: "Nothing watched yet", same link.
    - Lists page: "No lists yet", message "Create your first one above."
    - List details with no movies: "No movies in this list yet", link "Find
      movies" to `/search`. Keep `emptyRef` and `tabIndex={-1}` so focus
      still lands here after removing the last movie.
    - Search no matches: keep the current `emptyMessage` text,
      `role="status"`, `emptyRef`, and `tabIndex={-1}` behavior.
    - Search idle prompt ("Type a movie title or choose a filter to search.").
    - Home row with no movies: keep the inline muted text style but inside
      the row's space; a compact variant is fine.
  - Leave the cast "No cast information available.", the Add-to-list dialog
    empty text, and the profile panels' own empty text as they are.
  - Done when: lint and build pass; each listed empty state renders the panel
    with its title and action, links navigate, removing the last movie from a
    list moves focus to the empty panel, and a search with no matches is
    still announced.

- [x] **5. Toast notifications.**
  - Add `client/src/context/ToastContext.jsx` (provider plus context),
    `client/src/hooks/useToast.js` (returns `showToast(message)`), and
    `client/src/components/feedback/Toaster.jsx` (the rendered stack). Mount
    the provider in `main.jsx` inside `AuthProvider`, wrapping `App`.
  - The toast region is always in the DOM (empty when idle) as a
    `role="status"` (`aria-live="polite"`) container fixed at the bottom
    right (bottom center, full width minus 16px gutters, below 480px), above
    page content (`z-50`). New toasts append; at most 3 show, oldest dropped
    first. Each toast is a raised surface panel with a soft shadow, the
    message as plain React text (titles and list names may be long; wrap
    with `wrap-anywhere`), and a close button
    (`aria-label="Dismiss notification"`, X icon).
  - Each toast dismisses itself after 5 seconds. The timer pauses while the
    pointer is over the toast or focus is inside it, and restarts on leave.
    Showing a toast never moves focus. Enter/exit motion is a short fade and
    is disabled under `motion-reduce`. Ids come from an incrementing counter
    in the provider.
  - The provider clears all toasts when auth `status` leaves
    `authenticated`, so no movie or list name lingers after logout.
  - Call `showToast` only after the awaited action resolves (never on
    failure):
    - `WatchlistButton`: "Added {title} to your watchlist" / "Removed {title}
      from your watchlist".
    - `WatchedButton`: "Marked {title} as watched" / "Marked {title} as not
      watched" (check its current add/remove semantics and match the wording
      to what the action actually does).
    - `CreateListForm` / `useLists.createList`: "Created list {name}".
    - `EditListForm`: "Renamed list to {name}" (or "Saved list {name}" if
      only the description changed; keep it to one message if the form does
      not distinguish).
    - `ListDetailsPage` delete: "Deleted list {name}" before navigating.
    - `ListDetailsPage` `RemoveButton`: "Removed {title} from {list name}".
  - Done when: lint and build pass; each action above shows its toast once
    on success and none on a forced failure (e.g. server stopped), the inline
    error still appears on failure, toasts stack to 3 and auto-dismiss after
    about 5s, hover or focus pauses dismissal, the close button removes a
    toast by keyboard, a screen reader announces the message without focus
    moving, and logging out clears visible toasts.

- [x] **6. Keyboard walkthrough and fixes.**
  - Tab through every route signed out (`/login`, `/register`, 404) and
    signed in (`/`, `/search` with filters and Load more, `/movie/:tmdbId`
    including stars, trailer, similar row, Add-to-list dialog, `/library`
    tabs, `/lists`, `/lists/:id` rename, delete, remove, `/profile`) at
    desktop and 375px widths, with the mobile menu open and closed.
  - Every interactive control must be reachable in a logical order, show the
    focus ring, and work with Enter/Space (and arrows where the pattern needs
    them: library tabs, Headless UI listboxes, star rating as it works
    today). Escape closes the menu and the dialog. Focus never lands on a
    hidden or off-screen element (e.g. the closed mobile panel).
  - Fix any gap found in the component that owns it, keeping the fix small
    and listed in the review handoff. If nothing is found, say so.
  - Done when: lint and build pass and the walkthrough record lists each
    route checked, with any fix made.

## Files / areas

- `client/src/index.css` - base `:focus-visible` rule.
- `client/src/components/layout/Layout.jsx` - skip link, `main` id.
- `client/src/components/layout/Navbar.jsx`, `AccountNav.jsx` - mobile menu
  and panel layout (AccountNav classes may need to stack inside the panel).
- `client/src/components/feedback/Skeletons.jsx`, `EmptyState.jsx`,
  `Toaster.jsx` - new.
- `client/src/context/ToastContext.jsx`, `client/src/hooks/useToast.js` - new.
- `client/src/main.jsx` - mount `ToastProvider`.
- `client/src/components/movies/MovieSection.jsx`, `SearchResults.jsx`,
  `MovieDetails.jsx`, `WatchlistButton.jsx`, `WatchedButton.jsx`.
- `client/src/pages/LibraryPage.jsx`, `ListsPage.jsx`, `ListDetailsPage.jsx`,
  `ProfilePage.jsx`, `SearchPage.jsx`.
- `client/src/components/lists/CreateListForm.jsx`, `EditListForm.jsx`
  (or their hooks, whichever learns about success).
- Any component a step 6 fix touches.

## Data / contracts

- No API, route, or persisted-data change. No new dependency: Tailwind
  `animate-pulse`, native `<dialog>`, React context, and the installed
  `@headlessui/react` cover everything.
- Toast context contract: `showToast(message: string)`; messages are plain
  text, rendered as React text nodes. Internal state is
  `{ id: number, message: string }[]`, capped at 3, in memory only.
- Breakpoint for the mobile menu is the project's existing `min-[860px]`.

## Testing

No unit or browser test command exists, so tests are not a gate. Evidence per
step is `npm run lint` (root), `npm run build` (`client/`), and a manual
browser walkthrough with the dev servers, recorded in the review handoff.
Baseline observed while writing this spec: root `npm run lint` passed for
client and server, and `client` `npm run build` succeeded. No visual, screen
reader, or live-data evidence was gathered yet.

## Notes for the AI

- Keep existing focus logic intact: library card-removal focus, list
  details `emptyRef` and Movies heading focus, search `emptyRef`/focusCard,
  retry handlers that focus a container first, and dialog trigger refocus.
- Toasts must not replace or remove any inline `role="alert"` error.
- Skeletons are decorative: `aria-hidden`, with the old loading copy kept as
  sr-only `role="status"` text.
- Reuse existing tokens (`bg-surface-raised`, `shadow-soft`, `rounded-card`,
  `--poster-width`) and button style constants (`PRIMARY_BUTTON`,
  `SECONDARY_BUTTON`, `actionButtonClass`) rather than new ones.
- Respect `motion-reduce` for pulse, toast fade, and menu transitions.
- Dark only; no new colors beyond the `@theme` tokens.

## Implementation notes

- Steps 1-5 pass `npm run lint` (root, client and server) and `npm run build`
  (`client/`). Their browser done-whens are not yet observed; no dev server
  was run during `/implement`.
- Toasts fade in (`starting:opacity-0`) but leave instantly; an exit fade would
  need delayed removal state, so it was left out.
- Toast wording: watched-to-want reads "Moved “{title}” back to Want to
  watch" to match what the action does; list edits read "Saved list “{name}”".
- A focused toast close button sends focus to `#main-content`
  (`preventScroll`) so keyboard focus is not dropped to `<body>`.
- Step 6 code audit: every `tabIndex={-1}` focus target keeps `outline-none`;
  the movie card link keeps its poster ring; star buttons, listboxes, library
  tabs, the native `<dialog>`, and `EditListForm` Escape already handle
  keyboard input. No code gap found.
- Browser evidence (2026-11-08): the user ran the done-whens for steps 1-6
  manually against the running dev servers and reported all as working. No
  agent-driven browser evidence was captured (no browser automation available).


<!-- blueprint:completion {"schemaVersion":2,"specBytes":16153,"specSha256":"ea95005b3d9518b433ab07463a03311fef88148619c822648a0277788afc6a71","branch":"refs/heads/feature/ux-polish","head":"bb2aa0bba0ee17edde0c7f62d5e8f85f2f245412","baseRef":"refs/heads/main","baseCommit":"bb2aa0bba0ee17edde0c7f62d5e8f85f2f245412","sourceTree":"b1153d9079df636b3714cee95860f19584a987e0","landing":"local-merge","absentOptional":[]} -->

## Try it now

Run or do:

Run `npm run dev` from the repo root (or reuse the running servers), open http://localhost:5173/ signed in with your account, and click the bookmark (Watchlist) icon on any movie card in the Top 10 trending row.

Expected:

A toast appears at the bottom right reading "Added “<movie title>” to your watchlist", with a close (X) button, and disappears on its own after about 5 seconds. Clicking the icon again shows "Removed “<movie title>” from your watchlist" and undoes the change.

This proves:

The toast provider is mounted app-wide and a successful library action shows its confirmation toast, which then closes itself.
