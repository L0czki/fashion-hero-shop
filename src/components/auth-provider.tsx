"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

export interface PremiumStatus {
  activatedAt: string;  // ISO date
  expiresAt: string;    // ISO date — activatedAt + 365 days
}

interface User {
  email: string;
  firstName: string;
  lastName: string;
  premium?: PremiumStatus;
}

interface AuthContextValue {
  user: User | null;
  isPremiumActive: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => void;
  activatePremium: () => void;
  cancelPremium: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "stepforward_user";
const PREMIUM_DURATION_DAYS = 365;

function persist(user: User | null) {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    const newUser: User = {
      email,
      firstName: email.split("@")[0],
      lastName: "",
    };
    persist(newUser);
    setUser(newUser);
  }, []);

  const register = useCallback(async (data: { email: string; password: string; firstName: string; lastName: string }) => {
    const newUser: User = {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
    };
    persist(newUser);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    persist(null);
    setUser(null);
  }, []);

  const activatePremium = useCallback(() => {
    setUser((current) => {
      if (!current) return current;
      const now = new Date();
      const expires = new Date(now);
      expires.setDate(expires.getDate() + PREMIUM_DURATION_DAYS);
      const next: User = {
        ...current,
        premium: {
          activatedAt: now.toISOString(),
          expiresAt: expires.toISOString(),
        },
      };
      persist(next);
      return next;
    });
  }, []);

  const cancelPremium = useCallback(() => {
    setUser((current) => {
      if (!current) return current;
      const { premium: _removed, ...rest } = current;
      void _removed;
      const next: User = rest;
      persist(next);
      return next;
    });
  }, []);

  const isPremiumActive = useMemo(() => {
    if (!user?.premium) return false;
    return new Date(user.premium.expiresAt).getTime() > Date.now();
  }, [user]);

  return (
    <AuthContext.Provider
      value={{ user, isPremiumActive, login, register, logout, activatePremium, cancelPremium }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
