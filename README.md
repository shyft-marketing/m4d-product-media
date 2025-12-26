# M4D Product Media

Custom WooCommerce product media handling for variable products, designed to replace WooCommerce’s default product image/gallery behavior with a more Shopify-like UX.

This plugin is actively under development and is intended to be worked on using **Codex or similar AI-assisted coding tools**. Please read this document fully before making changes.

---

## High-Level Goal

Replace WooCommerce’s default product image + gallery behavior with a **stable, predictable, variation-aware media system** that:

- Uses **Swiper.js** for the main image and thumbnails
- Supports **variation-specific image galleries**
- Avoids page reloads or DOM re-render loops
- Matches Shopify-style behavior as closely as possible

---

## Tech Stack

- WordPress
- WooCommerce (variable products)
- Custom WordPress plugin
- PHP (admin + frontend integration)
- JavaScript (jQuery)
- Swiper.js
- Elementor (frontend layouts)
- GitHub + Git Updater

---

## Core Functional Requirements

### 1. Initial Page Load (No Variation Selected)

- Main image:
  - Use the product **featured image**
- Thumbnail carousel:
  - Use the product’s **main product gallery**
- Swiper instances:
  - Initialized **once**
  - No DOM teardown
  - No reinitialization loops

---

### 2. Variation Selected

When a variation is selected:

- Main image:
  - Switch to the **variation’s main image**
- Thumbnail carousel:
  - Replace contents with **ONLY the variation’s gallery images**
- Behavior:
  - No page reload
  - No Swiper reinitialization
  - No mutation that breaks Woo variation resolution

---

### 3. Variation Gallery (Admin)

Each variation supports:

- A **custom image gallery** (in addition to the variation’s main image)
- Editable in the **WooCommerce variation edit UI**
- Images must:
  - Persist on save
  - Reappear on reload
  - Correctly trigger Woo’s “Save changes” state

This functionality replaces the need for paid WooCommerce extensions that add variation galleries.

---

## Explicit Non-Goals

- ❌ No reliance on image filename conventions
- ❌ No normalization of variation names (e.g. `black-white` vs `white-black`)
- ❌ No guessing or heuristic-based image matching
- ❌ No page reloads on variation changes
- ❌ No repeated Swiper initialization

---

## Critical Constraints / Lessons Learned

These are **important** — do not violate them.

### Swiper + Woo Variations

- Swiper **must be initialized once**
- Rebuilding Swiper instances inside `found_variation` causes:
  - Infinite re-render loops
  - “Deferred DOM Node could not be resolved” errors
  - Page reload-like behavior

### DOM Mutation Rules

- Do NOT:
  - Replace large DOM trees
  - Call `location.reload()`
  - Tear down Swiper containers
- DO:
  - Replace slide contents carefully
  - Preserve Swiper structure

---

## Known Past Issues (Avoid Reintroducing)

- Infinite frontend reload loop
- Backend “Connection lost” error in WP editor
- Variation gallery images not saving
- “Save changes” button not enabling for variations
- Frontend showing one variation image per Swiper “page”

These were caused by:
- Improper DOM manipulation
- Incorrect variation meta saving
- Swiper reinitialization
- Over-aggressive JS event handling

---

## Desired UX (Shopify-Style)

- One main image
- Thumbnail carousel below
- Arrows on main image
- Dots pagination under thumbnails
- Clean transitions
- Predictable behavior

---

## Development Rules

When modifying this plugin:

1. Prefer **small, explicit changes**
2. Avoid speculative refactors
3. Do not assume Woo behavior — verify it
4. Use full file replacements when providing code
5. Preserve existing structure unless explicitly changing it
6. Stability > cleverness

---

## How Codex Should Work With This Repo

Codex is expected to:

- Read existing files before modifying them
- Respect WooCommerce JS lifecycle events
- Avoid introducing reloads or re-renders
- Explain reasoning when making architectural changes
- Ask before removing or renaming existing behavior

---

## Versioning

Current version at time of writing: **0.2.5**

Version bumps should:
- Reflect meaningful functional changes
- Be documented in commit messages

---

## Summary

This plugin exists because WooCommerce’s default product media handling is insufficient for complex, variation-heavy products.

The goal is **correctness, stability, and UX parity with Shopify**, not quick hacks.

If something seems fragile, it probably is — err on the side of robustness.
