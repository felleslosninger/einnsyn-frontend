'use client';

import {
  Alert,
  Button,
  Heading,
  Paragraph,
  Dialog,
} from '@digdir/designsystemet-react';
import { useTranslation } from '~/hooks/useTranslation';
import { useActionState } from 'react';
import { deleteOrganizationAction } from './adminActions';

export default function DeleteOrganizationForm({
  enhetId,
}: {
  enhetId: string;
}) {
  const t = useTranslation();
  const [state, formAction, isPending] = useActionState(
    deleteOrganizationAction,
    undefined,
  );

  if (state?.success) {
    return (
      <Alert data-color="success">
        {t('admin.organization.deletedSuccess')}
      </Alert>
    );
  }

  const dialogId = 'confirm-delete-dialog';

  return (
    <div
      className="container-wrapper main-content"
      style={{ marginBottom: 'var(--ds-size-18)' }}
    >
      <div className="container-pre collapsible" />
      <div className="container">
        <Dialog.TriggerContext>
          {/* Knappen som vises på siden */}
          <Dialog.Trigger asChild>
            <Button data-color="danger">
              {t('admin.organization.deleteOrganization')}
            </Button>
          </Dialog.Trigger>

          <Dialog id={dialogId}>
            <Dialog.Block>
              <Heading level={2}>
                {t('admin.organization.deleteOrganization')}
              </Heading>
            </Dialog.Block>

            <Dialog.Block>
              <Paragraph>
                {/* TODO: Legg inn organisasonsnavn i slettemledingen. */}
                {t('admin.organization.deleteConfirmationMessage')}
                <br />
                <strong>{t('admin.organization.noRegret')}</strong>
              </Paragraph>

              {state?.error && (
                <Alert
                  data-color="danger"
                  style={{ marginTop: 'var(--ds-size-4)' }}
                >
                  {state.error}
                </Alert>
              )}
            </Dialog.Block>

            <Dialog.Block>
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--ds-size-4)',
                  marginTop: 'var(--ds-size-4)',
                }}
              >
                <form action={formAction}>
                  <input type="hidden" name="enhetId" value={enhetId} />
                  <Button
                    variant="primary"
                    data-color="danger"
                    type="submit"
                    disabled={isPending}
                  >
                    {isPending
                      ? t('common.deleting')
                      : t('admin.organization.deleteOrganization')}
                  </Button>
                </form>

                <Button
                  variant="secondary"
                  command="close"
                  commandFor={dialogId}
                  disabled={isPending}
                >
                  {t('common.cancel', 'Avbryt')}
                </Button>
              </div>
            </Dialog.Block>
          </Dialog>
        </Dialog.TriggerContext>
      </div>
      <div className="container-post" />
    </div>
  );
}
