import type { Metadata } from "next";
import PasswordRecoveryForm from "../password-recovery-form";

export const metadata: Metadata = {
  title: "Choose a new password | N-ATLAS Playground",
  description: "Set a new password for your N-ATLAS account.",
};

export default function ResetPasswordPage() {
  return <PasswordRecoveryForm mode="reset" />;
}
