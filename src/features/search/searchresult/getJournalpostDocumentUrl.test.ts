import assert from 'node:assert';
import { test } from 'node:test';
import type { Journalpost } from '@digdir/einnsyn-sdk';
import { getJournalpostDocumentUrl } from './getJournalpostDocumentUrl';

test('returns the URL of an expanded document', () => {
  const journalpost = {
    dokumentbeskrivelse: [
      {
        entity: 'Dokumentbeskrivelse',
        dokumentobjekt: [
          {
            entity: 'Dokumentobjekt',
            url: 'https://example.test/document.pdf',
          },
        ],
      },
    ],
  } as unknown as Pick<Journalpost, 'dokumentbeskrivelse'>;

  assert.strictEqual(
    getJournalpostDocumentUrl(journalpost),
    'https://example.test/document.pdf',
  );
});

test('returns undefined when no expanded document URL is available', () => {
  const journalpost = {
    dokumentbeskrivelse: [
      'dokumentbeskrivelse-id',
      {
        entity: 'Dokumentbeskrivelse',
        dokumentobjekt: ['dokumentobjekt-id'],
      },
    ],
  } as unknown as Pick<Journalpost, 'dokumentbeskrivelse'>;

  assert.strictEqual(getJournalpostDocumentUrl(journalpost), undefined);
});