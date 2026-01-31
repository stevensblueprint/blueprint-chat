import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Chat from "./pages/Chat";

export const OAuthCallback = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      const redirect = sessionStorage.getItem("oauth_redirect") || "/dashboard";
      sessionStorage.removeItem("oauth_redirect");
      navigate(redirect);
    }
  }, [loading, isAuthenticated, navigate]);

  return <div>Completing sign in...</div>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route path="/callback" element={<OAuthCallback />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
