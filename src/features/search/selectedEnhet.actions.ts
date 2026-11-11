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
import { normalizeParamList } from '~/lib/utils/paramList';
import { withTimeout } from '~/lib/utils/withTimeout';

// Anyone can call this, and each enhet costs two API requests on a cold cache.
const MAX_IDENTIFIERS = 50;

// The SDK can't abort a request, and a card waits for both of its requests.
const FETCH_TIMEOUT_MS = 5000;

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
  const requested = normalizeParamList(identifiers.slice(0, MAX_IDENTIFIERS));

  let enhets: EnhetDetails[];
  try {
    enhets = await getEnhetDetails(requested);
  } catch (error) {
    logger.error('Failed to look up enhets', error);
    return [];
  }

  return Promise.all(
    enhets.map(async (enhet) => {
      const [statistics, meetings] = await Promise.all([
        withTimeout(getEnhetStatistics(enhet.id), FETCH_TIMEOUT_MS).catch(
          (error) => {
            logger.error('Failed to fetch enhet statistics', error);
            return undefined;
          },
        ),
        withTimeout(getUpcomingMeetings(enhet.id), FETCH_TIMEOUT_MS).catch(
          (error) => {
            logger.error('Failed to fetch upcoming meetings', error);
            return [];
          },
        ),
      ]);
      return { enhet, statistics, meetings };
    }),
  );
}
