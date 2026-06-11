import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { FileText } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <FileText className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">DocDrive</h1>
          <p className="mt-1 text-sm text-gray-500">Plateforme documentaire privée</p>
        </div>

        {/* Formulaire */}
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Connexion</h2>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Accès réservé aux membres autorisés
        </p>
      </div>
    </div>
  );
}
