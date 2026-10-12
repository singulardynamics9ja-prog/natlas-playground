import type { Metadata } from "next";
import PasswordRecoveryForm from "../password-recovery-form";

export const metadata: Metadata = {
  title: "Reset password | N-ATLAS Playground",
  description: "Request a secure password reset link for your N-ATLAS account.",
};

export default function ForgotPasswordPage() {
  return <PasswordRecoveryForm mode="request" />;
}
