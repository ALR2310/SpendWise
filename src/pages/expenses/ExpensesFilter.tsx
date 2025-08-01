import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import DatePicker from '~/components/DatePicker';

interface ExpensesFilterProps {
  value?: { name: string; date: Date | undefined };
  onChange?: (name: string, date: Date | undefined) => void;
}

export default function ExpensesFilter({ value, onChange }: ExpensesFilterProps) {
  const { t } = useTranslation();

  const [nameValue, setNameValue] = useState(value?.name);
  const [dateValue, setDateValue] = useState(value?.date);

  useEffect(() => {
    setNameValue(value?.name);
    setDateValue(value?.date);
  }, [value]);

  return (
    <div className="flex gap-4 mb-4">
      <DatePicker
        inputClassName="btn btn-soft justify-center"
        value={dateValue}
        onChange={(date) => {
          setDateValue(date);
          onChange?.(nameValue ?? '', date);
        }}
      />

      <label className="input">
        <input
          type="search"
          className="grow"
          placeholder={t('expenses.filter.search')}
          value={value?.name}
          onChange={(e) => {
            setNameValue(e.target.value);
            onChange?.(e.target.value, dateValue);
          }}
        />
        <i className="fa-regular fa-magnifying-glass text-base-content/60"></i>
      </label>
    </div>
  );
}
