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
        const subject =
          type === "forget-password"
            ? "AskIT – Passwort zurücksetzen"
            : "AskIT – Dein Bestätigungscode";

        const text =
          type === "forget-password"
            ? `Dein Code zum Zurücksetzen des Passworts lautet: ${otp}`
            : `Dein 6-stelliger Bestätigungscode lautet: ${otp}`;

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
        });
      },
    }),
  ],
});
