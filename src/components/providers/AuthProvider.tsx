"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/types";

// In a real app, you would import this from `firebase/auth`
// import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
// import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // This simulates onAuthStateChanged
    const storedUser = localStorage.getItem("swiftroute-user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);

    // In a real Firebase app, you would use:
    // const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
    //   if (firebaseUser) {
    //     // You would fetch user role from Firestore here
    //     const appUser: User = {
    //       uid: firebaseUser.uid,
    //       email: firebaseUser.email,
    //       displayName: firebaseUser.displayName,
    //       role: "Admin", // Fetch this from your DB
    //     };
    //     setUser(appUser);
    //   } else {
    //     setUser(null);
    //   }
    //   setLoading(false);
    // });
    // return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        if (email === "admin@swiftroute.com" && pass === "password") {
          const mockUser: User = {
            uid: "mock-admin-uid",
            email: "admin@swiftroute.com",
            displayName: "Admin User",
            role: "Admin",
            photoURL: "https://picsum.photos/seed/admin/100/100"
          };
          setUser(mockUser);
          localStorage.setItem("swiftroute-user", JSON.stringify(mockUser));
          setLoading(false);
          resolve();
        } else {
          setLoading(false);
          reject(new Error("Invalid email or password."));
        }
      }, 1000);
    });
  };

  const logout = async (): Promise<void> => {
    setUser(null);
    localStorage.removeItem("swiftroute-user");
    router.push("/");
  };

  const value = { user, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
