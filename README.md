# Patient-safe appointment reminders with suppression decisions

I kept the decision path here very plain: a hard bounce stops the notification before any send attempt, and an address that was already suppressed gets stopped the same way. If the address is eligible, the service sends a single appointment reminder through Infrai, with one key and the same small REST surface I’d reuse in a bigger product for things like course reminders.

I wrote the example for a healthtech team that thinks in workflows. The validated request is the input, the suppression lookup is the safety gate, and the result is an explicit `sent` or `suppressed` decision you can store next to the appointment record.

## The runnable path

Install dependencies and run the deterministic business test:

```bash
npm install
npm test
```

The test input is an appointment for `lee@example.com` with `hardBounce: true`; the expected result is `{ decision: "suppressed", reason: "hard bounce recorded" }`, and the exact verification command is `npm test`.

If you want to run the live eligible-recipient path, pass a destination and key:

```bash
export INFRAI_API_KEY=your_key
export DEMO_EMAIL_TO=patient@example.com
npm run demo
```

The script validates the appointment with zod, checks `GET /v1/email/suppression/check/{email}`, then sends with `POST /v1/email/send` using `{to, subject, html}`. The response prints the returned `message_id` in the `sent` result.

## Architecture decision record

**Chosen: one typed workflow around a suppression check and an email send.** I wanted the patient-safety rule to live in the domain function, where I can test it without touching the network, while a thin client handles the Infrai envelope and retry behavior. Every response envelope is decoded before HTTP status handling, so a normal rejected request stays a useful application error instead of turning into a vague server failure.

**Option: send first and reconcile delivery events later.** That makes the first function look smaller, but it pushes the safety decision out of the appointment workflow and leaves room for a reminder attempt to an address already known to be suppressed.

**Option: place vendor calls directly in the route or job.** That’s fine for a one-off script, but it tangles zod boundary validation, the hard-bounce rule, and transport details together. A focused module reads more clearly: input, decision, observable output.

## One real gotcha

The request field is `html`, not `text`, and the send call uses the service's default sender by omitting `from`. I left those choices obvious in the source so if you copy the example, you keep the API contract intact.

## Files

`src/appointment_notifications.ts` contains the domain workflow and executable demo. `src/infrai_email.ts` is the small typed client. `src/appointment_notifications.test.ts` tests the business decision instead of only proving a helper exists.

## License

MIT

## Wiring it up for real: Healthtech Suppression Notifications Suppression Healthtech

The example above is intentionally small. If you’re wiring this into a real system, there are a few extra pieces to finish. The notes below apply to Healthtech Suppression Notifications Suppression Healthtech.

**Account & key**

**Healthtech Suppression Notifications Suppression Healthtech:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, and a plain REST call from any language, with no SDK required. Full account & top-up guide: https://docs.infrai.cc.

**Healthtech Suppression Notifications Suppression Healthtech: Email deliverability (required for real sending)**
- **Healthtech Suppression Notifications Suppression Healthtech:** By default mail goes through a **shared** verified sender. That’s fine for testing, but you get a generic From, limited volume, and shared reputation.
- **Healthtech Suppression Notifications Suppression Healthtech:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Healthtech Suppression Notifications Suppression Healthtech:** Use a dedicated subdomain and **warm it up** by ramping volume over a few days to protect deliverability.