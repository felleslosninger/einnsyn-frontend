import { Alert, Heading, Paragraph } from '@digdir/designsystemet-react';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinLink } from '~/components/EinLink/EinLink';
import { getTranslator } from '~/lib/translation/translation.server';
import { AnsattportenLoginButton } from './AnsattportenLoginButton';
import styles from './LoginRequired.module.scss';

/**
 * Shown in place of a page that needs a logged-in user. Both ways of logging
 * in return to the same URL, so the page loads once the user has logged in.
 * With `asOrganization`, a personal account gives no access to the page, so
 * Ansattporten is the only way offered.
 */
export default async function LoginRequired({
  asOrganization = false,
}: {
  asOrganization?: boolean;
}) {
  const t = await getTranslator();

  return (
    <div className={styles.wrapper}>
      <Alert data-color="info" className={styles.alert}>
        <Heading level={2} data-size="xs" className={styles.heading}>
          {t('site.loginRequired.title')}
        </Heading>
        <div className={styles.content}>
          <Paragraph>
            {t(
              asOrganization
                ? 'site.loginRequired.descriptionOrganization'
                : 'site.loginRequired.description',
            )}
          </Paragraph>
          <div className={styles.actions} data-color="accent">
            {asOrganization ? (
              <AnsattportenLoginButton style="primary" />
            ) : (
              <EinButton asChild>
                <EinLink unstyled href="/login">
                  {t('site.login')}
                </EinLink>
              </EinButton>
            )}
            <EinButton asChild variant="secondary">
              <EinLink unstyled href="/">
                {t('site.loginRequired.goToFrontPage')}
              </EinLink>
            </EinButton>
          </div>
        </div>
      </Alert>
    </div>
  );
}
