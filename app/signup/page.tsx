import type { Metadata } from "next";
import AuthForm from "../auth-form";

export const metadata: Metadata = {
  title: "Create account | N-ATLAS Playground",
  description: "Create an account to keep access to your N-ATLAS Playground workspace.",
};

export default function SignUpPage() {
  return <AuthForm mode="signup" />;
}
