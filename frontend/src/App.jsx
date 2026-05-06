// /frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Pages (We will build these next)
import PublicView from './pages/PublicView';
import AdminLayout from './pages/admin/AdminLayout';
import Enrollment from './pages/admin/Enrollment';
import MemberList from './pages/admin/MemberList';
// import HistoryLogs from './pages/admin/HistoryLogs';

function App() {
  return (
    <Router>
      <Routes>
        {/* The Cyber Public Interface */}
        <Route path="/" element={<PublicView />} />

        {/* The Clean Admin Dashboard */}
        <Route path="/admin" element={<AdminLayout />}>
          {/* Default admin route redirects to members */}
          <Route index element={<Navigate to="enrollment" replace />} />
          <Route path="enrollment" element={<Enrollment />} />
          <Route path="members" element={<MemberList />} />
          {/* <Route path="history" element={<HistoryLogs />} /> */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;