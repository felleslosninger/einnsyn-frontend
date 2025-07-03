export default function OrganizationHierarchy() {
  return <></>;
}

// import type { Enhet } from '@digdir/einnsyn-sdk';
// import { notFound } from 'next/navigation';
// import { cachedApiClient } from '~/actions/api/getApiClient';
// import { cachedAuthInfo } from '~/actions/authentication/auth';
// import OrganizationHirerarchy from './OrganizationHirerarchy';

// export default async function ApiKeysPage({
//   params,
// }: { params: Promise<{ enhetId: string }> }) {
//   const authInfo = await cachedAuthInfo();
//   if (!authInfo) {
//     notFound();
//   }

//   const { enhetId } = await params;
//   const apiClient = await cachedApiClient();

//   // Recursively load all children of the Enhet
//   const fetchEnhetTree = async (enhetIdList: (string | Enhet)[]) => {
//     const enhetPromises = enhetIdList.map((enhet) => {
//       if (typeof enhet === 'string') {
//         return apiClient.enhet
//           .get(enhet, {
//             expand: ['children.children.children.children'],
//           })
//           .then((enhet) => {
//             return {
//               ...enhet,
//               underenhet: enhet.underenhet || [],
//             };
//           });
//       }
//       return enhet;
//     });

//     // Recurse over each child to fetch their children
//     for (const enhet of enhetList) {
//       if (enhet.underenhet?.length) {
//         enhet.underenhet = await fetchEnhetTree(enhet.underenhet);
//       }
//     }

//     return enhetList;
//   };

//   const [enhet] = await fetchEnhetTree([enhetId]);

//   return <OrganizationHirerarchy enhet={enhet} />;
// }
