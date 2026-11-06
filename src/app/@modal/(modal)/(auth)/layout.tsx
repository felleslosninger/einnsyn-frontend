import { LoginModal } from '~/features/login';

// Wraps the direct and the intercepted routes alike, so the modal and its form
// stay mounted when a direct link's form leads on to an intercepted route.
export default function AuthModalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LoginModal>{children}</LoginModal>;
}
