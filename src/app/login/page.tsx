"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, KeyRound, Loader2, MailCheck, ScanBarcode, UserCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { checkBarcodeStatus } from "@/actions/auth";
import { BarcodeScanner } from "@/components/BarcodeScanner";

type Step =
  | "BARCODE_ENTRY"
  | "ITS_LOGIN"
  | "EXISTING_PASSWORD"
  | "NEW_REGISTER"
  | "VERIFY_OTP"
  | "FORGOT_PASSWORD";

function cleanItsUsername(raw: string): string {
  return raw.split("@")[0].trim().toLowerCase();
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [step, setStep] = useState<Step>("BARCODE_ENTRY");
  const [barcode, setBarcode] = useState("");
  const [itsUsername, setItsUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const resetMessages = () => {
    setError(null);
    setInfo(null);
  };

  const handleBarcodeLookup = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Bitte gib eine Ausweisnummer ein.");
      return;
    }
    resetMessages();
    setLoading(true);
    try {
      setBarcode(trimmed);
      const result = await checkBarcodeStatus(trimmed);
      if (result.status === "EXISTING_USER") {
        setEmail(result.email);
        setItsUsername(result.username ?? result.email.split("@")[0]);
        setStep("EXISTING_PASSWORD");
      } else {
        setStep("NEW_REGISTER");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ausweis konnte nicht überprüft werden."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeSubmit = (e: FormEvent) => {
    e.preventDefault();
    void handleBarcodeLookup(barcode);
  };

  const handleExistingSignIn = async (e: FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const targetEmail =
        email || `${cleanItsUsername(itsUsername)}@schule.bremen.de`;
      const { error: signInError } = await authClient.signIn.email({
        email: targetEmail,
        password,
      });
      if (signInError) {
        setError(signInError.message ?? "Anmeldung fehlgeschlagen.");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Anmeldung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    resetMessages();
    const cleaned = cleanItsUsername(itsUsername);
    if (!cleaned) {
      setError("Bitte gib deinen ITS-Benutzernamen ein.");
      return;
    }
    if (password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }

    const targetEmail = `${cleaned}@schule.bremen.de`;
    setLoading(true);
    try {
      const { error: signUpError } = await authClient.signUp.email({
        email: targetEmail,
        username: cleaned,
        name: cleaned,
        cardBarcode: barcode,
        password,
      });
      if (signUpError) {
        setError(
          signUpError.message ||
            `${signUpError.status ?? ""} ${signUpError.statusText ?? "Registrierung fehlgeschlagen."}`.trim()
        );
        return;
      }
      setItsUsername(cleaned);
      setEmail(targetEmail);
      setInfo(`Bestätigungscode wurde an ${targetEmail} gesendet.`);
      setStep("VERIFY_OTP");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Registrierung fehlgeschlagen."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const { error: verifyError } = await authClient.emailOtp.verifyEmail({
        email,
        otp: otp.trim(),
      });
      if (verifyError) {
        setError(verifyError.message ?? "Ungültiger Bestätigungscode.");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Verifizierung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartForgotPassword = async () => {
    resetMessages();
    const targetEmail =
      email ||
      (itsUsername
        ? `${cleanItsUsername(itsUsername)}@schule.bremen.de`
        : "");
    if (!targetEmail) {
      setError("Bitte gib zuerst deinen ITS-Benutzernamen ein.");
      return;
    }
    setLoading(true);
    try {
      const { error: fpError } = await authClient.forgetPassword.emailOtp({
        email: targetEmail,
      });
      if (fpError) {
        setError(fpError.message ?? "Code konnte nicht gesendet werden.");
        return;
      }
      setEmail(targetEmail);
      setOtp("");
      setInfo(`Reset-Code wurde an ${targetEmail} gesendet.`);
      setStep("FORGOT_PASSWORD");
    } catch {
      setError("Anfrage fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (newPassword.length < 8) {
      setError("Das neue Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }
    setLoading(true);
    try {
      const { error: resetError } = await authClient.emailOtp.resetPassword({
        email,
        otp: otp.trim(),
        password: newPassword,
      });
      if (resetError) {
        setError(resetError.message ?? "Passwort konnte nicht zurückgesetzt werden.");
        return;
      }
      setPassword("");
      setNewPassword("");
      setOtp("");
      setInfo("Passwort erfolgreich geändert. Bitte melde dich an.");
      setStep("EXISTING_PASSWORD");
    } catch {
      setError("Zurücksetzen fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <ScanBarcode className="h-3.5 w-3.5" />
              AskIT
            </span>
            {step !== "BARCODE_ENTRY" && (
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setPassword("");
                  setOtp("");
                  setStep("BARCODE_ENTRY");
                }}
                className="inline-flex items-center gap-1 text-xs text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Zurück
              </button>
            )}
          </div>
          <h1 className="pt-2 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {step === "BARCODE_ENTRY" && "Anmelden"}
            {step === "ITS_LOGIN" && "ITS-Anmeldung"}
            {step === "EXISTING_PASSWORD" && "Willkommen zurück"}
            {step === "NEW_REGISTER" && "Ausweis verknüpfen"}
            {step === "VERIFY_OTP" && "E-Mail bestätigen"}
            {step === "FORGOT_PASSWORD" && "Passwort zurücksetzen"}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {step === "BARCODE_ENTRY" &&
              "Scanne deinen Schüler- oder Bibliotheksausweis."}
            {step === "ITS_LOGIN" &&
              "Für Lehrkräfte ohne Ausweis mit ITS-Benutzername."}
            {step === "EXISTING_PASSWORD" &&
              `Angemeldet als ${itsUsername}@schule.bremen.de`}
            {step === "NEW_REGISTER" &&
              "Erstelle deinen Account mit deinem ITS-Kürzel."}
            {step === "VERIFY_OTP" &&
              "Gib den 6-stelligen Code aus deiner Schul-E-Mail ein."}
            {step === "FORGOT_PASSWORD" &&
              "Gib den 6-stelligen Reset-Code und ein neues Passwort ein."}
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
            {error}
          </div>
        )}

        {info && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-300">
            {info}
          </div>
        )}

        {step === "BARCODE_ENTRY" && (
          <div className="space-y-4">
            <BarcodeScanner
              disabled={loading}
              onScan={(decoded) => void handleBarcodeLookup(decoded)}
            />

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800" />
              <span className="mx-3 shrink text-xs text-zinc-400">oder</span>
              <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800" />
            </div>

            <form onSubmit={handleBarcodeSubmit} className="space-y-3">
              <div>
                <label
                  htmlFor="barcode"
                  className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Ausweisnummer
                </label>
                <input
                  id="barcode"
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="z. B. 00123456"
                  autoComplete="off"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Weiter
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                resetMessages();
                setStep("ITS_LOGIN");
              }}
              className="w-full pt-1 text-center text-xs text-zinc-500 underline-offset-4 transition hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Ohne Ausweis mit ITS-Benutzername anmelden
            </button>
          </div>
        )}

        {step === "ITS_LOGIN" && (
          <form onSubmit={handleExistingSignIn} className="space-y-3">
            <div>
              <label
                htmlFor="its-login-user"
                className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                ITS-Benutzername
              </label>
              <div className="flex overflow-hidden rounded-lg border border-zinc-200 focus-within:border-zinc-900 dark:border-zinc-800 dark:focus-within:border-zinc-400">
                <input
                  id="its-login-user"
                  type="text"
                  required
                  value={itsUsername}
                  onChange={(e) => setItsUsername(e.target.value)}
                  placeholder="vorname.nachname"
                  className="w-full bg-white px-3 py-2 text-sm text-zinc-900 outline-none dark:bg-zinc-950 dark:text-zinc-100"
                />
                <span className="flex items-center bg-zinc-50 px-2.5 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  @schule.bremen.de
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="its-login-pw"
                className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                Passwort
              </label>
              <input
                id="its-login-pw"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Anmelden
            </button>

            <button
              type="button"
              onClick={() => void handleStartForgotPassword()}
              className="w-full text-center text-xs text-zinc-500 underline-offset-4 transition hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Passwort vergessen?
            </button>
          </form>
        )}

        {step === "EXISTING_PASSWORD" && (
          <form onSubmit={handleExistingSignIn} className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
              <UserCheck className="h-4 w-4 shrink-0 text-zinc-500" />
              <span className="truncate font-medium">{itsUsername}</span>
            </div>

            <div>
              <label
                htmlFor="existing-pw"
                className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                Passwort
              </label>
              <input
                id="existing-pw"
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Anmelden
            </button>

            <button
              type="button"
              onClick={() => void handleStartForgotPassword()}
              className="w-full text-center text-xs text-zinc-500 underline-offset-4 transition hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Passwort vergessen?
            </button>
          </form>
        )}

        {step === "NEW_REGISTER" && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label
                htmlFor="reg-its"
                className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                ITS-Benutzername
              </label>
              <div className="flex overflow-hidden rounded-lg border border-zinc-200 focus-within:border-zinc-900 dark:border-zinc-800 dark:focus-within:border-zinc-400">
                <input
                  id="reg-its"
                  type="text"
                  required
                  autoFocus
                  value={itsUsername}
                  onChange={(e) => setItsUsername(e.target.value)}
                  placeholder="vorname.nachname"
                  className="w-full bg-white px-3 py-2 text-sm text-zinc-900 outline-none dark:bg-zinc-950 dark:text-zinc-100"
                />
                <span className="flex items-center bg-zinc-50 px-2.5 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  @schule.bremen.de
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="reg-pw"
                className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                Passwort (mind. 8 Zeichen)
              </label>
              <input
                id="reg-pw"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Registrieren & Code senden
            </button>
          </form>
        )}

        {step === "VERIFY_OTP" && (
          <form onSubmit={handleVerifyOtp} className="space-y-3">
            <div>
              <label
                htmlFor="verify-otp"
                className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                6-stelliger Bestätigungscode
              </label>
              <input
                id="verify-otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-center text-lg tracking-widest text-zinc-900 outline-none transition focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MailCheck className="h-4 w-4" />
              )}
              E-Mail bestätigen
            </button>
          </form>
        )}

        {step === "FORGOT_PASSWORD" && (
          <form onSubmit={handleResetPassword} className="space-y-3">
            <div>
              <label
                htmlFor="reset-otp"
                className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                6-stelliger Reset-Code
              </label>
              <input
                id="reset-otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-center text-lg tracking-widest text-zinc-900 outline-none transition focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
              />
            </div>

            <div>
              <label
                htmlFor="reset-pw"
                className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                Neues Passwort (mind. 8 Zeichen)
              </label>
              <input
                id="reset-pw"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              Passwort speichern
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
