import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex justify-center items-center min-h-screen px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <CardTitle className="text-2xl mt-4">
                Correo verificado con éxito
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                Tu cuenta ha sido activada. Ya puedes iniciar sesión.
              </p>
              <Button asChild>
                <a href="/login">Ir al login</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
