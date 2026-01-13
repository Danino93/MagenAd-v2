import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // We'll need to double check this hook exists or create it
// import Sidebar from '../components/Sidebar'; // Assuming we have or will have a sidebar

/**
 * Layout עבור האפליקציה (Dashboard)
 * כאן יהיה ה-Sidebar, בדיקת אימות (Auth Guard), וכו'
 */
const AppLayout = () => {
  // Placeholder for auth check
  const isAuthenticated = true; // TODO: Connect to actual Auth hook

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 flex">
        {/* <Sidebar />  TODO: Add Sidebar */}
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
            <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
