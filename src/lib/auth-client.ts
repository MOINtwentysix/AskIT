import { createAuthClient } from "better-auth/react";
import {
  usernameClient,
  emailOTPClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

export const authClient = createAuthClient({
  plugins: [
    usernameClient(),
    emailOTPClient(),
    inferAdditionalFields<typeof auth>(),
  ],
});
