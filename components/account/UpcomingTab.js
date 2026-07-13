"use client";

import AppointmentsTab from "./AppointmentsTab";

export default function UpcomingTab({ appointments, setAppointments }) {
  return <AppointmentsTab type="upcoming" appointments={appointments} setAppointments={setAppointments} />;
}
