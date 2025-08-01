import 'react-datepicker/dist/react-datepicker.css';

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import { RefObject, useEffect, useRef, useState } from 'react';

import { expenseModel } from '~/configs/model';
import { appSettings } from '~/configs/settings';
import { ExpenseModel } from '~/models/expenseModel';
import { THEME } from '~/shared/types/settings.type';

import { handleBackupData } from '../settings/logic/data';
import ExpensesFilter from './ExpensesFilter';
import ExpensesModal from './ExpensesModal';
import ExpensesTable from './ExpensesTable';

const buildFilter = (filter: { name: string; date: Date | undefined }) => {
  const filterObj: any = {};
  if (filter.name) filterObj.name = { $regex: `%${filter.name}%` };
  if (filter.date) filterObj.date = { $gte: dayjs(filter.date).format('YYYY-MM-DD HH:mm:ss') };
  return filterObj;
};

const resetScrollBar = (elRef: RefObject<HTMLDivElement | null>, page: number) => {
  const el = elRef.current;
  if (!el) return;

  const prevScrollHeight = el.scrollHeight;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const newScrollHeight = el.scrollHeight;

      if (page === 1) {
        el.scrollTop = el.scrollHeight;
      } else {
        el.scrollTop += newScrollHeight - prevScrollHeight;
      }
    });
  });
};

export default function ExpensesPage() {
  const constraintsRef = useRef(null);
  const modalRef = useRef<HTMLDialogElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [page, setPage] = useState(1);
  const [expensesData, setExpensesData] = useState<ExpenseModel[]>([]);

  const [nameFilter, setNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

  const [currentExpense, setCurrentExpense] = useState<any>(undefined);

  const [sort, setSort] = useState<{ field: keyof ExpenseModel; direction: 1 | -1 }>({
    field: 'date',
    direction: -1,
  });

  const theme = appSettings.general.theme;

  const handleSortChange = (field: keyof ExpenseModel) => {
    if (field === sort.field) {
      setSort({ field, direction: -sort.direction as 1 | -1 });
    } else {
      setSort({ field, direction: 1 });
    }
    setPage(1);
  };

  const expensesQuery = useQuery({
    queryKey: ['expenses', page, nameFilter, dateFilter, sort],
    queryFn: async () => {
      return expenseModel.paginate(buildFilter({ name: nameFilter, date: dateFilter }), {
        page,
        limit: 20,
        sort: { [sort.field]: sort.direction },
      });
    },
  });

  useEffect(() => {
    if (!expensesQuery.data || expensesQuery.isLoading) return;
    const items = expensesQuery.data.docs.reverse();

    //Handle data
    setExpensesData((prev: any[]) => {
      if (page === 1) return items;
      return [...items, ...prev];
    });

    // Handle scroll
    resetScrollBar(tableRef, page);
  }, [expensesQuery.data, expensesQuery.isLoading, page]);

  return (
    <motion.div
      ref={constraintsRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full p-4 overflow-hidden"
    >
      <ExpensesFilter
        onChange={(name, date) => {
          setPage(1);
          resetScrollBar(tableRef, page);
          setNameFilter(name);
          setDateFilter(date);
        }}
      />

      <ExpensesTable
        ref={tableRef}
        data={expensesData}
        onLoadMore={() => setPage((prev) => prev + 1)}
        onLongPress={(item) => {
          console.log(item);
          modalRef.current?.showModal();
          setCurrentExpense(item);
        }}
        currentSort={sort}
        onSortChange={handleSortChange}
      />

      <ExpensesModal
        ref={modalRef}
        data={currentExpense}
        onChange={() => {
          setPage(1);
          expensesQuery.refetch();
          resetScrollBar(tableRef, page);
          handleBackupData();
        }}
      />

      <motion.button
        drag="y"
        dragConstraints={constraintsRef}
        dragTransition={{ power: 0, bounceStiffness: 1000, bounceDamping: 1000 }}
        className={`btn  ${theme === THEME.LIGHT ? '' : 'btn-soft'} btn-accent fixed bottom-[16.5%] right-6`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onPointerDown={() => setIsDragging(false)}
        onDrag={() => setIsDragging(true)}
        onClick={(e) => {
          if (!isDragging) modalRef.current?.showModal();
          else e.preventDefault();
        }}
      >
        <i className="fa-regular fa-plus"></i>
      </motion.button>
    </motion.div>
  );
}
