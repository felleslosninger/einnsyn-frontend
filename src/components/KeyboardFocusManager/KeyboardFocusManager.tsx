'use client';

import { useEffect } from 'react';

const keyboardNavigationKeys = new Set([
  'Tab',
  'Home',
  'End',
  'PageUp',
  'PageDown',
]);

function isKeyboardNavigationKey(event: KeyboardEvent) {
  return event.key.startsWith('Arrow') || keyboardNavigationKeys.has(event.key);
}

export function KeyboardFocusManager() {
  useEffect(() => {
    const documentElement = document.documentElement;

    const setFocusInput = (input: 'keyboard' | 'pointer') => {
      documentElement.dataset.focusInput = input;
    };

    const onPointerDown = () => {
      setFocusInput('pointer');
    };

    const onKeyDown = (event: KeyboardEvent) => {
      // Only navigation keys switch input so typing in a pointer-focused
      // text field does not reveal keyboard-only focus styling.
      if (isKeyboardNavigationKey(event)) {
        setFocusInput('keyboard');
      }
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
      delete documentElement.dataset.focusInput;
    };
  }, []);

  return null;
}
