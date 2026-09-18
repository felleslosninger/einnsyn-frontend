// Load-bearing despite rendering nothing: with no matching child page the
// @header/admin layout drops out of the tree, taking with it the auth gate that
// makes /admin 404 for an anonymous visitor.
export default function AdminHeaderSlot() {
  return null;
}
