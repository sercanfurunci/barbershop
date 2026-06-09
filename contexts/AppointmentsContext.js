"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { recentAppointments, services, barbers } from "@/lib/data";

const AppointmentsContext = createContext(null);

const STORAGE_KEY = "makas-appointments";

function seedData() {
  return recentAppointments.map((a) => {
    const svc = services.find((s) => s.name.tr === a.service || s.name.en === a.service);
    const brb = barbers.find((b) => b.name === a.barber);
    return {
      ...a,
      phone: "",
      serviceId: svc?.id ?? "",
      barberId: brb?.id ?? "",
      duration: svc?.duration ?? 45,
      source: "online",
      notes: "",
    };
  });
}

export function AppointmentsProvider({ children }) {
  const [appointments, setAppointments] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setAppointments(JSON.parse(raw));
      } else {
        const seed = seedData();
        setAppointments(seed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      }
    } catch {
      setAppointments(seedData());
    }
    setLoaded(true);
  }, []);

  const persist = useCallback((list) => {
    setAppointments(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }, []);

  const addAppointment = useCallback((appt) => {
    const newAppt = {
      ...appt,
      id: `APT-${Date.now()}`,
      source: appt.source ?? "phone",
      status: appt.status ?? "confirmed",
      notes: appt.notes ?? "",
    };
    setAppointments((prev) => {
      const next = [newAppt, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    return newAppt;
  }, []);

  const updateStatus = useCallback((id, status) => {
    setAppointments((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, status } : a));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateAppointment = useCallback((id, patch) => {
    setAppointments((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...patch } : a));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteAppointment = useCallback((id) => {
    setAppointments((prev) => {
      const next = prev.filter((a) => a.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getByDate = useCallback((date) => {
    return appointments.filter((a) => a.date === date);
  }, [appointments]);

  const getByBarberDate = useCallback((barberId, date) => {
    return appointments.filter((a) => a.barberId === barberId && a.date === date);
  }, [appointments]);

  return (
    <AppointmentsContext.Provider value={{
      appointments,
      loaded,
      addAppointment,
      updateStatus,
      updateAppointment,
      deleteAppointment,
      getByDate,
      getByBarberDate,
    }}>
      {children}
    </AppointmentsContext.Provider>
  );
}

export function useAppointments() {
  const ctx = useContext(AppointmentsContext);
  if (!ctx) throw new Error("useAppointments must be inside AppointmentsProvider");
  return ctx;
}
