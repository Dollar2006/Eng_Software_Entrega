import { Link } from 'react-router'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import CadastroForm from '@/features/auth/CadastroForm'

export default function CadastroPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-neutral-50 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>Leva menos de um minuto.</CardDescription>
        </CardHeader>
        <CardContent>
          <CadastroForm />
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          Já tem uma conta?{"\u00A0"}
          <Link
            to="/login"
            className="text-foreground underline underline-offset-3"
          >
            Entrar
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}
