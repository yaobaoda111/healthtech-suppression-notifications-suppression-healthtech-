import { z } from "zod";
import { infrai } from "./infrai_email.js";

export const appointmentNotification = z.object({
  appointmentId: z.string().min(1),
  patientName: z.string().min(1),
  patientEmail: z.string().email(),
  appointmentTime: z.string().min(1),
  hardBounce: z.boolean().default(false),
});

export type AppointmentNotification = z.infer<typeof appointmentNotification>;
export type NotificationResult = { decision: "sent" | "suppressed"; messageId?: string; reason: string };

export async function notifyAppointment(input: unknown): Promise<NotificationResult> {
  const appointment = appointmentNotification.parse(input);
  if (appointment.hardBounce) return { decision: "suppressed", reason: "hard bounce recorded" };

  const suppression = await infrai.email.suppression.check(appointment.patientEmail);
  if (suppression.suppressed) return { decision: "suppressed", reason: "recipient is suppressed" };

  const result = await infrai.email.send({
    to: appointment.patientEmail,
    subject: `Appointment reminder for ${appointment.appointmentTime}`,
    html: `<p>Hello ${appointment.patientName},</p><p>Your appointment is scheduled for ${appointment.appointmentTime}.</p>`,
  }, `appointment-${appointment.appointmentId}`);
  return { decision: "sent", messageId: result.message_id, reason: "recipient is eligible" };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const to = process.env.DEMO_EMAIL_TO;
  if (!to) throw new Error("DEMO_EMAIL_TO is required");
  console.log(await notifyAppointment({ appointmentId: "demo-1", patientName: "Jordan", patientEmail: to, appointmentTime: "Tuesday 10:00" }));
}
