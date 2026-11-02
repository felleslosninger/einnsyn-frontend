/// <reference types="vite/client" />

import { type ComponentType, StrictMode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import '~/styles/eInnsyn.scss';

// Next gives the browser a `process` with an `env`, and app modules read it.
globalThis.process ??= {
  env: { NODE_ENV: 'development' },
} as unknown as NodeJS.Process;

// The page Playwright's `mount` fixture drives: `mount(story, props)` calls
// `window.mount`. A story id is the path under `src/` without `.story.tsx`,
// then the export name; any unique suffix resolves too.
const stories = import.meta.glob<Record<string, ComponentType>>(
  '../../src/**/*.story.tsx',
);
const storyPath = (file: string) =>
  file.replace(/^(\.\.\/)+src\//, '').replace(/\.story\.tsx$/, '');

async function resolve(story: string) {
  const separator = story.lastIndexOf('/');
  const path = story.slice(0, separator);
  const name = story.slice(separator + 1);
  const file = Object.keys(stories).find(
    (f) => storyPath(f) === path || storyPath(f).endsWith(`/${path}`),
  );
  const module = file ? await stories[file]() : undefined;
  return module?.[name];
}

type MountParams = { story: string; props?: Record<string, unknown> };

declare global {
  interface Window {
    mount(params: MountParams): Promise<void>;
    unmount(): Promise<void>;
  }
}

const container = document.getElementById('root') as HTMLElement;
let root: Root | undefined;

window.mount = async ({ story, props }) => {
  const Story = await resolve(story);
  if (!Story) {
    throw new Error(`Unknown story: ${story}`);
  }
  // Reused, so `component.update(props)` reconciles instead of remounting.
  root ??= createRoot(container);
  // Synchronous, so a render error rejects this call. StrictMode as in the app.
  flushSync(() =>
    root?.render(
      <StrictMode>
        <Story {...props} />
      </StrictMode>,
    ),
  );
};

window.unmount = async () => {
  root?.unmount();
  root = undefined;
};
