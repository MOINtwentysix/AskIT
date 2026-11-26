import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username, emailOTP } from "better-auth/plugins";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  user: {
    additionalFields: {
      cardBarcode: {
        type: "string",
        required: false,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const email = user.email.toLowerCase().trim();
          if (!email.endsWith("@schule.bremen.de")) {
            throw new Error(
              "Nur E-Mail-Adressen mit @schule.bremen.de sind erlaubt."
            );
          }

          const itsUsername = (
            (typeof user.username === "string" && user.username) ||
            email.split("@")[0]
          )
            .trim()
            .toLowerCase();

          const adminList = (process.env.ADMIN_ITS_USERS ?? "")
            .split(",")
            .map((u) => u.trim().toLowerCase())
            .filter(Boolean);

          const role = adminList.includes(itsUsername) ? "ADMIN" : "USER";

          return {
            data: {
              ...user,
              email,
              role,
            },
          };
        },
      },
    },
  },
  plugins: [
    username(),
    emailOTP({
      sendVerificationOnSignUp: true,
      async sendVerificationOTP({ email, otp, type }) {
        const isReset = type === "forget-password";
        const subject = isReset
          ? "AskIT – Passwort zurücksetzen"
          : "AskIT – Dein Bestätigungscode";

        const text = isReset
          ? `Dein Code zum Zurücksetzen des Passworts lautet: ${otp}`
          : `Dein 6-stelliger Bestätigungscode lautet: ${otp}`;

        const heading = isReset
          ? "Passwort zurücksetzen"
          : "E-Mail bestätigen";
        const intro = isReset
          ? "Du hast angefordert, dein AskIT-Passwort zurückzusetzen. Nutze diesen 6-stelligen Code:"
          : "Willkommen bei AskIT! Nutze diesen 6-stelligen Code, um deinen Account freizuschalten:";

        const html = `<div style="background-color:#f4f4f5;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#18181b;">
  <div style="max-width:460px;margin:0 auto;background-color:#ffffff;border:1px solid #e4e4e7;border-radius:16px;padding:32px;">
    <div style="display:inline-block;padding:4px 10px;border-radius:999px;background-color:#f4f4f5;color:#18181b;font-size:12px;font-weight:600;border:1px solid #e4e4e7;">AskIT</div>
    <h1 style="margin:16px 0 8px;font-size:22px;font-weight:700;color:#18181b;">${heading}</h1>
    <p style="margin:0 0 24px;font-size:14px;line-height:1.5;color:#52525b;">${intro}</p>
    <div style="background-color:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
      <span style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:32px;font-weight:700;letter-spacing:0.25em;color:#18181b;">${otp}</span>
    </div>
    <p style="margin:0;font-size:12px;line-height:1.5;color:#71717a;">
      Dieser Code ist nur kurze Zeit g&uuml;ltig. Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.
    </p>
  </div>
</div>`;

        if (!resend) {
          console.info(
            `[DEV EMAIL FALLBACK] To: ${email} | Type: ${type} | OTP: ${otp}`
          );
          return;
        }

        await resend.emails.send({
          from:
            process.env.RESEND_FROM_EMAIL ??
            "AskIT <noreply@schule.bremen.de>",
          to: email,
          subject,
          text,
          html,
        });
      },
    }),
  ],
});
