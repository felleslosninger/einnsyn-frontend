// Relative imports: next.config.ts loads this module, without the `~` alias.
import type { LanguageCode } from '../translation/translation';

/** A route folder's spelling per language, and the folders below it. */
export type RouteNode = { readonly [code in LanguageCode]?: string } & {
  readonly children?: Readonly<Record<string, RouteNode>>;
};

/**
 * The route folders of `src/app` that URLs spell, each with its spelling per
 * language; a language without one uses the folder name. Every spelling is
 * accepted, so no URL favours a language, and `buildPathname` writes the
 * viewer's.
 *
 * A dynamic folder takes any segment its static siblings don't spell, so
 * every root folder is listed, translated or not, to keep it from reading as
 * an enhet.
 */
export const ROUTES = {
  search: { nb: 'søk', nn: 'søk', se: 'oza' },
  about: { nb: 'om', nn: 'om' },
  privacy: { nb: 'personvern', nn: 'personvern' },
  admin: {},
  bruker: {},
  login: {
    nb: 'logg-inn',
    nn: 'logg-inn',
    children: {
      register: {
        nb: 'opprett-konto',
        nn: 'opprett-konto',
        en: 'create-account',
      },
      'forgotten-password': { nb: 'glemt-passord', nn: 'gløymt-passord' },
    },
  },
  '[enhet]': {
    children: {
      saksmappe: {
        nb: 'sak',
        nn: 'sak',
        en: 'case',
        se: 'ášši',
        children: { '[saksmappe]': { children: { '[journalpost]': {} } } },
      },
      moetemappe: {
        nb: 'moete',
        nn: 'moete',
        en: 'meeting',
        se: 'čoahkkin',
        children: { '[moetemappe]': { children: { '[moetesak]': {} } } },
      },
    },
  },
} as const satisfies Record<string, RouteNode>;
