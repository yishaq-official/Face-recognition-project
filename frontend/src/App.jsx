// /frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import PublicView   from './pages/PublicView';
import AdminLayout  from './pages/admin/AdminLayout';
import Enrollment   from './pages/admin/Enrollment';
import MemberList   from './pages/admin/MemberList';
import Login        from './pages/Login';
import HistoryLogs  from './pages/admin/HistoryLogs';
import PrivateRoute from './components/PrivateRoute';
import AuthProvider from './components/AuthProvider';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/"      element={<PublicView />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminLayout />
              </PrivateRoute>
            }
          >
            <Route index              element={<Navigate to="enrollment" replace />} />
            <Route path="enrollment"  element={<Enrollment />} />
            <Route path="members"     element={<MemberList />} />
            <Route path="history"     element={<HistoryLogs />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;