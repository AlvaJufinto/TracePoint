import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Welcome
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          This is a clean React + Vite + Tailwind CSS starter.
        </p>
        <nav className="mt-8 flex gap-4">
          <Link
            to="/test"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            Go to unknown route (triggers Not Found)
          </Link>
        </nav>
      </div>
    </main>
  );
}
