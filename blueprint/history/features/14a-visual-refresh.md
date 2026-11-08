# Feature: Visual refresh

**From build-plan:** feature 14a
**Build attempt:** 1
**Branch:** feature/visual-refresh
**Status:** verified

## Goal

Give every page the planned look: accent-gradient text on the logo's "Manager"
and page headings, soft shadows on raised surfaces, and movie card actions as
one compact row of labelled icon buttons. No behavior, data or API changes.

## Design reference

`blueprint/context/project-overview.md` -> **Visual direction** (colors, gradient
`#4da3ff` -> `#7dbcff` for text only, soft shadows on cards/panels/menus/dialogs,
movie card layout). `prototypes/` was deleted in feature 4, so the overview is
the only reference; there is no screenshot.

## In scope

- Theme tokens in `client/src/index.css`: a soft shadow token and a
  `text-gradient` utility (Tailwind v4 `@utility`) built from the accent and
  accent-hover colors.
- Gradient text on the logo's "Manager" and on every visible page `<h1>`
  (Search, Library, Lists, list details, list not found, Profile, Log in,
  Register, Page not found, movie title in the details hero, Movie not found).
  The home page has only a `sr-only` h1, so its visible lead heading, the
  ranked *Top 10* section heading, gets it too. Body text, section `<h2>`s and
  other text stay solid.
- Soft shadows on cards (movie posters at rest, stat cards, list cards on
  `/lists`), panels (auth forms, create/edit list forms, rating distribution,
  top genres, trailer frame), menus (filter listbox) and dialogs (add-to-list).
  Hover keeps the existing stronger `shadow-lift` on posters.
- Movie card actions: Watchlist, Watched and Add to list as one compact row of
  square icon buttons, each with its existing accessible name and a visible
  tooltip on hover and keyboard focus. Stars get their own line under the row
  only once the movie is watched, as today.
- The details hero keeps text labels (there is room) but gains the same icons
  and lays the buttons out in a row; its stars stay always visible
  (`alwaysShowRating`).
- A styling pass over home, search, details, library, lists, list details,
  profile, auth and 404 pages so spacing, borders, panels and buttons use the
  same tokens and the new shadows/gradient consistently.

## Out of scope

- Loading skeletons, empty-state redesigns, toasts, responsive/mobile navbar and
  the keyboard accessibility pass (feature 14).
- New pages, routes, API calls, server changes or library behavior changes.
- An icon library or any new dependency; icons are small inline SVGs.
- Changing the list details page's **Remove** button into an icon (it is not
  one of the three planned card actions); it only gets the shared styling.
- Replacing `window.confirm` prompts.

## Build loop

`workflow.stepReview` is `feature`: build all steps, then stop for one review at
the end. `workflow.checkpointCommits` is `disabled`: no commits per step;
`/complete` creates the feature commit. Run `npm run lint` from the root after
each step.

## Build steps

- [x] **1. Tokens and gradient text.** In `client/src/index.css` add
  `--shadow-soft` to `@theme` (a low, diffuse dark shadow, e.g.
  `0 6px 18px rgba(0, 0, 0, 0.35)`, tuned by eye) and an `@utility
  text-gradient` that sets `background-image: linear-gradient(90deg,
  var(--color-accent), var(--color-accent-hover))`, `background-clip: text`
  (with `-webkit-` prefix) and `color: transparent`. Under
  `@media (forced-colors: active)` the utility falls back to solid text
  (`color: CanvasText; background: none`). Apply `text-gradient` to the logo's
  "Manager" span in `Navbar.jsx` (replacing `text-accent`), every visible h1
  listed in scope, and the ranked heading in `MovieSection.jsx`. Wrapping
  titles (`wrap-anywhere`, `break-words`) keep working; use
  `box-decoration-clone` if a wrapped line loses its gradient.
  **Done when:** every listed heading and the logo render the blue gradient,
  long movie and list names still wrap without clipped glyph tails
  (descenders), section h2s stay solid, and `npm run lint` passes.

- [x] **2. Soft shadows.** Add `shadow-soft` to the surfaces named in scope:
  `StatCard`, `RatingDistribution`, `TopGenres`, list cards in `ListsPage`,
  `CreateListForm`, `EditListForm`, the Login and Register form panels,
  `TrailerEmbed`'s frame, the add-to-list `<dialog>`, and the resting poster in
  `MovieCard` and `MovieHero`. `FilterSelect`'s listbox keeps `shadow-lift`
  (menus float higher). The poster hover keeps `shadow-lift`.
  **Done when:** those surfaces show a visible soft shadow on the `#080b12`
  page, posters still lift on hover, and `npm run lint` passes.

