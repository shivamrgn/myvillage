import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout';
import { AdminLayout } from '../components/layout/AdminLayout';

// Public Pages
import { HomePage } from '../pages/public/HomePage';
import { ReportProblemPage } from '../pages/public/ReportProblemPage';
import { TrackComplaintPage } from '../pages/public/TrackComplaintPage';
import { SuccessPage } from '../pages/public/SuccessPage';
import { HelpPage } from '../pages/public/HelpPage';
import { PrivacyPolicyPage } from '../pages/public/PrivacyPolicyPage';
import { NotFoundPage } from '../pages/public/NotFoundPage';

// Admin Pages
import { AdminLoginPage } from '../pages/admin/AdminLoginPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { ComplaintListingPage } from '../pages/admin/ComplaintListingPage';
import { ComplaintDetailPage } from '../pages/admin/ComplaintDetailPage';
import { ComplaintManagementPage } from '../pages/admin/ComplaintManagementPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Citizen Portal */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/report" element={<ReportProblemPage />} />
        {/* Alias /submit to /report for convenience */}
        <Route path="/submit" element={<Navigate to="/report" replace />} />
        <Route path="/track" element={<TrackComplaintPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Authenticated Admin Portal */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="complaints" element={<ComplaintListingPage />} />
        <Route path="complaint/:id" element={<ComplaintDetailPage />} />
        <Route path="manage/:id" element={<ComplaintManagementPage />} />
      </Route>
    </Routes>
  );
};
