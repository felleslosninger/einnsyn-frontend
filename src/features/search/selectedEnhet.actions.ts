'use server';

import { type EnhetDetails, getEnhetDetails } from '~/lib/enhet/enhet.server';
import {
  getUpcomingMeetings,
  type UpcomingMeeting,
} from '~/lib/moetemappe/moetemappe.server';
import {
  type EnhetStatistics,
  getEnhetStatistics,
} from '~/lib/statistics/statistics.server';
import { logger } from '~/lib/utils/logger';

export type SelectedEnhet = {
  enhet: EnhetDetails;
  /** Missing when the statistics could not be fetched. */
  statistics?: EnhetStatistics;
  /** Empty also when the meetings could not be fetched. */
  meetings: UpcomingMeeting[];
};

/** The sidebar's content for the selected enhets. Accepts ids or slugs. */
export async function getSelectedEnhetsAction(
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
    enhets.map(async (enhet) => {
      const [statistics, meetings] = await Promise.all([
        getEnhetStatistics(enhet.id).catch((error) => {
          logger.error('Failed to fetch enhet statistics', error);
          return undefined;
        }),
        getUpcomingMeetings(enhet.id).catch((error) => {
          logger.error('Failed to fetch upcoming meetings', error);
          return [];
        }),
      ]);
      return { enhet, statistics, meetings };
    }),
  );
}
