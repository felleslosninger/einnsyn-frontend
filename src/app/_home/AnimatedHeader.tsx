'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from './AnimatedHeader.module.scss';

export default function AnimatedHeader() {
  const searchMessages = [
    'Søk i offentlig postjournal',
    'Søk i offentlige møtedokumenter',
    'Søk i offentlig saksgang',
    'Søk i offentlige vedtak',
    'Søk i kommunale dokumenter',
    'Søk i statlige arkiver',
  ];

  const [currentText, setCurrentText] = useState(searchMessages[0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const getRandomNextIndex = useCallback((current: number) => {
    const availableIndices = searchMessages
      .map((_, index) => index)
      .filter((index) => index !== current);
    return availableIndices[
      Math.floor(Math.random() * availableIndices.length)
    ];
  }, []);

  const animateToNextText = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    const nextIndex = getRandomNextIndex(currentIndex);
    const nextText = searchMessages[nextIndex];

    // Find common prefix between current and next text
    let commonPrefixLength = 0;
    for (let i = 0; i < Math.min(currentText.length, nextText.length); i++) {
      if (currentText[i] === nextText[i]) {
        commonPrefixLength = i + 1;
      } else {
        break;
      }
    }

    const commonPrefix = currentText.substring(0, commonPrefixLength);
    const oldSuffix = currentText.substring(commonPrefixLength);
    const newSuffix = nextText.substring(commonPrefixLength);

    // Animate erasing the old suffix
    let eraseStep = 0;
    const eraseInterval = setInterval(() => {
      if (eraseStep < oldSuffix.length) {
        setCurrentText(
          commonPrefix +
            oldSuffix.substring(0, oldSuffix.length - eraseStep - 1),
        );
        eraseStep++;
      } else {
        clearInterval(eraseInterval);

        // Start typing the new suffix
        let typeStep = 0;
        const typeInterval = setInterval(() => {
          if (typeStep <= newSuffix.length) {
            setCurrentText(commonPrefix + newSuffix.substring(0, typeStep));
            typeStep++;
          } else {
            clearInterval(typeInterval);
            setCurrentIndex(nextIndex);
            setIsAnimating(false);
          }
        }, 50); // Typing speed
      }
    }, 50); // Erasing speed
  }, [currentText, currentIndex, isAnimating, getRandomNextIndex]);

  useEffect(() => {
    const timer = setTimeout(() => {
      animateToNextText();
    }, 5000);

    return () => clearTimeout(timer);
  }, [animateToNextText]);

  return (
    <div className={styles.animatedHeader}>
      <h1 className={styles.animatedText}>
        {currentText}
        {/* <span className={styles.cursor}>|</span> */}
      </h1>
    </div>
  );
}
