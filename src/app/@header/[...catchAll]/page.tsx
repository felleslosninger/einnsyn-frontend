// The net that keeps a header on every route: an unmatched slot falls through to
// default.tsx, which is not wrapped by @header/layout.tsx and so renders no
// header at all. A route wanting an empty second row needs no file of its own.
export default function CatchAllHeaderSlot() {
  return null;
}
