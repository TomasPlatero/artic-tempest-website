"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/domain/auth/services/reset-password";
import { cn } from "@/infrastructure/tailwind/tailwind-utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  className?: string;
}

/**
 * Formulario para establecer una nueva contraseña después del recovery link.
 * La función resetPassword espera recibir formData (como Form method="post"),
 * pero aquí usamos cliente convencional y luego re-render, lo aceptas por simplicidad.
 */
export function ResetPasswordForm({ className, ...props }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    const result = await resetPassword(password);

    if ("error" in result) {
      setError(result.error);
    } else {
      setSuccessMessage("Contraseña actualizada exitosamente.");
      // Puedes redirigir o permitir que el usuario se logee
      setTimeout(() => router.push("/login"), 2000);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Restablecer contraseña</CardTitle>
          <CardDescription>Ingresa tu nueva contraseña</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid gap-3">
              <Label htmlFor="password">Nueva contraseña</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {successMessage && <p className="text-sm text-green-500">{successMessage}</p>}

            <Button type="submit" className="w-full">
              Actualizar contraseña
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-sm">
        ¿Recordaste tu contraseña?{" "}
        <Link href="/login" className="underline underline-offset-4">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
