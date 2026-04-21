import React from 'react';
import { Navigate } from 'react-router-dom';

// This page has been deprecated and removed from the admin dashboard.
// Redirecting to dashboard to prevent access.
const AdminMetricsRecalculationPage = () => {
  return <Navigate to="/admin/dashboard" replace />;
};

export default AdminMetricsRecalculationPage;