// context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { getTokenByPath } from "@/lib/helper";

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    phone?: string,
    gender?: string,
    dateOfBirth?: string,
    age?: number
  ) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// ✅ Custom type guard — no Axios types needed
function isAxiosError(
  error: unknown
): error is { response?: { data?: { message?: string } } } {
  return typeof error === "object" && error !== null && "isAxiosError" in error;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getTokenByPath();
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await axios.get<{ user: User }>("/api/auth/verify", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data.user);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        console.error(
          error.response?.data?.message || "Token verification failed"
        );
      } else {
        console.error("Unexpected error verifying token", error);
      }
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post<{ user: User; token: string }>(
        "/api/auth/login",
        {
          email,
          password,
        }
      );

      const { user, token } = response.data;
      localStorage.setItem("token", token);
      setUser(user);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Login failed");
      }
      throw new Error("Unexpected login error");
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    phone?: string,
    gender?: string,
    dateOfBirth?: string,
    age?: number
  ) => {
    try {
      await axios.post("/api/auth/register", {
        name,
        email,
        password,
        phone,
        gender,
        dateOfBirth,
        age,
      });

      // Auto login after successful registration
      await login(email, password);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Registration failed");
      }
      throw new Error("Unexpected registration error");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/");
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
