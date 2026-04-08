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
import { useSessionData } from '~/components/SessionDataProvider/SessionDataProvider';
import { useActionState, useRef, useState } from 'react';
import { addOrganizationAction } from './adminActions';
import cn from '~/lib/utils/className';
import styles from './AddOrganizationForm.module.scss';
import { EinLink } from '~/components/EinLink/EinLink';

type FormErrors = {
  navn?: string;
  kontaktpunktEpost?: string;
  innsynskravEpost?: string;
  enhetstype?: string;
  orgnummer?: string;
};

export default function AddOrganizationForm() {
  const t = useTranslation();
  const { authInfo } = useSessionData();
  const [errors, setErrors] = useState<FormErrors>({});
  const [state, formAction, isPending] = useActionState(
    addOrganizationAction,
    undefined,
  );
  const errorSummaryRef = useRef<HTMLDivElement>(null);

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
      // Move focus to error summary
      setTimeout(() => errorSummaryRef.current?.focus(), 0);
    } else {
      setErrors({});
    }
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="container-wrapper main-content">
      <div className="container-pre collapsible" />
      <div className="container">
        <form
          className={cn(styles.form, 'form')}
          action={formAction}
          onSubmit={handleSubmit}
          noValidate
        >
          <h1 className="ds-heading" data-size="lg">
            {t('admin.organization.addOrganization')}
          </h1>
          {/* ── Navn ─────────────────────────────────────────────────────────── */}
          <Fieldset>
            <Heading level={2}>{t('admin.organization.name')}</Heading>

            <Field>
              <Label>
                {t('admin.organization.name')}
                <Tag
                  data-color="warning"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  {t('admin.organization.required')}
                </Tag>
              </Label>
              <Input name="navn" aria-invalid={!!errors.navn} />
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
                  {t('admin.organization.optional')}
                </Tag>
              </Label>
              <Input name="navnNynorsk" />
            </Field>

            <Field>
              <Label>
                {t('admin.organization.nameEngelsk')}
                <Tag
                  data-color="info"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  {t('admin.organization.optional')}
                </Tag>
              </Label>
              <Input name="navnEngelsk" />
            </Field>

            <Field>
              <Label>
                {t('admin.organization.nameSami')}
                <Tag
                  data-color="info"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  {t('admin.organization.optional')}
                </Tag>
              </Label>
              <Input name="navnSami" />
            </Field>
          </Fieldset>
          {/* ── Kontaktpunkt ─────────────────────────────────────────────────── */}
          <Fieldset>
            <Heading level={2}>{t('admin.organization.contactPoint')}</Heading>

            <Field>
              <Label>
                {t('admin.organization.contactEmail')}
                <Tag
                  data-color="warning"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  {t('admin.organization.required')}
                </Tag>
              </Label>
              <Input
                type="email"
                name="kontaktpunktEpost"
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
                  {t('admin.organization.optional')}
                </Tag>
              </Label>
              <Input type="tel" name="kontaktpunktTelefon" />
            </Field>

            <Field>
              <Label>
                {t('admin.organization.address')}
                <Tag
                  data-color="info"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  {t('admin.organization.optional')}
                </Tag>
              </Label>
              <Input type="text" name="kontaktpunktAdresse" />
            </Field>

            <Field>
              <Label>
                {t('admin.organization.innsynskravEmail')}
                <Tag
                  data-color="warning"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  {t('admin.organization.required')}
                </Tag>
              </Label>
              <Input
                type="email"
                name="innsynskravEpost"
                aria-invalid={!!errors.innsynskravEpost}
              />
              {errors.innsynskravEpost && (
                <ValidationMessage>{errors.innsynskravEpost}</ValidationMessage>
              )}
            </Field>
          </Fieldset>
          {/* ── Om organisasjonen ────────────────────────────────────────────── */}
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
                  {t('admin.organization.required')}
                </Tag>
              </Label>
              <Select
                name="enhetstype"
                defaultValue=""
                aria-invalid={!!errors.enhetstype}
              >
                <Select.Option value="" disabled>
                  {t('admin.organization.selectType')}
                </Select.Option>
                <Select.Option value="ADMINISTRATIVENHET">
                  {t('admin.organization.enhetstype.ADMINISTRATIVENHET')}
                </Select.Option>
                <Select.Option value="AVDELING">
                  {t('admin.organization.enhetstype.AVDELING')}
                </Select.Option>
                <Select.Option value="BYDEL">
                  {t('admin.organization.enhetstype.BYDEL')}
                </Select.Option>
                <Select.Option value="DUMMYENHET">
                  {t('admin.organization.enhetstype.DUMMYENHET')}
                </Select.Option>
                <Select.Option value="FYLKE">
                  {t('admin.organization.enhetstype.FYLKE')}
                </Select.Option>
                <Select.Option value="KOMMUNE">
                  {t('admin.organization.enhetstype.KOMMUNE')}
                </Select.Option>
                <Select.Option value="ORGAN">
                  {t('admin.organization.enhetstype.ORGAN')}
                </Select.Option>
                <Select.Option value="SEKSJON">
                  {t('admin.organization.enhetstype.SEKSJON')}
                </Select.Option>
                <Select.Option value="UTVALG">
                  {t('admin.organization.enhetstype.UTVALG')}
                </Select.Option>
                <Select.Option value="VIRKSOMHET">
                  {t('admin.organization.enhetstype.VIRKSOMHET')}
                </Select.Option>
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
                  {t('admin.organization.required')}
                </Tag>
              </Label>
              <Input
                type="text"
                name="orgnummer"
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
                  {t('admin.organization.required')}
                </Tag>
              </Label>
              <Select
                name="parent"
                defaultValue=""
                aria-invalid={!!errors.enhetstype}
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
          {/* ── Innstillinger ────────────────────────────────────────────────── */}
          <Fieldset>
            <Heading level={2}>{t('admin.organization.settings')}</Heading>

            <Field>
              <Label>
                {t('admin.organization.handteresAv')}
                <Tag
                  data-color="info"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  {t('admin.organization.optional')}
                </Tag>
              </Label>
              <Input type="text" name="handteresAv" />
            </Field>

            <Field>
              <Label>
                {t('admin.organization.orderXmlVersion')}
                <Tag
                  data-color="info"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  {t('admin.organization.optional')}
                </Tag>
              </Label>
              <Input type="number" name="versjonAvOrderXml" />
            </Field>

            <Field>
              <Label>
                {t('admin.organization.avsluttetDato')}
                <Tag
                  data-color="info"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  {t('admin.organization.optional')}
                </Tag>
              </Label>
              <Input type="date" name="avsluttetDato" />
            </Field>
          </Fieldset>
          {/* ── Error summary + submit ──────────────────────────────────────────
          {hasErrors && (
            <ErrorSummary ref={errorSummaryRef} tabIndex={-1}>
              <ErrorSummary.Heading>
                Du må rette disse feilene før du kan gå videre:
              </ErrorSummary.Heading>
              <ErrorSummary.List>
                {errors.navn && (
                  <ErrorSummary.Item href="#navn">
                    {errors.navn}
                  </ErrorSummary.Item>
                )}
                {errors.kontaktpunktEpost && (
                  <ErrorSummary.Item href="#kontaktpunktEpost">
                    {errors.kontaktpunktEpost}
                  </ErrorSummary.Item>
                )}
                {errors.innsynskravEpost && (
                  <ErrorSummary.Item href="#innsynskravEpost">
                    {errors.innsynskravEpost}
                  </ErrorSummary.Item>
                )}
                {errors.enhetstype && (
                  <ErrorSummary.Item href="#enhetstype">
                    {errors.enhetstype}
                  </ErrorSummary.Item>
                )}
                {errors.orgnummer && (
                  <ErrorSummary.Item href="#orgnummer">
                    {errors.orgnummer}
                  </ErrorSummary.Item>
                )}
              </ErrorSummary.List>
            </ErrorSummary>
          )} */}
          <Button type="submit" disabled={isPending}>
            {isPending
              ? t('common.creating')
              : t('admin.organization.addOrganization')}
          </Button>
          {state?.success && (
            <Alert data-color="success">
              {t('admin.organization.createdSuccess')}
              <EinLink href={`/admin/${authInfo.orgnummer}/api-keys`}>
                {t('admin.organization.addOrganization')}
              </EinLink>
            </Alert>
          )}
          {state?.error && (
            <Alert data-color="danger">{`${t('admin.organization.createError')}: ${state.error}`}</Alert>
          )}
        </form>
      </div>
      <div className="container-post" />
    </div>
  );
}
