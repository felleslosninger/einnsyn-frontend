import { test as base, expect } from '@playwright/test';
import type { Sample } from './EinTransition.story';

type Frame = Sample[];

const test = base.extend<{ play: (story: string) => Promise<Frame[]> }>({
  play: async ({ mount }, use) => {
    await use(async (story) => {
      const component = await mount(`EinTransition/${story}`);
      const frames = component.getByTestId('frames');
      await expect(frames).not.toHaveValue('');
      return JSON.parse(await frames.inputValue());
    });
  },
});

const live = (frame: Frame) => frame.find((sample) => !sample.snapshot);
const snapshotOf = (frame: Frame, text: string) =>
  frame.find((sample) => sample.snapshot && sample.text === text);
const snapshotsOf = (frames: Frame[], text: string) =>
  frames.flatMap((frame) => snapshotOf(frame, text) ?? []);

function expectFadesOut(samples: Sample[]) {
  for (let i = 1; i < samples.length; i++) {
    expect(samples[i].opacity).toBeLessThanOrEqual(samples[i - 1].opacity);
  }
}

// Behind a snapshot, the live element waits hidden and without step classes.
function expectHiddenBehind(frames: Frame[], text: string) {
  for (const frame of frames.filter((f) => snapshotOf(f, text))) {
    expect(live(frame)).toMatchObject({ display: 'none', steps: [] });
  }
}

// The last page enters from its starting pose and leaves nothing behind.
function expectEntered(frames: Frame[], text: string) {
  const shown = frames
    .map(live)
    .filter((sample) => sample?.text === text && sample.display !== 'none');
  expect(shown[0]?.opacity).toBe(0);
  expect(frames.at(-1)).toEqual([
    expect.objectContaining({
      snapshot: false,
      text,
      steps: [],
      opacity: 1,
      inlineOpacity: '',
    }),
  ]);
}

// Neither shown nor cloned into a snapshot.
function expectNeverShown(frames: Frame[], text: string) {
  expect(snapshotsOf(frames, text)).toEqual([]);
  for (const frame of frames) {
    const sample = live(frame);
    if (sample?.text === text) {
      expect(sample.display === 'none' || sample.opacity === 0).toBe(true);
    }
  }
}

test('a transition exits the old page and enters the new one', async ({
  play,
}) => {
  const frames = await play('NoRestart');
  const snapshot = snapshotsOf(frames, 'a');
  expect(snapshot[0].opacity).toBe(1);
  expect(snapshot.at(-1)?.opacity).toBe(0);
  expectFadesOut(snapshot);
  for (const frame of frames.filter((f) => snapshotOf(f, 'a'))) {
    expect(live(frame)?.display).toBe('none');
  }
  expectEntered(frames, 'b');
});

test('a restart during the exit only changes what enters', async ({ play }) => {
  const frames = await play('RestartDuringExit');
  expectFadesOut(snapshotsOf(frames, 'a'));
  expectNeverShown(frames, 'b');
  expectEntered(frames, 'c');
});

test('a restart in the commit that starts the merge waits for the newer page', async ({
  play,
}) => {
  const frames = await play('RestartAsMergeStarts');
  expect(frames.some((frame) => live(frame)?.text === 'b')).toBe(true);
  expectNeverShown(frames, 'b');
  expectEntered(frames, 'c');
});

test('a restart before the reveal waits for the newer page', async ({
  play,
}) => {
  const frames = await play('RestartBeforeReveal');
  expect(frames.some((frame) => live(frame)?.text === 'b')).toBe(true);
  expectNeverShown(frames, 'b');
  expectEntered(frames, 'c');
});

test('a restart at the entry pose exits the page from that pose', async ({
  play,
}) => {
  const frames = await play('RestartAtEntryPose');
  const snapshot = snapshotsOf(frames, 'b');
  expect(snapshot.length).toBeGreaterThan(0);
  for (const sample of snapshot) {
    expect(sample.opacity).toBe(0);
  }
  expectHiddenBehind(frames, 'b');
  expectEntered(frames, 'c');
});

test('a restart mid-entry exits the page from where it had got to', async ({
  play,
}) => {
  const frames = await play('RestartMidEntry');
  const first = frames.findIndex((frame) => snapshotOf(frame, 'b'));
  const before = live(frames[first - 1]);
  // The scenario has to land in the middle of the entry to mean anything.
  expect(before?.text).toBe('b');
  expect(before?.opacity).toBeGreaterThan(0.1);
  expect(before?.opacity).toBeLessThan(0.9);

  const snapshot = snapshotsOf(frames, 'b');
  // From the live opacity, at most a frame or two further along.
  expect(snapshot[0].opacity).toBeGreaterThanOrEqual(before?.opacity ?? 1);
  expect(snapshot[0].opacity).toBeLessThan((before?.opacity ?? 0) + 0.25);
  expectFadesOut(snapshot);
  for (const sample of snapshot) {
    expect(sample.steps).not.toContain('init-enter-transition');
    expect(sample.steps).not.toContain('enter-transition');
    // The held pose gives way to the exit class.
    if (sample.steps.includes('exit-transition')) {
      expect(sample.inlineOpacity).toBe('');
    }
  }
  expectHiddenBehind(frames, 'b');
  expectEntered(frames, 'c');
});
