import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
      <a href="https://logo.dev" target="_blank" rel="noopener noreferrer" style={{ position: 'fixed', bottom: 4, right: 8, fontSize: 10, color: '#9ca3af', zIndex: 9999 }}>
        Logos provided by Logo.dev
      </a>
    </>
  );
}