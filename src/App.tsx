import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Home from './pages/Home';
import SearchPage from './pages/Search';
import Trace from './pages/Trace';
import NotFound from './pages/NotFound';

const router = createBrowserRouter([
  { path: '/', element: <AppLayout><Home /></AppLayout> },
  { path: '/search', element: <AppLayout><SearchPage /></AppLayout> },
  { path: '/trace', element: <AppLayout><Trace /></AppLayout> },
  { path: '*', element: <NotFound /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
