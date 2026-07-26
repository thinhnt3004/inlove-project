"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { API_BASE_URL } from '@/config';


interface CoupleContextType {
  isLoggedIn: boolean;
  coupleData: any;
  login: (code: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateCoupleData: (newData: any) => void;
}

const CoupleContext = createContext<CoupleContextType | undefined>(undefined);

export const CoupleProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [coupleData, setCoupleData] = useState<any>(null);

  useEffect(() => {
    const savedPasscode = localStorage.getItem("couple_passcode");
    if (savedPasscode) {
      login(savedPasscode);
    }
  }, []);

  const login = async (code: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/couple/login/${code}`);
      const data = await res.json();
      if (res.ok) {
        if (data.users) {
          data.users = data.users.map((u: any) => {
            if (u.AvatarUrl) {
              u.AvatarUrl = u.AvatarUrl.replace('http://127.0.0.1:8080', '');
              if (u.AvatarUrl.startsWith('/uploads')) {
                u.AvatarUrl = API_BASE_URL + u.AvatarUrl;
              }
            }
            return u;
          });
        }
        setCoupleData(data);
        setIsLoggedIn(true);
        localStorage.setItem("couple_passcode", code);
        return { success: true };
      } else {
        localStorage.removeItem("couple_passcode");
        return { success: false, message: data.detail || "Sai mã PIN!" };
      }
    } catch (err) {
      return { success: false, message: "Không kết nối được tới máy chủ!" };
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCoupleData(null);
    localStorage.removeItem("couple_passcode");
  };

  const updateCoupleData = (newData: any) => {
    setCoupleData((prev: any) => ({ ...prev, ...newData }));
  };

  return (
    <CoupleContext.Provider value={{ isLoggedIn, coupleData, login, logout, updateCoupleData }}>
      {children}
    </CoupleContext.Provider>
  );
};

export const useCouple = () => {
  const context = useContext(CoupleContext);
  if (context === undefined) {
    throw new Error("useCouple must be used within a CoupleProvider");
  }
  return context;
};
