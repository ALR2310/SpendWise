import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { AnimatePresence, motion } from 'framer-motion';
import React, { RefObject, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { expenseModel } from '~/configs/model';
import { ExpenseModel } from '~/models/expenseModel';

interface ExpensesTableProps {
  ref: RefObject<HTMLDivElement | null>;
  data: ExpenseModel[];
  onLoadMore?: () => void;
  onLongPress?: (item: ExpenseModel) => void;
  onSortChange?: (field: keyof ExpenseModel) => void;
  currentSort?: { field: keyof ExpenseModel; direction: 1 | -1 };
}

export default function ExpensesTable({
  ref,
  data,
  onLoadMore,
  onLongPress,
  onSortChange,
  currentSort,
}: ExpensesTableProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const hasTriggered = useRef(false);

  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const LONG_PRESS_DELAY = 500;

  const toggleRow = (index: number) =>
    setOpenIndexes((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));

  const startLongPress = (item: ExpenseModel) => {
    longPressTimeout.current = setTimeout(() => {
      onLongPress?.(item);
    }, LONG_PRESS_DELAY);
  };

  const cancelLongPress = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
  };

  const handleSort = (field: keyof ExpenseModel) => {
    onSortChange?.(field);
  };

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => expenseModel.deleteOne({ _id: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  return (
    <div
      ref={ref}
      className="overflow-x-auto flex flex-col h-full justify-between bg-base-100"
      onScroll={() => {
        const el = ref.current;
        if (!el) return;
        const { scrollTop } = el;
        if (scrollTop < 100) {
          if (!hasTriggered.current) {
            hasTriggered.current = true;
            onLoadMore?.();
          }
        } else {
          hasTriggered.current = false;
        }
      }}
    >
      <table className="table table-pin-rows">
        <thead>
          <tr>
            <th onClick={() => handleSort('date')} className="cursor-pointer select-none">
              {t('expenses.table.header.date')}
              {currentSort?.field === 'date' && (
                <i
                  className={`ml-1 fas fa-sort-${currentSort?.field === 'date' && currentSort.direction === 1 ? 'up' : 'down'}`}
                ></i>
              )}
            </th>

            <th onClick={() => handleSort('name')} className="cursor-pointer select-none">
              {t('expenses.table.header.expense')}
              {currentSort?.field === 'name' && (
                <i
                  className={`ml-1 fas fa-sort-${currentSort?.field === 'name' && currentSort.direction === 1 ? 'up' : 'down'}`}
                ></i>
              )}
            </th>

            <th onClick={() => handleSort('amount')} className="cursor-pointer select-none">
              {t('expenses.table.header.amount')}
              {currentSort?.field === 'amount' && (
                <i
                  className={`ml-1 fas fa-sort-${currentSort?.field === 'amount' && currentSort.direction === 1 ? 'up' : 'down'}`}
                ></i>
              )}
            </th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {data?.map((item, index) => {
            const showDate =
              index === data.length - 1 ||
              dayjs(item.date).format('DD/MM/YYYY') !== dayjs(data[index + 1].date).format('DD/MM/YYYY');
            const isOpen = openIndexes.includes(index);

            return (
              <React.Fragment key={index}>
                <tr
                  className="hover border-b-0 cursor-pointer"
                  onClick={() => toggleRow(index)}
                  onMouseDown={() => startLongPress(item)}
                  onMouseUp={cancelLongPress}
                  onMouseLeave={cancelLongPress}
                  onTouchStart={() => startLongPress(item)}
                  onTouchEnd={cancelLongPress}
                  onTouchCancel={cancelLongPress}
                >
                  <td>{showDate ? dayjs(item.date).format('DD/MM/YYYY') : ''}</td>
                  <td>{item.name}</td>
                  <td>{item.amount.toLocaleString() + ' đ'}</td>
                  <td className="w-4 text-right pr-2">
                    <i
                      className={`fas fa-chevron-down transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    ></i>
                  </td>
                </tr>

                <AnimatePresence>
                  {isOpen && (
                    <motion.tr
                      className="border-b border-base-content/10"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td></td>
                      <td colSpan={2} className="text-sm text-base-content/70 overflow-hidden py-2">
                        {item.description}
                      </td>
                      <td className="text-right pr-2 text-error/60 cursor-pointer">
                        <motion.i
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="fa-regular fa-trash-can"
                          onClick={() => deleteExpenseMutation.mutate((item as any)._id)}
                        ></motion.i>
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
