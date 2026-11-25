// Next titles a 404 by the last not-found file in its walk of the tree, which
// is this one. A page's own title still wins unless its generateMetadata calls
// notFound() too.
export { generateMetadata } from '../not-found';

export default function NotFound() {
  return <></>;
}
