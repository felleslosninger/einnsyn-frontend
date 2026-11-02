import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deleteApiKeyAndUpdateUi } from './apiKeyDeletion';

test('does not update the UI when API key deletion fails', async () => {
  const formData = new FormData();
  let updatedUi = false;

  await assert.rejects(
    deleteApiKeyAndUpdateUi(
      formData,
      async () => {
        throw new Error('Deletion failed');
      },
      () => {
        updatedUi = true;
      },
    ),
    /Deletion failed/,
  );

  assert.equal(updatedUi, false);
});

test('updates the UI after API key deletion succeeds', async () => {
  const formData = new FormData();
  let updatedUi = false;

  await deleteApiKeyAndUpdateUi(
    formData,
    async () => {},
    () => {
      updatedUi = true;
    },
  );

  assert.equal(updatedUi, true);
});
