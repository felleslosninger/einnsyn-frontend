'use client';

import {
  Button,
  Dropdown,
  Heading,
  Switch,
} from '@digdir/designsystemet-react';
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ExclamationmarkTriangleIcon,
  XMarkIcon,
} from '@navikt/aksel-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import styles from './CalendarContainer.module.scss';
import type { CalendarView } from './calendarHelpers';

interface CalendarHeaderProps {
  selectedView: CalendarView;
  setSelectedView: (view: CalendarView) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  visibleMonth: Date;
  displayWeekends: boolean;
  setDisplayWeekends: (display: boolean) => void;
  hasWeekendWarning: boolean;
  resultCount: number;
}

export default function CalendarHeader({
  selectedView,
  setSelectedView,
  selectedDate,
  setSelectedDate,
  visibleMonth,
  displayWeekends,
  setDisplayWeekends,
  hasWeekendWarning,
  resultCount,
}: CalendarHeaderProps) {
  const t = useTranslation();
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const weekendDialogRef = useRef<HTMLDialogElement | null>(null);
  // Gate portal rendering to client-side only to avoid SSR/hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const openDatePicker = () => dateInputRef.current?.showPicker();

  const viewHeading = useMemo(() => {
    const getWeekNumber = (date: Date): number => {
      const tempDate = new Date(date.getTime());
      tempDate.setHours(0, 0, 0, 0);
      tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7));
      const week1 = new Date(tempDate.getFullYear(), 0, 4);
      return (
        1 +
        Math.round(
          ((tempDate.getTime() - week1.getTime()) / 86400000 -
            3 +
            ((week1.getDay() + 6) % 7)) /
            7,
        )
      );
    };

    switch (selectedView) {
      case 'month':
        return `${t(`calendar.months.${visibleMonth.getMonth()}`)} ${visibleMonth.getFullYear()}`;

      case 'week': {
        const weekNumber = getWeekNumber(selectedDate);
        return `${t('calendar.viewOptions.week')} ${weekNumber}, ${t(`calendar.months.${selectedDate.getMonth()}`)} ${selectedDate.getFullYear()}`;
      }

      case 'day': {
        const weekday = t(`calendar.days.${selectedDate.getDay()}`);
        const month = t(`calendar.months.${selectedDate.getMonth()}`);
        const dayOfMonth = selectedDate.getDate();
        return `${weekday} ${dayOfMonth} ${month}`;
      }

      default:
        return '';
    }
  }, [selectedView, selectedDate, visibleMonth, t]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parts = e.target.value.split('-').map(Number);
    if (parts.length !== 3) return;
    const [y, m, d] = parts;
    const newDate = new Date(y, m - 1, d);
    if (!Number.isNaN(newDate.getTime())) {
      setSelectedDate(newDate);
    }
  };

  const navButtons = useMemo(() => {
    const changeMonth = (offset: number) => {
      // Base off the currently visible month so the chevron matches what the
      // user sees (they may have scrolled away from selectedDate).
      const newDate = new Date(visibleMonth);
      newDate.setDate(1);
      newDate.setMonth(newDate.getMonth() + offset);
      setSelectedDate(newDate);
    };

    const changeWeek = (offset: number) => {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + offset * 7);
      setSelectedDate(newDate);
    };

    const changeDay = (offset: number) => {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + offset);
      setSelectedDate(newDate);
    };

    switch (selectedView) {
      case 'month':
        return (
          <>
            <Button
              data-color="neutral"
              data-size="sm"
              icon
              type="button"
              variant="tertiary"
              onClick={() => changeMonth(-1)}
            >
              <ChevronUpIcon className={cn(styles.arrowIcon)} />
            </Button>

            <Button
              data-color="neutral"
              data-size="sm"
              icon
              type="button"
              variant="tertiary"
              onClick={() => changeMonth(1)}
            >
              <ChevronDownIcon className={cn(styles.arrowIcon)} />
            </Button>
          </>
        );
      case 'week':
        return (
          <>
            <Button
              data-color="neutral"
              data-size="sm"
              icon
              type="button"
              variant="tertiary"
              onClick={() => changeWeek(-1)} // Previous Week
            >
              <ChevronLeftIcon className={cn(styles.arrowIcon)} />
            </Button>

            <Button
              data-color="neutral"
              data-size="sm"
              icon
              type="button"
              variant="tertiary"
              onClick={() => changeWeek(1)} // Next Week
            >
              <ChevronRightIcon className={cn(styles.arrowIcon)} />
            </Button>
          </>
        );
      case 'day':
        return (
          <>
            <Button
              data-color="neutral"
              data-size="sm"
              icon
              type="button"
              variant="tertiary"
              onClick={() => changeDay(-1)} // Previous Day
            >
              <ChevronLeftIcon className={cn(styles.arrowIcon)} />
            </Button>

            <Button
              data-color="neutral"
              data-size="sm"
              icon
              type="button"
              variant="tertiary"
              onClick={() => changeDay(1)} // Next Day
            >
              <ChevronRightIcon className={cn(styles.arrowIcon)} />
            </Button>
          </>
        );
      default:
        return '';
    }
  }, [selectedView, selectedDate, visibleMonth, setSelectedDate]);

  useEffect(() => {
    if (!mounted) return;
    const dialog = weekendDialogRef.current;
    if (!dialog) return;
    if (hasWeekendWarning && !displayWeekends && selectedView !== 'day') {
      if (!dialog.open) dialog.show();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [hasWeekendWarning, displayWeekends, selectedView, mounted]);

  return (
    <>
      <div className={cn('calendar-header', styles.calendarHeader)}>
        {/* <div className={cn('header-info', styles.headerInfo)}>
        <span className={styles.resultsFound}>
          {t('calendar.resultsFound', resultCount.toString())}
        </span>
      </div> */}
        <div className={cn('header-actions', styles.headerActions)}>
          <div className={cn('view-options', styles.viewOptionsLeft)}>
            <Button
              variant="tertiary"
              data-color="neutral"
              data-size="sm"
              onClick={() => setSelectedDate(new Date())}
            >
              {t('calendar.viewOptions.today')}
            </Button>

            {navButtons}
            <Button
              className={cn('display-heading', styles.displayHeading)}
              variant="tertiary"
              data-color="neutral"
            >
              <Heading
                data-size="sm"
                level={1}
                tabIndex={0}
                className={styles.clickableHeading}
                onClick={openDatePicker}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openDatePicker();
                  }
                }}
              >
                {viewHeading}
                <ChevronDownIcon className={styles.headingChevron} />
              </Heading>
              <input
                ref={dateInputRef}
                type="date"
                className={styles.hiddenDateInput}
                value={`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`}
                onChange={handleDateChange}
                aria-hidden="true"
                tabIndex={-1}
              />
            </Button>
          </div>
          <div className={cn('view-options', styles.viewOptions)}>
            <Button
              variant="tertiary"
              data-color="neutral"
              data-size="sm"
              popoverTarget="dropdown"
              aria-label={t('calendar.viewOptions.selectView')}
            >
              <CalendarIcon />
              <span>{t(`calendar.viewOptions.${selectedView}`)}</span>
              <ChevronDownIcon />
            </Button>
            <Dropdown id="dropdown">
              <Dropdown.List>
                <Dropdown.Item>
                  <Dropdown.Button onClick={() => setSelectedView('month')}>
                    {t('calendar.viewOptions.month')}
                  </Dropdown.Button>
                </Dropdown.Item>
                <Dropdown.Item>
                  <Dropdown.Button onClick={() => setSelectedView('week')}>
                    {t('calendar.viewOptions.week')}
                  </Dropdown.Button>
                </Dropdown.Item>
                <Dropdown.Item>
                  <Dropdown.Button onClick={() => setSelectedView('day')}>
                    {t('calendar.viewOptions.day')}
                  </Dropdown.Button>
                </Dropdown.Item>
              </Dropdown.List>
            </Dropdown>

            <Switch
              data-color="neutral"
              label={t('calendar.viewOptions.displayWeekends')}
              checked={displayWeekends}
              onChange={() => setDisplayWeekends(!displayWeekends)}
              data-size="sm"
            />
          </div>
        </div>
      </div>

      {/* Non-modal weekend-warning dialog — portalled to <body> so it escapes the
        calendarHeaderWrapper stacking context and always floats above everything. */}
      {mounted &&
        createPortal(
          <dialog
            ref={weekendDialogRef}
            className={cn('ds-dialog', styles.warningDialog)}
            data-modal="false"
            style={{
              zIndex: 1000,
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              top: 'auto',
              left: 'auto',
              margin: 0,
            }}
          >
            <span className={styles.warningDialogIcon}>
              <ExclamationmarkTriangleIcon />
            </span>
            <div className={styles.warningDialogContent}>
              {t('calendar.validationMessages.weekendWarning')}
            </div>
            <button
              className={cn('ds-button', styles.warningDialogClose)}
              data-variant="tertiary"
              type="button"
              aria-label="Lukk dialogvindu"
              data-color="neutral"
              onClick={() => weekendDialogRef.current?.close()}
            >
              <XMarkIcon />
            </button>
          </dialog>,
          document.body,
        )}
    </>
  );
}
