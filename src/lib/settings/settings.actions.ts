'use server';

import type { Settings } from './settings';
import { updateSettings } from './settings.server';

// Every export here is a publicly callable endpoint, so this file holds only
// what a client component actually calls. Server-side callers use
// `./settings.server` directly.

/** Called by the settings menu when the visitor changes language or theme. */
export async function updateSettingsAction(
  settingsContent: Partial<Settings>,
): Promise<void> {
  await updateSettings(settingsContent);
}
