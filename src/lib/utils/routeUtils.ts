//import * as Cart from './Cart/Cart';
import * as Login from '../../app/login/Login';
import type { Metadata, ResolvingMetadata } from 'next';
import {
  getTranslateFunction,
  supportedLanguages,
} from '../translation/translation';
//import * as Logout from './Logout/Logout';

const translationFunctions = supportedLanguages.map((lang) =>
  getTranslateFunction(lang),
);
const getTranslatedVariants = (key: string) => {
  return translationFunctions
    .map((translate) => translate(key))
    .filter((variant) => variant !== undefined && variant !== null)
    .reduce((acc, curr) => {
      if (curr !== key && !acc.includes(curr)) {
        acc.push(curr);
      }
      return acc;
    }, [] as string[]);
};
const searchPathVariants = getTranslatedVariants('routing.searchPath');
const saksmappePathVariants = getTranslatedVariants('routing.saksmappePath');
const calendarPathVariants = getTranslatedVariants('routing.calendarPath');
const statisticsPathVariants = getTranslatedVariants('routing.statisticsPath');
const allSearchPathVariants = [
  ...searchPathVariants,
  ...saksmappePathVariants,
  ...calendarPathVariants,
  ...statisticsPathVariants,
];

export function getEnhetSlugs(path: string[]) {
  const enhetSlugs: string[] = [];

  for (const pathPart of path) {
    if (getSearchEndpoint([pathPart])[0] || getModalRoute([pathPart])[0]) {
      break;
    }
    enhetSlugs.push(pathPart);
  }

  return [enhetSlugs, path.slice(enhetSlugs.length)];
}

export function getSearchEndpoint(
  path: string[],
): [string | undefined, string[]] {
  const [firstPathPart, ...remainingPathParts] = path;
  const searchPath = allSearchPathVariants.find(
    (part) => firstPathPart === part,
  );
  if (searchPath) {
    return [firstPathPart, remainingPathParts];
  }
  return [undefined, path];
}

export type ModalParams = {
  modal: string[];
};

export type Props = {
  params: Promise<ModalParams>;
};

export type ModalRoute = {
  slugs: string[];
  Render: React.FC<ModalParams>;
  Title?: React.FC<ModalParams>;
  generateMetadata?: (
    props: Props,
    parent: ResolvingMetadata,
  ) => Promise<Metadata>;
};

const modalRoutes: ModalRoute[] = [
  Login,
  //Logout,
  //Cart,
];
export function getModalRoute(
  path: string[],
): [ModalRoute | undefined, string[]] {
  const [firstPathParam, ...remainingPathParams] = path;
  const template = modalRoutes.find((t) => t.slugs.includes(firstPathParam));
  if (template) {
    return [template, remainingPathParams];
  }
  return [undefined, path];
}

export function getModalBasePath(path: string[]) {
  const [enhetSlugs, enhetRemains] = getEnhetSlugs(path);
  const [searchEndpoint, searchRemains] = getSearchEndpoint(enhetRemains);

  const pathParts: string[] = [];
  if (enhetSlugs) {
    pathParts.push(...enhetSlugs);
  }
  if (searchEndpoint) {
    pathParts.push(searchEndpoint);
  }

  return `/${pathParts.join('/')}`;
}
