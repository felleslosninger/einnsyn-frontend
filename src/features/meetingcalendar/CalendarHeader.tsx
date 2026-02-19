'use client';

import {
  Button,
  Checkbox,
  Dropdown,
  Heading,
  Switch,
  ValidationMessage,
  Label,
  Input,
  Alert,
  ToggleGroup,
} from '@digdir/designsystemet-react';
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  PencilIcon,
} from '@navikt/aksel-icons';
import { useMemo, useRef, useState, useEffect } from 'react';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import styles from './CalendarContainer.module.scss';
import type { CalendarView } from './calendarHelpers';

interface CalendarHeaderProps {
  selectedView: CalendarView;
  setSelectedView: (view: CalendarView) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  displayWeekends: boolean;
  setDisplayWeekends: (display: boolean) => void;
  weekendWarning: boolean;
  currentCalendarResults: number;
}

export default function CalendarHeader({
  selectedView,
  setSelectedView,
  selectedDate,
  setSelectedDate,
  displayWeekends,
  setDisplayWeekends,
  weekendWarning,
  currentCalendarResults,
}: CalendarHeaderProps) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const dateInputRef = useRef<HTMLInputElement | null>(null);

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
        return `${t(`meetingcalendar.months.${selectedDate.getMonth()}`)} ${selectedDate.getFullYear()}`;

      case 'week': {
        const weekNumber = getWeekNumber(selectedDate);
        return `${t('meetingcalendar.viewOptions.week')} ${weekNumber}, ${t(`meetingcalendar.months.${selectedDate.getMonth()}`)} ${selectedDate.getFullYear()}`;
      }

      case 'day':
        return selectedDate.toLocaleDateString('en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });

      default:
        return '';
    }
  }, [selectedView, selectedDate, t]);

  // Automatically focus and show picker when entering edit mode
  useEffect(() => {
    if (isEditing && dateInputRef.current) {
      dateInputRef.current.focus();
      // Modern browsers support showing the picker programmatically
      if ('showPicker' in HTMLInputElement.prototype) {
        dateInputRef.current.showPicker();
      }
    }
  }, [isEditing]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!Number.isNaN(newDate.getTime())) {
      setSelectedDate(newDate);
      setIsEditing(false); // Close after selection
    }
  };

  const navButtons = useMemo(() => {
    const changeMonth = (offset: number) => {
      const newDate = new Date(selectedDate);
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
              onClick={() => changeWeek(-3)} // Previous Month
            >
              <ChevronUpIcon className={cn(styles.arrowIcon)} />
            </Button>

            <Button
              data-color="neutral"
              data-size="sm"
              icon
              type="button"
              variant="tertiary"
              onClick={() => changeWeek(3)} // Next Month
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
  }, [selectedView, selectedDate, setSelectedDate]);

  return (
    <div className={cn('calendarHeader', styles.calendarHeader)}>
      <div className={cn('headerInfo', styles.headerInfo)}>
        <span>Viser {currentCalendarResults} søketreff</span>
      </div>
      <div className={cn('headerActions', styles.headerActions)}>
        <div className={cn('displayHeading', styles.displayHeading)}>
          {isEditing ? (
            <Input
              ref={dateInputRef}
              type="date"
              className={styles.headingDateInput}
              value={new Date(selectedDate).toISOString().split('T')[0]} // Format as YYYY-MM-DD for date input
              onChange={handleDateChange}
              onBlur={() => setIsEditing(false)} // Return to heading if user clicks away
            />
          ) : (
            <Heading
              data-size="md"
              level={1}
              className={styles.clickableHeading}
              onClick={() => setIsEditing(true)}
            >
              {viewHeading}
            </Heading>
          )}
        </div>
        {navButtons}
        <div className={styles.weekendWarningAlert}>
          {weekendWarning && !displayWeekends && selectedView !== 'day' && (
            <Alert data-color="warning" data-size="md">
              {t('meetingcalendar.validationMessages.weekendWarning')}
            </Alert>
          )}
        </div>

        <div className={cn('viewOptions', styles.viewOptions)}>
          <Switch
            label={t('meetingcalendar.viewOptions.displayWeekends')}
            checked={displayWeekends}
            onChange={() => setDisplayWeekends(!displayWeekends)}
            data-size="md"
          />
          <ToggleGroup
            value={selectedView}
            onChange={(value) => setSelectedView(value as CalendarView)}
            data-size="sm"
          >
            <ToggleGroup.Item value="month">
              {t('meetingcalendar.viewOptions.month')}
            </ToggleGroup.Item>

            <ToggleGroup.Item value="week">
              {t('meetingcalendar.viewOptions.week')}
            </ToggleGroup.Item>

            <ToggleGroup.Item value="day">
              {t('meetingcalendar.viewOptions.day')}
            </ToggleGroup.Item>
          </ToggleGroup>
        </div>
      </div>
    </div>
  );
}
