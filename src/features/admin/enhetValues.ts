export const ENHETSTYPE_VALUES = [
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
] as const;

export type Enhetstype = (typeof ENHETSTYPE_VALUES)[number];

export enum ToppnodeURI {
  Fylkeskommunal = 'http://data.einnsyn.no/virksomhet/toppnodeFylke',
  Kommunal = 'http://data.einnsyn.no/virksomhet/toppnodeKommune',
  Statlig = 'http://data.einnsyn.no/virksomhet/toppnodeStat',
}
