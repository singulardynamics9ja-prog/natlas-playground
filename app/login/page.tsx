import type { Metadata } from "next";
import AuthForm from "../auth-form";

export const metadata: Metadata = {
  title: "Sign in | N-ATLAS Playground",
  description: "Sign in to your N-ATLAS Playground workspace.",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
