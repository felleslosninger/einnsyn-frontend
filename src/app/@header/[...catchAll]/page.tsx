// Match URLs that do not have a more specific @header page. Because this is a
// real route, it renders through @header/layout.tsx: returning null keeps the
// main header, clears its optional second row, and replaces any previously
// active header page during client-side navigation. In contrast, default.tsx
// is only the full-load fallback for an unmatched slot and bypasses this layout.
export default function CatchAllHeaderSlot() {
  return null;
}
