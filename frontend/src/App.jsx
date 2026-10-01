import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public Pages
import { Home } from './pages/public/Home';
import { PublicEventPage } from './pages/public/PublicEventPage';
import { RegistrationPage } from './pages/public/RegistrationPage';
import { RegistrationSuccessPage } from './pages/public/RegistrationSuccessPage';
import { DigitalPassPage } from './pages/public/DigitalPassPage';
import { PublicVerifyCertificatePage } from './pages/public/PublicVerifyCertificatePage';
import { ParticipantPortal } from './pages/participant/ParticipantPortal';
import { HelpPage } from './pages/public/HelpPage';

// Volunteer Pages
import { VolunteerLogin } from './pages/volunteer/VolunteerLogin';
import { VolunteerScannerDashboard } from './pages/volunteer/VolunteerScannerDashboard';

// Admin Pages
import { AdminLogin } from './pages/auth/AdminLogin';
import { AdminRegister } from './pages/auth/AdminRegister';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { EventsList } from './pages/admin/EventsList';
import { CreateEditEvent } from './pages/admin/CreateEditEvent';
import { EventDetailDashboard } from './pages/admin/EventDetailDashboard';
import { ParticipantsList } from './pages/admin/ParticipantsList';
import { TeamsList } from './pages/admin/TeamsList';
import { VolunteersManagement } from './pages/admin/VolunteersManagement';
import { EmailLogsPage } from './pages/admin/EmailLogsPage';
import { SettingsPage } from './pages/admin/SettingsPage';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Layout Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/events/:slug" element={<PublicEventPage />} />
              <Route path="/events/:slug/register" element={<RegistrationPage />} />
              <Route path="/registration-success" element={<RegistrationSuccessPage />} />
              <Route path="/pass/:code" element={<DigitalPassPage />} />
              <Route path="/verify/:code" element={<PublicVerifyCertificatePage />} />
              <Route path="/verify" element={<PublicVerifyCertificatePage />} />
              <Route path="/portal" element={<ParticipantPortal />} />
              <Route path="/help" element={<HelpPage />} />
            </Route>

            {/* Volunteer Authentication & Scanner */}
            <Route path="/volunteer/login" element={<VolunteerLogin />} />
            <Route path="/volunteer/scanner" element={<VolunteerScannerDashboard />} />

            {/* Admin Authentication */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/register" element={<AdminRegister />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Protected Admin Management Area */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="events" element={<EventsList />} />
              <Route path="events/new" element={<CreateEditEvent />} />
              <Route path="events/:id" element={<EventDetailDashboard />} />
              <Route path="events/:id/edit" element={<CreateEditEvent />} />
              <Route path="participants" element={<ParticipantsList />} />
              <Route path="teams" element={<TeamsList />} />
              <Route path="volunteers" element={<VolunteersManagement />} />
              <Route path="certificates" element={<EventsList />} />
              <Route path="emails" element={<EmailLogsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
