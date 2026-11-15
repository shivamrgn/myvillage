import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout';
import { AdminLayout } from '../components/layout/AdminLayout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

// Eagerly loaded for instant First Contentful Paint
import { HomePage } from '../pages/public/HomePage';

// Lazy loaded on demand to minimize initial JavaScript bundle & parsing
const ReportProblemPage = lazy(() => import('../pages/public/ReportProblemPage').then(m => ({ default: m.ReportProblemPage })));
const TrackComplaintPage = lazy(() => import('../pages/public/TrackComplaintPage').then(m => ({ default: m.TrackComplaintPage })));
const SuccessPage = lazy(() => import('../pages/public/SuccessPage').then(m => ({ default: m.SuccessPage })));
const HelpPage = lazy(() => import('../pages/public/HelpPage').then(m => ({ default: m.HelpPage })));
const PrivacyPolicyPage = lazy(() => import('../pages/public/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const NotFoundPage = lazy(() => import('../pages/public/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

// Admin Pages (isolated from citizen initial bundle)
const AdminLoginPage = lazy(() => import('../pages/admin/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const ComplaintListingPage = lazy(() => import('../pages/admin/ComplaintListingPage').then(m => ({ default: m.ComplaintListingPage })));
const ComplaintDetailPage = lazy(() => import('../pages/admin/ComplaintDetailPage').then(m => ({ default: m.ComplaintDetailPage })));
const ComplaintManagementPage = lazy(() => import('../pages/admin/ComplaintManagementPage').then(m => ({ default: m.ComplaintManagementPage })));

const SuspenseLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center py-12">
    <LoadingSpinner text="Loading..." />
  </div>
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<SuspenseLoader />}>
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
    </Suspense>
  );
};
