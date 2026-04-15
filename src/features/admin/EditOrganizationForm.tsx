'use client';

import {
  Alert,
  Button,
  ErrorSummary,
  Field,
  Fieldset,
  Heading,
  Input,
  Label,
  Select,
  Tag,
  ValidationMessage,
} from '@digdir/designsystemet-react';
import { useTranslation } from '~/hooks/useTranslation';
import { useActionState, useEffect, useRef, useState } from 'react';
import { editOrganizationAction } from './adminActions';
import cn from '~/lib/utils/className';
import styles from './AddOrganizationForm.module.scss';
import type { Enhet } from '@digdir/einnsyn-sdk';
import { getEnhetAction } from './adminActions';

type FormErrors = {
  navn?: string;
  kontaktpunktEpost?: string;
  innsynskravEpost?: string;
  enhetstype?: string;
  orgnummer?: string;
};

export default function EditOrganizationForm({ enhetId }: { enhetId: string }) {
  const t = useTranslation();
  const [enhet, setEnhet] = useState<Enhet | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [state, formAction, isPending] = useActionState(
    editOrganizationAction,
    undefined,
  );
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchEnhet() {
      try {
        const data = await getEnhetAction(enhetId);
        setEnhet(data);
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    void fetchEnhet();
  }, [enhetId]);

  function validate(formData: FormData): FormErrors {
    const e: FormErrors = {};
    if (!formData.get('navn')) e.navn = 'Navn må fylles ut';
    if (!formData.get('kontaktpunktEpost'))
      e.kontaktpunktEpost = 'Kontakt-epost må fylles ut';
    if (!formData.get('innsynskravEpost'))
      e.innsynskravEpost = 'Innsynskrav-epost må fylles ut';
    if (!formData.get('enhetstype')) e.enhetstype = 'Type må velges';
    const orgnr = formData.get('orgnummer') as string;
    if (!orgnr) e.orgnummer = 'Organisasjonsnummer må fylles ut';
    else if (!/^\d{9}$/.test(orgnr))
      e.orgnummer = 'Organisasjonsnummer må ha 9 siffer';
    return e;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(e.currentTarget);
    const newErrors = validate(formData);
    if (Object.keys(newErrors).length > 0) {
      e.preventDefault();
      setErrors(newErrors);
      setTimeout(() => errorSummaryRef.current?.focus(), 0);
    } else {
      setErrors({});
    }
  }

  const hasErrors = Object.keys(errors).length > 0;

  if (loading) return <p>Laster organisasjon...</p>;
  if (fetchError) return <Alert data-color="danger">{fetchError}</Alert>;
  if (!enhet) return null;

  return (
    <div className="container-wrapper main-content">
      <div className="container-pre collapsible" />
      <div className="container">
        <form
          className={cn(styles.form, 'form')}
          action={formAction}
          onSubmit={handleSubmit}
          noValidate
          style={{ marginBottom: 'var(--ds-size-18)' }}
        >
          <input type="hidden" name="enhetId" value={enhetId} />

          <h1 className="ds-heading" data-size="lg">
            {t('admin.organization.editOrganization')}
          </h1>

          {/* ── Navn ──────────────────────────────────────────────────────────── */}
          <Fieldset>
            <Heading level={2}>{t('admin.organization.name')}</Heading>

            <Field>
              <Label>
                {t('admin.organization.name')}
                <Tag
                  data-color="warning"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  {t('common.required')}
                </Tag>
              </Label>
              <Input
                name="navn"
                defaultValue={enhet.navn}
                aria-invalid={!!errors.navn}
              />
              {errors.navn && (
                <ValidationMessage>{errors.navn}</ValidationMessage>
              )}
            </Field>

            <Field>
              <Label>
                {t('admin.organization.nameNynorsk')}
                <Tag
                  data-color="info"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  {t('common.optional')}
                </Tag>
              </Label>
              <Input
                name="navnNynorsk"
                defaultValue={enhet.navnNynorsk ?? ''}
              />
            </Field>

            <Field>
              <Label>
                {t('admin.organization.nameEngelsk')}
                <Tag
                  data-color="info"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  {t('common.optional')}
                </Tag>
              </Label>
              <Input
                name="navnEngelsk"
                defaultValue={enhet.navnEngelsk ?? ''}
              />
            </Field>

            <Field>
              <Label>
                {t('admin.organization.nameSami')}
                <Tag
                  data-color="info"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  {t('common.optional')}
                </Tag>
              </Label>
              <Input name="navnSami" defaultValue={enhet.navnSami ?? ''} />
            </Field>
          </Fieldset>

          {/* ── Kontaktpunkt ──────────────────────────────────────────────────── */}
          <Fieldset>
            <Heading level={2}>{t('admin.organization.contactPoint')}</Heading>

            <Field>
              <Label>
                {t('admin.organization.contactEmail')}
                <Tag
                  data-color="warning"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  {t('common.required')}
                </Tag>
              </Label>
              <Input
                type="email"
                name="kontaktpunktEpost"
                defaultValue={enhet.kontaktpunktEpost ?? ''}
                aria-invalid={!!errors.kontaktpunktEpost}
              />
              {errors.kontaktpunktEpost && (
                <ValidationMessage>
                  {errors.kontaktpunktEpost}
                </ValidationMessage>
              )}
            </Field>

            <Field>
              <Label>
                {t('admin.organization.phone')}
                <Tag
                  data-color="info"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  {t('common.optional')}
                </Tag>
              </Label>
              <Input
                type="tel"
                name="kontaktpunktTelefon"
                defaultValue={enhet.kontaktpunktTelefon ?? ''}
              />
            </Field>

            <Field>
              <Label>
                {t('admin.organization.address')}
                <Tag
                  data-color="info"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  {t('common.optional')}
                </Tag>
              </Label>
              <Input
                type="text"
                name="kontaktpunktAdresse"
                defaultValue={enhet.kontaktpunktAdresse ?? ''}
              />
            </Field>

            <Field>
              <Label>
                {t('admin.organization.innsynskravEmail')}
                <Tag
                  data-color="warning"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  {t('common.required')}
                </Tag>
              </Label>
              <Input
                type="email"
                name="innsynskravEpost"
                defaultValue={enhet.innsynskravEpost ?? ''}
                aria-invalid={!!errors.innsynskravEpost}
              />
              {errors.innsynskravEpost && (
                <ValidationMessage>{errors.innsynskravEpost}</ValidationMessage>
              )}
            </Field>
          </Fieldset>

          {/* ── Om organisasjonen ─────────────────────────────────────────────── */}
          <Fieldset>
            <Heading level={2}>
              {t('admin.organization.aboutOrganization')}
            </Heading>

            <Field>
              <Label>
                {t('admin.organization.type')}
                <Tag
                  data-color="warning"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  {t('common.required')}
                </Tag>
              </Label>
              <Select
                name="enhetstype"
                defaultValue={enhet.enhetstype ?? ''}
                aria-invalid={!!errors.enhetstype}
              >
                <Select.Option value="" disabled>
                  {t('admin.organization.selectType')}
                </Select.Option>
                {[
                  'ADMINISTRATIVENHET',
                  'AVDELING',
                  'BYDEL',
                  'DUMMYENHET',
                  'FYLKE',
                  'KOMMUNE',
                  'ORGAN',
                  'SEKSJON',
                  'UTVALG',
                  'VIRKSOMHET',
                ].map((type) => (
                  <Select.Option key={type} value={type}>
                    {t(`admin.organization.enhetstype.${type}`)}
                  </Select.Option>
                ))}
              </Select>
              {errors.enhetstype && (
                <ValidationMessage>{errors.enhetstype}</ValidationMessage>
              )}
            </Field>

            <Field>
              <Label>
                {t('admin.organization.orgnummer')}
                <Tag
                  data-color="warning"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  {t('common.required')}
                </Tag>
              </Label>
              <Input
                type="text"
                name="orgnummer"
                defaultValue={enhet.orgnummer ?? ''}
                aria-invalid={!!errors.orgnummer}
              />
              {errors.orgnummer && (
                <ValidationMessage>{errors.orgnummer}</ValidationMessage>
              )}
            </Field>

            <Field>
              <Label>
                Forvaltningsnivå (parent)
                <Tag
                  data-color="warning"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  {t('common.required')}
                </Tag>
              </Label>
              <Select
                name="parent"
                defaultValue={enhet.parent?.toString() ?? ''}
              >
                <Select.Option value="" disabled>
                  Velg forvaltningsnivå...
                </Select.Option>
                <Select.Option value="http://data.einnsyn.no/virksomhet/toppnodeFylke">
                  Fylkeskommunal
                </Select.Option>
                <Select.Option value="http://data.einnsyn.no/virksomhet/toppnodeKommune">
                  Kommunal
                </Select.Option>
                <Select.Option value="http://data.einnsyn.no/virksomhet/toppnodeStat">
                  Statlig
                </Select.Option>
              </Select>
            </Field>
          </Fieldset>

          {/* ── Innstillinger ─────────────────────────────────────────────────── */}
          <Fieldset>
            <Heading level={2}>{t('admin.organization.settings')}</Heading>

            <Field>
              <Label>
                {t('admin.organization.handteresAv')}
                <Tag
                  data-color="info"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  {t('common.optional')}
                </Tag>
              </Label>
              <Input
                type="text"
                name="handteresAv"
                defaultValue={enhet.handteresAv?.toString() ?? ''}
              />
            </Field>

            <Field>
              <Label>
                {t('admin.organization.orderXmlVersion')}
                <Tag
                  data-color="info"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  {t('common.optional')}
                </Tag>
              </Label>
              <Input
                type="number"
                name="versjonAvOrderXml"
                defaultValue={enhet.orderXmlVersjon ?? ''}
              />
            </Field>

            <Field>
              <Label>
                {t('admin.organization.avsluttetDato')}
                <Tag
                  data-color="info"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  {t('common.optional')}
                </Tag>
              </Label>
              <Input
                type="date"
                name="avsluttetDato"
                defaultValue={enhet.avsluttetDato?.split('T')[0] ?? ''}
              />
            </Field>
          </Fieldset>

          {hasErrors && (
            <ErrorSummary ref={errorSummaryRef} tabIndex={-1}>
              <ErrorSummary.Heading>
                Du må rette disse feilene før du kan gå videre:
              </ErrorSummary.Heading>
              <ErrorSummary.List>
                {errors.navn && (
                  <ErrorSummary.Item>{errors.navn}</ErrorSummary.Item>
                )}
                {errors.kontaktpunktEpost && (
                  <ErrorSummary.Item>
                    {errors.kontaktpunktEpost}
                  </ErrorSummary.Item>
                )}
                {errors.innsynskravEpost && (
                  <ErrorSummary.Item>
                    {errors.innsynskravEpost}
                  </ErrorSummary.Item>
                )}
                {errors.enhetstype && (
                  <ErrorSummary.Item>{errors.enhetstype}</ErrorSummary.Item>
                )}
                {errors.orgnummer && (
                  <ErrorSummary.Item>{errors.orgnummer}</ErrorSummary.Item>
                )}
              </ErrorSummary.List>
            </ErrorSummary>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending ? t('common.saving') : t('common.save')}
          </Button>

          {state?.success && (
            <Alert data-color="success">
              {t('admin.organization.updatedSuccess')}
            </Alert>
          )}
          {state?.error && (
            <Alert data-color="danger">{`${t('admin.organization.updateError')}: ${state.error}`}</Alert>
          )}
        </form>
      </div>
      <div className="container-post" />
    </div>
  );
}
