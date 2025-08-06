"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { registerWithEmail } from "@/domain/auth/services/register";
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

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const result = await registerWithEmail(email, password);

    if ("error" in result) {
      setError(result.error);
    } else {
      setSuccessMessage(
        "Cuenta creada. Revisa tu correo y confirma tu email."
      );
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>
            Ingresa tu correo y crea una contraseña para registrarte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid gap-3">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            {successMessage && (
              <p className="text-sm text-green-500">{successMessage}</p>
            )}

            <Button type="submit" className="w-full">
              Crear cuenta
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-sm">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="underline underline-offset-4">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
