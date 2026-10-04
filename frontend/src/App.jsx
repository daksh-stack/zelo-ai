import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { ToastContainer } from './components/ui/Toast';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { RoadmapPage } from './pages/RoadmapPage';
import { ProgressPage } from './pages/ProgressPage';
import { ProfilePage } from './pages/ProfilePage';
import { ExamRescueSetup } from './pages/ExamRescueSetup';
import { ExamSessionTerminal } from './pages/ExamSessionTerminal';
import { FinalRevisionSheet } from './pages/FinalRevisionSheet';
import { QuickRevisionPage } from './pages/QuickRevisionPage';
import { InterviewPracticePage } from './pages/InterviewPracticePage';
import { SquadPage } from './pages/SquadPage';
import { NotFound } from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roadmap"
            element={
              <ProtectedRoute>
                <RoadmapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <ProgressPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Skill Path Surfaces Routes */}
          <Route
            path="/skill-path/quick-revision"
            element={
              <ProtectedRoute>
                <QuickRevisionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/skill-path/interview-practice"
            element={
              <ProtectedRoute>
                <InterviewPracticePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/skill-path/interview-practice/:sessionId"
            element={
              <ProtectedRoute>
                <InterviewPracticePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/squad"
            element={
              <ProtectedRoute>
                <SquadPage />
              </ProtectedRoute>
            }
          />

          {/* Exam Rescue Routes */}
          <Route
            path="/exam-rescue"
            element={
              <ProtectedRoute>
                <ExamRescueSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exam-rescue/session/:sessionId"
            element={
              <ProtectedRoute>
                <ExamSessionTerminal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exam-rescue/session/:sessionId/revision"
            element={
              <ProtectedRoute>
                <FinalRevisionSheet />
              </ProtectedRoute>
            }
          />

          {/* 404 Catch All */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>

        <ToastContainer />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
