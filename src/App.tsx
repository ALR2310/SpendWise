import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import MainLayout from './components/layouts/MainLayout';
import ExpensesPage from './pages/expenses/ExpensesPage';
import NoteDetailPage from './pages/note/NoteDetailPage';
import NoteListPage from './pages/note/NoteListPage';
import SettingsDataPage from './pages/settings/SettingsDataPage';
import SettingsPage from './pages/settings/SettingsPage';
import { ConfirmProvider } from './providers/ConfirmProvider';
import { ToastProvider } from './providers/ToastProvider';

export default function App() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <ConfirmProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route path="expenses" element={<ExpensesPage />} />
                <Route path="statistics" element={<div></div>} />
                <Route path="notes">
                  <Route index element={<NoteListPage />} />
                  <Route path=":id" element={<NoteDetailPage />} />
                </Route>
                <Route path="settings">
                  <Route index element={<SettingsPage />} />
                  <Route path="data" element={<SettingsDataPage />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </ConfirmProvider>
    </QueryClientProvider>
  );
}
