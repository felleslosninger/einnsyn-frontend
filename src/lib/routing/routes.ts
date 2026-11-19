// Relative imports: next.config.ts loads this module, without the `~` alias.
import type { LanguageCode } from '../translation/translation';

/** A route's last segment, spelled per language. */
export type Translations = { readonly [code in LanguageCode]?: string };

/**
 * The routes of `src/app` that URLs spell, by folder path, each with its last
 * segment's spelling per language; a language without one uses the folder
 * name. Every spelling is accepted, so no URL favours a language, and
 * `toLocalizedPath` writes the viewer's.
 *
 * A dynamic segment takes any value its static siblings don't spell, so every
 * root folder is listed, translated or not, to keep it from reading as an
 * enhet. A route comes after its parent, whose rewrites its own build on.
 */
export const ROUTES = {
  '/search': { nb: 'søk', nn: 'søk', se: 'oza' },
  '/about': { nb: 'om', nn: 'om' },
  '/privacy': { nb: 'personvern', nn: 'personvern' },
  '/admin': {},
  '/bruker': { nn: 'brukar', en: 'user', se: 'geavaheaddji' },
  '/bruker/access-requests': {
    nb: 'innsynskrav',
    nn: 'innsynskrav',
    se: 'vuhtiiváldágoahtin',
  },
  '/bruker/saved-cases': {
    nb: 'lagrede-saker',
    nn: 'lagra-saker',
    se: 'vurkon-ásaid',
  },
  '/bruker/saved-meetings': {
    nb: 'lagrede-moeter',
    nn: 'lagra-moete',
    se: 'vurkon-čoahkkimiid',
  },
  '/bruker/saved-searches': {
    nb: 'lagrede-soek',
    nn: 'lagra-soek',
    se: 'vurkon-ohcanat',
  },
  '/bruker/profile': { nb: 'profil', nn: 'profil', se: 'profila' },
  '/login': { nb: 'logg-inn', nn: 'logg-inn' },
  '/login/register': {
    nb: 'opprett-konto',
    nn: 'opprett-konto',
    en: 'create-account',
  },
  '/login/forgotten-password': { nb: 'glemt-passord', nn: 'gløymt-passord' },
  '/[enhet]': {},
  '/[enhet]/saksmappe': { nb: 'sak', nn: 'sak', en: 'case', se: 'ášši' },
  '/[enhet]/saksmappe/[saksmappe]': {},
  '/[enhet]/saksmappe/[saksmappe]/[journalpost]': {},
  '/[enhet]/moetemappe': {
    nb: 'moete',
    nn: 'moete',
    en: 'meeting',
    se: 'čoahkkin',
  },
  '/[enhet]/moetemappe/[moetemappe]': {},
  '/[enhet]/moetemappe/[moetemappe]/[moetesak]': {},
} as const satisfies Record<string, Translations>;
