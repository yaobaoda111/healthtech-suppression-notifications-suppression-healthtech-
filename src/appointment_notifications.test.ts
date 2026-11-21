import assert from "node:assert/strict";
import { appointmentNotification, notifyAppointment } from "./appointment_notifications.js";

const bounce = { appointmentId: "apt-7", patientName: "Lee", patientEmail: "lee@example.com", appointmentTime: "Friday 09:30", hardBounce: true };
assert.equal(appointmentNotification.parse(bounce).hardBounce, true);
assert.deepEqual(await notifyAppointment(bounce), { decision: "suppressed", reason: "hard bounce recorded" });
console.log("hard-bounce policy: pass");
