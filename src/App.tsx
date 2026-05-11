import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Login } from "@/pages/Login";
import { Chat } from "@/pages/Chat";
import { Analyzer } from "@/pages/Analyzer";
import { NotFound } from "@/pages/NotFound";

function RootRedirect() {
  const { token } = useAuth();
  return <Navigate to={token ? "/chat" : "/login"} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public, no Layout */}
        <Route path="/login" element={<Login />} />

        {/* Authenticated area, wrapped in Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<RootRedirect />} />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analyzer"
            element={
              <ProtectedRoute>
                <Analyzer />
              </ProtectedRoute>
            }
          />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
