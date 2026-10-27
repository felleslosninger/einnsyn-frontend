'use server';

import { type EnhetDetails, getEnhetDetails } from '~/lib/enhet/enhet.server';
import {
  type EnhetStatistics,
  getEnhetStatistics,
} from '~/lib/statistics/statistics.server';
import { logger } from '~/lib/utils/logger';

export type SelectedEnhet = {
  enhet: EnhetDetails;
  /** Missing when the statistics could not be fetched. */
  statistics?: EnhetStatistics;
};

/** The sidebar's content for the selected enhets. Accepts ids or slugs. */
export async function getSelectedEnhets(
  identifiers: string[],
): Promise<SelectedEnhet[]> {
  let enhets: EnhetDetails[];
  try {
    enhets = await getEnhetDetails(identifiers);
  } catch (error) {
    logger.error('Failed to look up enhets', error);
    return [];
  }

  return Promise.all(
    enhets.map(async (enhet) => ({
      enhet,
      statistics: await getEnhetStatistics(enhet.id).catch((error) => {
        logger.error('Failed to fetch enhet statistics', error);
        return undefined;
      }),
    })),
  );
}
