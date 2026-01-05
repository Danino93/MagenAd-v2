import { useState, useEffect } from 'react';
import supabase from './config/supabase';

function App() {
  const [status, setStatus] = useState('בודק חיבור...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      // Try to count users (should be 0)
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      
      setStatus(`✅ מחובר ל-Supabase! (${count} משתמשים)`);
      setLoading(false);
    } catch (error) {
      setStatus(`❌ שגיאה: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
          MagenAd V2
        </h1>
        <div className="text-center">
          {loading ? (
            <div className="text-gray-600 animate-pulse">
              {status}
            </div>
          ) : (
            <div className={`text-lg font-semibold ${
              status.includes('✅') ? 'text-green-600' : 'text-red-600'
            }`}>
              {status}
            </div>
          )}
        </div>
        <div className="mt-6 text-sm text-gray-500 text-center">
          יום 2: Supabase Setup
        </div>
      </div>
    </div>
  );
}

export default App;
