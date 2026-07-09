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
} from '@navikt/aksel-icons';
import { useMemo, useRef } from 'react';
import { useTranslation } from '~/hooks/useTranslation';
import styles from './CalendarContainer.module.scss';
import {
  type CalendarView,
  getIsoWeekNumber,
  toDateString,
} from './calendarHelpers';

type Props = {
  selectedView: CalendarView;
  setSelectedView: (view: CalendarView) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  visibleMonth: Date;
  displayWeekends: boolean;
  setDisplayWeekends: (display: boolean) => void;
};

type Translate = ReturnType<typeof useTranslation>;

const formatViewHeading = (
  view: CalendarView,
  selectedDate: Date,
  visibleMonth: Date,
  t: Translate,
): string => {
  switch (view) {
    case 'month':
      return `${t(`calendar.months.${visibleMonth.getMonth()}`)} ${visibleMonth.getFullYear()}`;
    case 'week': {
      const week = getIsoWeekNumber(selectedDate);
      const month = t(`calendar.months.${selectedDate.getMonth()}`);
      return `${t('calendar.viewOptions.week')} ${week}, ${month} ${selectedDate.getFullYear()}`;
    }
    case 'day': {
      const weekday = t(`calendar.days.${selectedDate.getDay()}`);
      const month = t(`calendar.months.${selectedDate.getMonth()}`);
      return `${weekday} ${selectedDate.getDate()} ${month}`;
    }
  }
};

const NavButton = ({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <Button
    data-color="neutral"
    data-size="sm"
    icon
    type="button"
    variant="tertiary"
    onClick={onClick}
  >
    {children}
  </Button>
);

export default function CalendarHeader({
  selectedView,
  setSelectedView,
  selectedDate,
  setSelectedDate,
  visibleMonth,
  displayWeekends,
  setDisplayWeekends,
}: Props) {
  const t = useTranslation();
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const openDatePicker = () => dateInputRef.current?.showPicker();

  const viewHeading = useMemo(
    () => formatViewHeading(selectedView, selectedDate, visibleMonth, t),
    [selectedView, selectedDate, visibleMonth, t],
  );

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [y, m, d] = e.target.value.split('-').map(Number);
    if (!y || !m || !d) return;
    const next = new Date(y, m - 1, d);
    if (!Number.isNaN(next.getTime())) setSelectedDate(next);
  };

  const nav = useMemo(() => {
    // Month chevrons operate on visibleMonth so the arrow matches what the
    // user actually sees (they may have scrolled away from selectedDate).
    const shift = (unit: 'month' | 'week' | 'day', offset: number) => {
      const base = unit === 'month' ? visibleMonth : selectedDate;
      const next = new Date(base);
      if (unit === 'month') {
        next.setDate(1);
        next.setMonth(next.getMonth() + offset);
      } else if (unit === 'week') {
        next.setDate(next.getDate() + offset * 7);
      } else {
        next.setDate(next.getDate() + offset);
      }
      setSelectedDate(next);
    };
    if (selectedView === 'month') {
      return (
        <>
          <NavButton onClick={() => shift('month', -1)}>
            <ChevronUpIcon />
          </NavButton>
          <NavButton onClick={() => shift('month', 1)}>
            <ChevronDownIcon />
          </NavButton>
        </>
      );
    }
    const unit = selectedView === 'week' ? 'week' : 'day';
    return (
      <>
        <NavButton onClick={() => shift(unit, -1)}>
          <ChevronLeftIcon />
        </NavButton>
        <NavButton onClick={() => shift(unit, 1)}>
          <ChevronRightIcon />
        </NavButton>
      </>
    );
  }, [selectedView, selectedDate, visibleMonth, setSelectedDate]);

  return (
    <div className={styles.calendarHeader}>
      <div className={styles.headerActions}>
        <div className={styles.viewOptionsLeft}>
          <Button
            variant="tertiary"
            data-color="neutral"
            data-size="sm"
            onClick={() => setSelectedDate(new Date())}
          >
            {t('calendar.viewOptions.today')}
          </Button>

          {nav}

          <Button
            className={styles.displayHeading}
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
              <ChevronDownIcon />
            </Heading>
            <input
              ref={dateInputRef}
              type="date"
              className={styles.hiddenDateInput}
              value={toDateString(selectedDate)}
              onChange={handleDateChange}
              aria-hidden="true"
              tabIndex={-1}
            />
          </Button>
        </div>

        <div className={styles.viewOptions}>
          <Button
            variant="tertiary"
            data-color="neutral"
            data-size="sm"
            popoverTarget="view-dropdown"
            aria-label={t('calendar.viewOptions.selectView')}
          >
            <CalendarIcon />
            <span>{t(`calendar.viewOptions.${selectedView}`)}</span>
            <ChevronDownIcon />
          </Button>
          <Dropdown id="view-dropdown" data-color="neutral">
            <Dropdown.List>
              {(['month', 'week', 'day'] as const).map((v) => (
                <Dropdown.Item key={v}>
                  <Dropdown.Button onClick={() => setSelectedView(v)}>
                    {t(`calendar.viewOptions.${v}`)}
                  </Dropdown.Button>
                </Dropdown.Item>
              ))}
            </Dropdown.List>
          </Dropdown>

          <Switch
            data-color="neutral"
            data-size="sm"
            label={t('calendar.viewOptions.displayWeekends')}
            checked={displayWeekends}
            onChange={() => setDisplayWeekends(!displayWeekends)}
          />
        </div>
      </div>
    </div>
  );
}
