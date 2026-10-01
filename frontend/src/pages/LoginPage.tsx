import { Link } from 'react-router'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import LoginForm from '@/features/auth/LoginForm'

export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-neutral-50 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>Acesse sua conta para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          Não tem conta?{"\u00A0"}
          <Link
            to="/cadastro"
            className="text-foreground underline underline-offset-3"
          >
            Criar conta
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}
