import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import { User, UserRole } from "../types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  googleLogin: (credential: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
  isB2B: boolean;
  isAdmin: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("ft_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    try {
      const res = await api.get("/auth/me/");
      setUser(res.data);
      localStorage.setItem("ft_user", JSON.stringify(res.data));
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("ft_access_token");
    if (token) {
      refreshProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post("/auth/login/", { email, password });
    const { user: userData, tokens } = res.data;
    localStorage.setItem("ft_access_token", tokens.access);
    localStorage.setItem("ft_refresh_token", tokens.refresh);
    localStorage.setItem("ft_user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const googleLogin = async (credential: string): Promise<User> => {
    const res = await api.post("/auth/google/", { credential });
    const { user: userData, tokens } = res.data;
    localStorage.setItem("ft_access_token", tokens.access);
    localStorage.setItem("ft_refresh_token", tokens.refresh);
    localStorage.setItem("ft_user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (data: any): Promise<User> => {
    const res = await api.post("/auth/register/", data);
    const { user: userData, tokens } = res.data;
    localStorage.setItem("ft_access_token", tokens.access);
    localStorage.setItem("ft_refresh_token", tokens.refresh);
    localStorage.setItem("ft_user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem("ft_access_token");
    localStorage.removeItem("ft_refresh_token");
    localStorage.removeItem("ft_user");
    setUser(null);
  };

  const isAuthenticated = !!user;
  const isB2B = !!user && ["STAFF", "ADMIN"].includes(user.role) && user.status === "ACTIVE";
  const isAdmin = !!user && (user.role === "ADMIN" || !!user.is_superuser);
  const isStaff = !!user && ["STAFF", "ADMIN"].includes(user.role);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        googleLogin,
        register,
        logout,
        refreshProfile,
        isAuthenticated,
        isB2B,
        isAdmin,
        isStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
