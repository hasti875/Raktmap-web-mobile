import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// Update this URL to match your backend server
axios.defaults.baseURL = "http://localhost:5000"; // Backend is running on port 5000

// Configure axios interceptor for automatic token attachment
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token might be expired or invalid
      console.log("Received 401/403, clearing token...");
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
      // Don't redirect here, let the auth context handle it
    }
    return Promise.reject(error);
  }
);

interface AuthContextType {
  user: {
    _id: string;
    email: string;
    name: string;
    role: string;
    location?: string;
  } | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  loadingLogout?: boolean;
  userName?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [userName, setUserName] = useState<string | undefined>(undefined);

  // Debug: Log whenever user state changes
  useEffect(() => {
    console.log("🔄 User state changed:", user ? `Logged in as ${user.email} (${user.role})` : "Not logged in");
  }, [user]);

  useEffect(() => {
    const initAuth = () => {
      console.log("🚀 AuthProvider initializing...");
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.log("❌ No token found - user not authenticated");
        setUser(null);
        setLoading(false);
        return;
      }

      console.log("✅ Token found in localStorage");
      
      try {
        // Simple JWT decode without server validation
        const parts = token.split('.');
        if (parts.length !== 3) {
          console.error("❌ Invalid token format");
          throw new Error('Invalid token format');
        }

        // Decode payload with better error handling
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
        const payload = JSON.parse(atob(padded));
        
        console.log("✅ Token decoded successfully:", {
          id: payload.id,
          email: payload.email, 
          role: payload.role,
          exp: payload.exp
        });

        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          console.error("❌ Token expired");
          throw new Error('Token expired');
        }

        // Validate required fields exist
        if (!payload.id || !payload.email || !payload.role) {
          console.error("❌ Token missing required fields");
          throw new Error('Token missing required fields');
        }

        // Create user object
        const userData = {
          _id: payload.id,
          email: payload.email,
          name: payload.name || payload.email.split('@')[0],
          role: payload.role
        };

        console.log("✅ Setting user data and axios headers");
        setUser(userData);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        console.log("✅ Authentication restored successfully!");
        
      } catch (error) {
        console.error("❌ Token validation failed:", error);
        localStorage.removeItem("token");
        delete axios.defaults.headers.common["Authorization"];
        setUser(null);
      }
      
      setLoading(false);
    };

    // Only run once
    initAuth();
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      // Clear any existing auth data before login attempt
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];

      console.log("Attempting login with:", { email });
      const response = await axios.post("/login", { email, password });
      console.log("Login response:", response.data); // Debug log

      const { token, role: responseRole, name } = response.data;
      if (!token) {
        console.error("No token received from server");
        return false;
      }

      console.log("Token received, length:", token.length);
      console.log("Token preview:", token.substring(0, 50) + "...");

      // Decode token to get user ID and validate structure
      let userId = null;
      let tokenPayload = null;
      
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Invalid token format');
        }
        
        // Add padding if necessary for Base64 decoding
        let base64Payload = tokenParts[1];
        while (base64Payload.length % 4) {
          base64Payload += '=';
        }
        
        tokenPayload = JSON.parse(atob(base64Payload));
        userId = tokenPayload.id;
        console.log("Decoded token payload:", tokenPayload);
        
      } catch (e) {
        console.error("Could not decode token:", e);
        return false;
      }

      const userData = { 
        _id: userId,
        email: tokenPayload.email || email, 
        role: responseRole, 
        name: tokenPayload.name || name 
      };
      
      console.log("Setting user data:", userData);
      
      localStorage.setItem("token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser(userData);
      
      console.log("Login successful");
      return true;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Login failed:", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
      } else {
        console.error("Login failed:", error);
      }
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log("Starting logout process...");
      setLoadingLogout(true);
      setUserName(user?.name);
      
      // Clear all local state
      console.log("Clearing localStorage and session storage...");
      localStorage.removeItem("token");
      sessionStorage.clear();
      setUser(null);

      // Reset axios configuration
      console.log("Resetting axios configuration...");
      delete axios.defaults.headers.common["Authorization"];
      axios.defaults.baseURL = "http://localhost:5000";

      console.log("Logout process completed");
      
      // Use window.location.replace to prevent back navigation after logout
      setTimeout(() => {
        setLoadingLogout(false);
        setUserName(undefined);
        console.log("Redirecting to login page...");
        window.location.replace("/login");
      }, 1200); // Show loader for 1.2s
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, try to force logout
      localStorage.removeItem("token");
      setUser(null);
      setLoadingLogout(false);
      setUserName(undefined);
      window.location.replace("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        loading,
        loadingLogout,
        userName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
