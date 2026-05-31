import WatchlistForm from '../components/WatchlistForm';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function AddPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="max-w-xl mx-auto p-6">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-sm font-medium rounded-lg transition">
          &larr; Back to Overview
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-8">Add to Watchlist</h1>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
        <WatchlistForm />
      </div>
    </main>
  );
}
