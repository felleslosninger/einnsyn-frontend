import Link from 'next/link';
import { EinLink } from '~/components/EinLink/EinLink';
import { useTranslation } from '~/hooks/useTranslation';

export default function LoginButton() {
  const t = useTranslation();
  return <EinLink href="/login">{t('site.login')}</EinLink>;
}
