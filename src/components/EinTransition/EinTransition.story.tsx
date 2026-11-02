import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EinTransition, type EinTransitionEvents } from './EinTransition';
import styles from './EinTransition.story.module.scss';

// A navigation from page `a` to `b` and, in the restart stories, on to `c` at
// one point of the first transition. Every frame of the stage is recorded, and
// written to the hidden form once the last page has settled.

type Page = 'a' | 'b' | 'c';
type RestartAt = 'exit' | 'merge' | 'beforeReveal' | 'entryPose' | 'midEntry';

export type Sample = {
  snapshot: boolean;
  text: string;
  steps: string[];
  opacity: number;
  display: string;
  inlineOpacity: string;
};

const stepPrefix = 'ein-transition-';

function sample(element: HTMLElement): Sample {
  const style = getComputedStyle(element);
  return {
    snapshot: element.inert,
    text: element.textContent ?? '',
    steps: [...element.classList]
      .filter((name) => name.startsWith(stepPrefix))
      .map((name) => name.slice(stepPrefix.length)),
    opacity: Number(style.opacity),
    display: style.display,
    inlineOpacity: element.style.opacity,
  };
}

function Scenario({ restartAt }: { restartAt?: RestartAt }) {
  const [page, setPage] = useState<Page>('a');
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState<Page>('a');
  const [frames, setFrames] = useState<Sample[][] | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const target = useRef<Page>('a');
  const restarted = useRef(false);

  const navigate = useCallback((to: Page) => {
    target.current = to;
    setPage(to);
    setLoading(true);
  }, []);

  const load = useCallback(() => {
    setLoaded(target.current);
    setLoading(false);
  }, []);

  const restart = useCallback(() => {
    if (restarted.current) return;
    restarted.current = true;
    navigate('c');
    setTimeout(load, 100);
  }, [navigate, load]);

  const events = useMemo<EinTransitionEvents>(
    () => ({
      onInitEnterTransition: () => {
        if (restartAt === 'beforeReveal') restart();
      },
      onEnterTransition: () => {
        if (restartAt === 'midEntry') setTimeout(restart, 150);
      },
    }),
    [restartAt, restart],
  );

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const timers = [setTimeout(() => navigate('b'), 50)];
    if (restartAt === 'exit') timers.push(setTimeout(restart, 100));
    if (restartAt !== 'merge') timers.push(setTimeout(load, 150));

    // The steps EinTransition has no event for, read off the stage.
    const observer = new MutationObserver(() => {
      const elements = [...stage.children] as HTMLElement[];
      const live = elements.find((element) => !element.inert);
      const snapshot = elements.find((element) => element.inert);
      if (
        restartAt === 'merge' &&
        snapshot?.classList.contains(`${stepPrefix}wait`)
      ) {
        observer.disconnect();
        load();
      }
      if (
        restartAt === 'entryPose' &&
        live?.style.display !== 'none' &&
        live?.classList.contains(`${stepPrefix}init-enter-transition`) &&
        !live.classList.contains(`${stepPrefix}enter-transition`)
      ) {
        restart();
      }
    });
    observer.observe(stage, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    return () => {
      for (const timer of timers) clearTimeout(timer);
      observer.disconnect();
    };
  }, [restartAt, navigate, load, restart]);

  // Runs in the same passive flush as EinTransition's own move from
  // `waitForLoad` to `merge`, so the restart lands in the commit of that step.
  useEffect(() => {
    if (restartAt === 'merge' && loaded === 'b') restart();
  }, [restartAt, loaded, restart]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const settlesOn = restartAt ? 'c' : 'b';
    const start = performance.now();
    const recorded: Sample[][] = [];
    let frame = requestAnimationFrame(function record() {
      const samples = [...stage.children].map((element) =>
        sample(element as HTMLElement),
      );
      recorded.push(samples);
      const settled =
        samples.length === 1 &&
        samples[0].text === settlesOn &&
        samples[0].steps.length === 0 &&
        stage.firstElementChild?.getAttribute('aria-busy') === 'false';
      if (settled || performance.now() - start > 4000) {
        setFrames(recorded);
        return;
      }
      frame = requestAnimationFrame(record);
    });
    return () => cancelAnimationFrame(frame);
  }, [restartAt]);

  return (
    <>
      <div ref={stageRef}>
        <EinTransition
          dependencies={[page]}
          loading={loading}
          events={events}
          withClassNames
        >
          <div className={styles.page}>{loaded}</div>
        </EinTransition>
      </div>
      <form hidden>
        <input
          data-testid="frames"
          readOnly
          value={frames ? JSON.stringify(frames) : ''}
        />
      </form>
    </>
  );
}

export const NoRestart = () => <Scenario />;
export const RestartDuringExit = () => <Scenario restartAt="exit" />;
export const RestartAsMergeStarts = () => <Scenario restartAt="merge" />;
export const RestartBeforeReveal = () => <Scenario restartAt="beforeReveal" />;
export const RestartAtEntryPose = () => <Scenario restartAt="entryPose" />;
export const RestartMidEntry = () => <Scenario restartAt="midEntry" />;
