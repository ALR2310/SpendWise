import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { RefObject, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import DatePicker from '~/components/DatePicker';
import Modal from '~/components/Modal';
import { expenseModel } from '~/configs/model';
import { toast } from '~/hooks/useToast';
import { ExpenseModel, ExpenseType } from '~/models/expenseModel';

interface ExpensesModalProps {
  ref: RefObject<HTMLDialogElement | null>;
  data?: ExpenseModel & { _id: string };
  onChange?: (newExpense: ExpenseModel) => void;
}

export default function ExpensesModal({ ref, data, onChange }: ExpensesModalProps) {
  const { t } = useTranslation();

  const [nameInvalid, setNameInvalid] = useState(false);
  const [amountInvalid, setAmountInvalid] = useState(false);

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [name, setName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<ExpenseType>(ExpenseType.Expense);
  const [note, setNote] = useState<string>('');
  const [recurring, setRecurring] = useState<boolean>(false);

  useEffect(() => {
    if (data) {
      setDate(new Date(data.date));
      setName(data.name);
      setAmount(data.amount.toString());
      setType(data.type);
      setNote(data.description || '');
      setRecurring(data.recurring || false);
    }
  }, [data]);

  const saveExpenseMutation = useMutation({
    mutationFn: async () => {
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

      const expense = {
        name: name,
        date: dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
        amount: Number(amount),
        type,
        description: note,
        recurring,
        createdAt: now,
        updatedAt: now,
      };

      if (data && data._id) return expenseModel.updateOne({ _id: data._id }, expense);
      return expenseModel.insertOne(expense);
    },
    onSuccess: (data: any) => {
      onChange?.(data);
      ref.current?.close();
    },
    onError: () => {
      ref.current?.close();
      toast.error('Failed to create expense');
    },
  });

  const handleSaveClick = () => {
    const isNameValid = !!name.trim();
    const isAmountValid = !!amount.trim();
    setNameInvalid(!isNameValid);
    setAmountInvalid(!isAmountValid);
    if (!isNameValid || !isAmountValid) return;
    saveExpenseMutation.mutate();
  };

  return (
    <Modal
      ref={ref}
      title={data ? t('expenses.modal.edit.title') : t('expenses.modal.create.title')}
      btnShow={false}
      backdropClose={true}
    >
      <div className="grid grid-cols-2 gap-4 mt-4">
        <label className="floating-label">
          <span>{t('expenses.modal.create.form.name')}</span>
          <input
            type="text"
            placeholder={t('expenses.modal.create.form.name')}
            className={`input ${nameInvalid ? 'input-error!' : ''}`}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameInvalid(false);
            }}
          />
        </label>

        <label className="floating-label">
          <span>{t('expenses.modal.create.form.date')}</span>
          <DatePicker
            inputClassName="input w-full"
            datePickerClassName="dropdown-end"
            value={date}
            onChange={(date) => setDate(date)}
          />
        </label>

        <label className="floating-label">
          <span>{t('expenses.modal.create.form.amount')}</span>
          <input
            type="text"
            placeholder={t('expenses.modal.create.form.amount')}
            className={`input ${amountInvalid ? 'input-error!' : ''}`}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setAmountInvalid(false);
            }}
          />
        </label>

        <label className="floating-label">
          <span>{t('expenses.modal.create.form.type.title')}</span>
          <select className="select" value={type} onChange={(e) => setType(e.target.value as ExpenseType)}>
            <option value="expense">{t('expenses.modal.create.form.type.expense')}</option>
            <option value="income">{t('expenses.modal.create.form.type.income')}</option>
          </select>
        </label>

        {type === ExpenseType.Income && (
          <label className="label justify-end col-span-2">
            <span>{t('expenses.modal.create.form.recurring')}</span>
            <input
              type="checkbox"
              className="toggle"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
            />
          </label>
        )}

        <label className="floating-label col-span-2">
          <span>{t('expenses.modal.create.form.note')}</span>
          <input
            type="text"
            placeholder={t('expenses.modal.create.form.note')}
            className="input w-full"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
      </div>

      <div className="flex justify-end gap-3 mt-4">
        <button className="btn btn-soft w-22" onClick={() => ref.current?.close()}>
          {t('btn.cancel')}
        </button>
        <button className="btn btn-success w-22" onClick={handleSaveClick}>
          {t('btn.save')}
        </button>
      </div>
    </Modal>
  );
}
