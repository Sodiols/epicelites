import type { Metadata } from "next";
import { AuthCard } from "@/components/admin/auth-card";
import { ForgotForm } from "@/components/admin/password-forms";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Reset password">
      <ForgotForm />
    </AuthCard>
  );
}
