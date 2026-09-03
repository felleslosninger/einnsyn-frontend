// Only reached when no @header page matches, and not wrapped by
// @header/layout.tsx — a route landing here renders with no header. That is
// what [...catchAll]/page.tsx is there to prevent.
export default function DefaultHeader() {
  return null;
}