- [x] **3. Action icons.** Add `client/src/components/movies/ActionIcons.jsx`
  exporting small `aria-hidden` inline SVG icons that inherit `currentColor`:
  a bookmark (outline and filled for saved), an eye or check for watched
  (outline and filled), a list-plus for add to list, and a retry arrow.
  State must not rely on color alone: saved and watched use the filled shape.
  **Done when:** the module lints and is not yet rendered anywhere it changes
  behavior.

- [x] **4. Compact action row on cards.** Give `LibraryControls` a `compact`
  prop and pass it to `WatchlistButton`, `WatchedButton` and
  `AddToListButton`. `MovieCard` renders `<LibraryControls movie compact />`.
  In compact mode:
  - The three buttons sit in one `flex flex-wrap gap-1.5` row as square icon
    buttons (about 32px, never below 24px for target size), using the same
    idle/saved/watched/pending color classes as today. Replace
    `BUTTON_BASE_CLASS`'s `w-full` with a full-width variant only where the
    text buttons still need it, so `ListDetailsPage`'s Remove button keeps its
    current width.
  - Accessible names stay exactly as today (`Watchlist: <title>`,
    `Watched: <title>`, `Add to list: <title>`, `Retry loading watchlist`), as
    do `aria-pressed`, `aria-busy`, `aria-disabled` and `aria-haspopup`.
  - Each button shows a tooltip with its short label (*Watchlist*, *Watched*,
    *Add to list*, *Retry*) on hover and on `:focus-visible`. Build it as an
    `aria-hidden` span inside the button positioned above it (CSS only,
    `group-hover`/`group-focus-visible`, `whitespace-nowrap`, raised surface
    with `shadow-soft`, `motion-reduce` safe). Above the button keeps it inside
    the card, so the Top 10 row's horizontal scroll container does not clip it
    vertically; check the first card in a row and anchor the tooltip to the
    button's left edge if it is clipped horizontally.
  - Existing rules are preserved: the watchlist button is hidden once the movie
    is watched (so the row shows Watched and Add to list), `WatchedButton`
    keeps its place in the tree so focus survives the press, and the stars
    render on their own line below the row only when watched.
  - Each button's `Couldn't update` alert spans the full row width
    (`basis-full`) under the buttons instead of squeezing between them.
  - Loading state keeps the inert watchlist icon button; error state shows the
    retry icon button.
  Non-compact (details hero): same icons before the existing text labels, buttons
  in a wrapping row instead of the `w-40` column; stars stay always visible
  below.
  **Done when:** on home rows, search, library and list grids each card shows
  one row of three (or two, once watched) icon buttons with tooltips on hover
  and Tab focus; toggling watchlist/watched, rating and the add-to-list dialog
  behave exactly as before (including focus return to the trigger and the
  move-back confirm); the details hero shows icon+label buttons in a row;
  Top 10 titles and buttons still line up under the posters; and
  `npm run lint` passes.

- [x] **5. Styling pass.** Walk home, search (including filters), details
  (hero, cast, trailer, similar), library tabs, lists, list details, profile,
  login, register and 404. Align heading sizes and spacing, panel padding and
  borders, link and button styles (`listStyles.js`, `MovieSection`'s retry
  button, `LibraryPage` tabs) so all pages share the new look. No markup
  changes that alter roles, names, focus order or loading/empty/error states.
  **Done when:** each listed page renders with the shared gradient headings,
  soft-shadowed surfaces and consistent spacing at 320px and desktop widths,
  every existing loading, empty and error state still appears, the client
  builds (`npm run build` in `client/`), and `npm run lint` passes.

- [x] **6. Card alignment and missing posters (review change).** The card's
  action row no longer sticks to the card bottom (`mt-auto` removed), so cards
  without stars have no gap between the year and the buttons. Each card always
  reserves two title lines (`line-clamp-2`, longer titles end in an ellipsis
  visually, full text stays in the DOM) and one year line, so the buttons line
  up across a row; stars appear below the row only once watched. Movies without
  a poster show a muted, centered "No poster available" (`aria-hidden`, like the
  decorative poster image) in the poster area on cards and in the details hero.
  **Done when:** cards in one row have their button rows at the same height
  whether or not some show stars, no card has empty space between year and
  buttons, posterless movies show the placeholder text, the client builds, and
  `npm run lint` passes.

- [x] **7. Pointer cursor on clickable controls (review change).** One base
  rule in `client/src/index.css` gives enabled buttons, `role="button"`
  elements, checkboxes, their wrapping labels and `summary` the pointer cursor
  (Tailwind v4 defaults buttons to the arrow). Links already use it; disabled
  controls and buttons with their own `cursor-default`/`cursor-not-allowed`
  busy or inactive class keep that cursor.
  **Done when:** hovering any enabled button, tab, star, checkbox row or filter
  shows the pointer, disabled or busy controls do not, the client builds, and
  `npm run lint` passes.

- [x] **8. Star hover preview (review change).** In `StarRating.jsx`, hovering
  a star colors it and every star before it gold, and the stars after it stay
  dark, previewing that rating. CSS only, on the star group: all stars light on
  group hover, stars after the hovered one go dark again. Only on pointer
  devices (`@media (hover: hover)`), and only while the movie is watched and no
  update is pending. Leaving the group restores the saved rating's colors.
  **Done when:** hovering star 3 of an unrated or differently rated watched
  movie shows stars 1-3 gold and 4-5 dark, unwatched or busy stars show no
  preview, the client builds, and `npm run lint` passes.

## Files / areas

- `client/src/index.css` - `--shadow-soft`, `text-gradient` utility.
- `client/src/components/layout/Navbar.jsx` - logo gradient.
- `client/src/components/movies/` - `ActionIcons.jsx` (new), `MovieCard.jsx`,
  `LibraryControls.jsx`, `WatchlistButton.jsx`, `WatchedButton.jsx`,
  `StarRating.jsx` (spacing only), `MovieHero.jsx`, `MovieSection.jsx`,
  `MovieDetails.jsx`, `TrailerEmbed.jsx`, `CastRow.jsx`, `FilterSelect.jsx`,
  `SearchResults.jsx`.
- `client/src/components/lists/` - `AddToListButton.jsx`, `CreateListForm.jsx`,
  `EditListForm.jsx`, `listStyles.js`.
- `client/src/components/profile/` - `StatCard.jsx`, `RatingDistribution.jsx`,
  `TopGenres.jsx`.
- `client/src/hooks/useLibraryAction.js` - button class constants.
- `client/src/pages/` - every page's h1 and panel classes.
- No server files.

## Data / contracts

None. No API, persisted data, route or prop contract outside the client changes.
`LibraryControls` gains an optional `compact` boolean (default `false`); the
three action buttons accept the same prop.

## Testing

No test runner exists, so tests are not a gate. Checks: `npm run lint` (root)
after each step and `npm run build` in `client/` at the end. Visual and
interaction checks are manual in the dev server (`/check` and the try guide):
gradient headings, shadows, compact row, tooltips on hover and Tab focus,
watchlist/watched/rating/add-to-list behavior, focus return from the dialog,
320px layout, and forced-colors fallback (Windows High Contrast or DevTools
emulation). No visual or browser evidence is claimed until it is run.

## Notes for the AI

- Tailwind v4 only: tokens in `@theme`, custom utilities with `@utility` in
  `index.css`. Never add `tailwind.config.js` or `postcss.config.js`.
- No icon library, no tooltip library; Headless UI is already installed but not
  needed for a CSS tooltip.
- Do not change accessible names to state-dependent text ("Remove from
  watchlist"): these are `aria-pressed` toggles and their names must stay
  stable. The tooltip text duplicates the name, so it is `aria-hidden`.
- Keep `WatchedButton` mounted at the same tree position across states (see
  the comment in `LibraryControls.jsx`).
- Movie and list names in gradient headings are still rendered as React text;
  no `dangerouslySetInnerHTML`.
- The ranked *Top 10* heading counts as the home page's visible page heading;
  this is an interpretation, easy to revert if unwanted.
- Respect `motion-reduce` on any new transitions.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":13108,"specSha256":"b8d7f964e80c51ddd225c005f46553bbb16cdf11d896c17205aa7c258264f751","branch":"refs/heads/feature/visual-refresh","head":"3db90076596cd2bc7cdae425e5c9428b369055c2","baseRef":"refs/heads/main","baseCommit":"3db90076596cd2bc7cdae425e5c9428b369055c2","sourceTree":"94687ba255cea84333e834ba241d2184f5584813","landing":"local-merge","absentOptional":[]} -->

## Try it now

Run or do:

1. In the project root, run `npm run dev`, then wait for the server and client to start.
2. Open http://localhost:5173 and log in. If you don't have an account yet, register one at `/register`.
3. On the home page, look at any movie card in the **Top 10** row.

Expected:

- "Manager" in the logo and the **Top 10** heading are drawn in a blue gradient.
- Under each poster: the title, the year, then one row of three small square icon buttons (bookmark, circle-check, list-plus), with no gap between the year and the buttons.
- Hovering a button shows a small label above it (*Watchlist*, *Watched*, *Add to list*) that is not cut off at the card edge, and the cursor is a pointer.

This proves:

The gradient text, the compact icon-button row with tooltips, the aligned card layout and the pointer cursor render on the home page.
