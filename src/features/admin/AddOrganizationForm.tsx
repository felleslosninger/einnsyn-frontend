'use client';
import {
  Button,
  Field,
  Fieldset,
  Heading,
  Input,
  Label,
  Radio,
  Select,
  Tag,
} from '@digdir/designsystemet-react';
import { useTranslation } from '~/hooks/useTranslation';
import { useActionState } from 'react';
import { addOrganizationAction } from './adminActions';

import cn from '~/lib/utils/className';
import styles from './AddOrganizationForm.module.scss';

export default function AddOrganizationForm() {
  const t = useTranslation();
  const [state, formAction, isPending] = useActionState(
    addOrganizationAction,
    undefined,
  );

  return (
    <div className="container-wrapper main-content">
      <div className="container-pre collapsible" />
      <div className="container">
        <form className={cn(styles.form, 'form')} action={formAction}>
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
                  Må fylles ut
                </Tag>
              </Label>
              <Input name="navn" required />
            </Field>

            <Field>
              <Label>
                {t('admin.organization.name')} på nynorsk
                <Tag
                  data-color="info"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  Valgfritt
                </Tag>
              </Label>
              <Input name="navnNynorsk" />
            </Field>

            <Field>
              <Label>
                {t('admin.organization.name')} på engelsk{' '}
                <Tag
                  data-color="info"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  Valgfritt
                </Tag>
              </Label>
              <Input name="navnEngelsk" />
            </Field>

            <Field>
              <Label>
                {t('admin.organization.name')} på samisk{' '}
                <Tag
                  data-color="info"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  Valgfritt
                </Tag>
              </Label>
              <Input name="navnSami" />
            </Field>
          </Fieldset>

          {/* ── Kontaktpunkt ─────────────────────────────────────────────────── */}
          <Fieldset>
            <Heading level={2}>Kontaktpunkt</Heading>

            <Field>
              <Label>
                Kontakt-epost
                <Tag
                  data-color="warning"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  Må fylles ut
                </Tag>
              </Label>
              <Input type="email" name="kontaktpunktEpost" required />
            </Field>

            <Field>
              <Label>
                Telefon{' '}
                <Tag
                  data-color="info"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  Valgfritt
                </Tag>
              </Label>
              <Input type="tel" name="kontaktpunktTelefon" />
            </Field>

            <Field>
              <Label>
                Adresse{' '}
                <Tag
                  data-color="info"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  Valgfritt
                </Tag>
              </Label>
              <Input type="text" name="kontaktpunktAdresse" />
            </Field>

            <Field>
              <Label>
                Innsynskrav-epost
                <Tag
                  data-color="warning"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  Må fylles ut
                </Tag>
              </Label>
              <Input type="email" name="innsynskravEpost" required />
            </Field>
          </Fieldset>

          {/* ── Om organisasjonen ────────────────────────────────────────────── */}
          <Fieldset>
            <Heading level={2}>Om organisasjonen</Heading>

            <Field>
              <Label>
                Type
                <Tag
                  data-color="warning"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  Må fylles ut
                </Tag>
              </Label>
              <Select name="enhetstype" required>
                <Select.Option value="" disabled>
                  Velg en organisasjonstype…
                </Select.Option>
                <Select.Option value="ADMINISTRATIVENHET">
                  Administrativ enhet
                </Select.Option>
                <Select.Option value="AVDELING">Avdeling</Select.Option>
                <Select.Option value="BYDEL">Bydel</Select.Option>
                <Select.Option value="DUMMYENHET">Dummyenhet</Select.Option>
                <Select.Option value="FYLKE">Fylke</Select.Option>
                <Select.Option value="KOMMUNE">Kommune</Select.Option>
                <Select.Option value="ORGAN">Organ</Select.Option>
                <Select.Option value="SEKSJON">Seksjon</Select.Option>
                <Select.Option value="UTVALG">Utvalg</Select.Option>
                <Select.Option value="VIRKSOMHET">Virksomhet</Select.Option>
              </Select>
            </Field>

            <Field>
              <Label>
                Organisasjonsnummer
                <Tag
                  data-color="warning"
                  style={{ marginInlineStart: 'var(--ds-size-2)' }}
                >
                  Må fylles ut
                </Tag>
              </Label>
              <Input type="text" name="orgnummer" required />
            </Field>
          </Fieldset>

          {/* ── Innstillinger (boolean flags) ────────────────────────────────── */}
          <Heading level={2}>Innstillinger</Heading>

          <Field>
            <Label>
              Håndteres av{' '}
              <Tag
                data-color="info"
                style={{ marginInlineStart: 'var(--ds-size-2)' }}
              >
                Valgfritt
              </Tag>
            </Label>
            <Input type="text" name="handteresAv" />
          </Field>

          <Field>
            <Label>
              Versjon av order.xml{' '}
              <Tag
                data-color="info"
                style={{ marginInlineStart: 'var(--ds-size-2)' }}
              >
                Valgfritt
              </Tag>
            </Label>
            <Input type="number" name="versjonAvOrderXml" />
          </Field>

          <Field>
            <Label>
              Avsluttet dato{' '}
              <Tag
                data-color="info"
                style={{ marginInlineStart: 'var(--ds-size-2)' }}
              >
                Valgfritt
              </Tag>
            </Label>
            <Input type="date" name="avsluttetDato" />
          </Field>

          <Button type="submit" disabled={isPending}>
            {t('admin.organization.addOrganization')}
          </Button>
          {state?.success && <div>Organisasjon opprettet!</div>}
          {state?.error && <div>{state.error}</div>}
        </form>
      </div>
      <div className="container-post" />
    </div>
  );
}
