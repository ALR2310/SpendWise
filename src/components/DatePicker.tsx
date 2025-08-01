import { vi } from 'date-fns/locale';
import dayjs from 'dayjs';
import { useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { useTranslation } from 'react-i18next';

import { uniqueId } from '~/assets/libs/nosqlite/helper';

interface DatePickerProps {
  className?: string;
  inputClassName?: string;
  datePickerClassName?: string;
  value?: Date;
  placeholder?: string;
  onChange?: (date: Date | undefined) => void;
}

export default function DatePicker({
  className,
  inputClassName,
  datePickerClassName,
  value,
  placeholder,
  onChange,
}: DatePickerProps) {
  const { t } = useTranslation();
  const btnDatePicker = useRef<HTMLButtonElement>(null);
  const pickerId = uniqueId();
  const anchorId = `--rdp-${pickerId}`;
  const [date, setDate] = useState<Date | undefined>(value);

  const handleSelect = (selected: Date | undefined) => {
    setDate(selected);
    onChange?.(selected);
  };

  return (
    <label className={`${className}`}>
      <button
        ref={btnDatePicker}
        popoverTarget={pickerId}
        className={`${inputClassName}`}
        style={{ anchorName: anchorId } as React.CSSProperties}
      >
        <i className="fa-regular fa-calendar-range"></i>
        {date ? (
          dayjs(date).format('DD/MM/YYYY')
        ) : placeholder ? (
          <span className="text-sm text-base-content/60">{placeholder}</span>
        ) : null}
      </button>

      {/* DatePicker Section */}
      <div
        id={pickerId}
        popover="auto"
        className={`dropdown ${datePickerClassName} relative`}
        style={{ positionAnchor: anchorId } as React.CSSProperties}
      >
        <DayPicker
          locale={vi}
          mode="single"
          selected={date as Date}
          onSelect={(date) => handleSelect(date)}
          className="react-day-picker"
        />
        <button className="btn btn-sm btn-link absolute bottom-0 right-0" onClick={() => handleSelect(undefined)}>
          {t('calendar.clear')}
        </button>
      </div>
    </label>
  );
}
