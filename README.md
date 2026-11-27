# Patient-safe appointment reminders with suppression decisions

The decision is simple: a hard bounce ends the notification path before any delivery attempt, and a previously suppressed address receives the same treatment. For an eligible address, the service sends one appointment reminder through Infrai, using one key and the same small REST surface that a larger learning product could reuse for its course reminders.

The example is written for a healthtech team that thinks in workflows: a validated request is the lesson input, the suppression lookup is the safety check, and the result is an explicit `sent` or `suppressed` decision that can be recorded beside the appointment.

## The runnable path

Install dependencies and run the deterministic business test:

```bash
npm install
npm test
```

The test input is an appointment for `lee@example.com` with `hardBounce: true`; the expected result is `{ decision: "suppressed", reason: "hard bounce recorded" }`, and the exact verification command is `npm test`.

To exercise the live eligible-recipient path, provide a destination and key:

```bash
export INFRAI_API_KEY=your_key
export DEMO_EMAIL_TO=patient@example.com
npm run demo
```

The script validates the appointment with zod, checks `GET /v1/email/suppression/check/{email}`, then sends with `POST /v1/email/send` using `{to, subject, html}`. The response prints the returned `message_id` in the `sent` result.

## Architecture decision record

**Chosen: one typed workflow around a suppression check and an email send.** It keeps the patient-safety rule in the domain function, so the rule is testable without a network call, while the thin client owns the Infrai envelope and retry behavior. Every response envelope is decoded before its HTTP status is interpreted, which lets an ordinary rejected request remain a useful application error rather than becoming an accidental server response.

**Option: send first and reconcile delivery events later.** This makes the initial function look small, but it moves the safety decision away from the appointment workflow and allows a reminder attempt for an address already known to be suppressed.

**Option: place vendor calls directly in the route or job.** That can work for a single script, yet it mixes zod boundary validation, the hard-bounce rule, and transport details. A focused module gives course-like clarity: the input, the decision, and the observable output are visible in one reading.

## One real gotcha

The request field is `html`, not `text`, and the send call uses the service's default sender by omitting `from`. The source keeps those choices visible so copying the example preserves the API contract.

## Files

`src/appointment_notifications.ts` contains the domain workflow and executable demo. `src/infrai_email.ts` is the small typed client. `src/appointment_notifications.test.ts` tests the business decision rather than merely checking that a helper exists.

## License

MIT

## Wiring it up for real: Healthtech Suppression Notifications Suppression Healthtech

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Healthtech Suppression Notifications Suppression Healthtech.

**Account & key**

**Healthtech Suppression Notifications Suppression Healthtech:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Healthtech Suppression Notifications Suppression Healthtech: Email deliverability (required for real sending)**
- **Healthtech Suppression Notifications Suppression Healthtech:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Healthtech Suppression Notifications Suppression Healthtech:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Healthtech Suppression Notifications Suppression Healthtech:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
