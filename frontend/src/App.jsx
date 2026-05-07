// /frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import PublicView   from './pages/PublicView';
import AdminLayout  from './pages/admin/AdminLayout';
import Enrollment   from './pages/admin/Enrollment';
import MemberList   from './pages/admin/MemberList';
import Login        from './pages/Login';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public cyber scanner interface */}
        <Route path="/"      element={<PublicView />} />

        {/* Admin login — accessible without auth */}
        <Route path="/login" element={<Login />} />

        {/* Admin dashboard — every child requires a valid JWT */}
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route index                element={<Navigate to="enrollment" replace />} />
          <Route path="enrollment"   element={<Enrollment />} />
          <Route path="members"      element={<MemberList />} />
          {/* <Route path="history" element={<HistoryLogs />} /> */}
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;