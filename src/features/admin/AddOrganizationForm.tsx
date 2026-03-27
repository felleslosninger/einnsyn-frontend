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

import cn from '~/lib/utils/className';
import styles from './AddOrganizationForm.module.scss';

export default function AddOrganizationForm() {
  const t = useTranslation();

  return (
    <div className="container-wrapper main-content">
      <div className="container-pre collapsible" />
      <div className="container">
        <form
          className={cn(styles.form, 'form')}
          onSubmit={(e) => e.preventDefault()}
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
                  Må fylles ut
                </Tag>
              </Label>
              <Input name="navn" required />
            </Field>

            <Field>
              <Label>{t('admin.organization.name')} på nynorsk</Label>
              <Input name="navnNynorsk" />
            </Field>

            <Field>
              <Label>{t('admin.organization.name')} på engelsk</Label>
              <Input name="navnEngelsk" />
            </Field>

            <Field>
              <Label>{t('admin.organization.name')} på samisk</Label>
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
              <Label>Telefon</Label>
              <Input type="tel" name="kontaktpunktTelefon" />
            </Field>

            <Field>
              <Label>Adresse</Label>
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
          <Fieldset>
            <Heading level={2}>Innstillinger</Heading>

            <Field>
              <Label>Håndteres av</Label>
              <Input type="text" name="handteresAv" />
            </Field>

            <Field>
              <Label>Versjon av order.xml</Label>
              <Input type="number" name="versjonAvOrderXml" />
            </Field>

            <Field>
              <Label>Avsluttet dato</Label>
              <Input type="date" name="avsluttetDato" />
            </Field>

            <Fieldset>
              <Fieldset.Legend>Skjult?</Fieldset.Legend>
              <Fieldset.Description>Forklaring</Fieldset.Description>
              <div style={{ display: 'flex', gap: 'var(--ds-size-4)' }}>
                <Radio name="my-inline" label="Ja" value="ja" />
                <Radio name="my-inline" label="Nei" value="nei" />
              </div>
            </Fieldset>

            <Fieldset>
              <Fieldset.Legend>Er teknisk?</Fieldset.Legend>
              <Fieldset.Description>Forklaring</Fieldset.Description>
              <div style={{ display: 'flex', gap: 'var(--ds-size-4)' }}>
                <Radio name="my-inline" label="Ja" value="ja" />
                <Radio name="my-inline" label="Nei" value="nei" />
              </div>
            </Fieldset>

            <Fieldset>
              <Fieldset.Legend>Skal konvertere ID?</Fieldset.Legend>
              <Fieldset.Description>Forklaring</Fieldset.Description>
              <div style={{ display: 'flex', gap: 'var(--ds-size-4)' }}>
                <Radio name="my-inline" label="Ja" value="ja" />
                <Radio name="my-inline" label="Nei" value="nei" />
              </div>
            </Fieldset>

            <Fieldset>
              <Fieldset.Legend>
                Motta kvittering for publisering?
              </Fieldset.Legend>
              <Fieldset.Description>Forklaring</Fieldset.Description>
              <div style={{ display: 'flex', gap: 'var(--ds-size-4)' }}>
                <Radio name="my-inline" label="Ja" value="ja" />
                <Radio name="my-inline" label="Nei" value="nei" />
              </div>
            </Fieldset>
          </Fieldset>

          <Button type="submit">
            {t('admin.organization.addOrganization')}
          </Button>
        </form>
      </div>
      <div className="container-post" />
    </div>
  );
}
