import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function ErrorPage() {
  const erro = useRouteError()

  const titulo = isRouteErrorResponse(erro)
    ? `${erro.status} ${erro.statusText}`
    : 'Erro inesperado'
  const descricao = isRouteErrorResponse(erro)
    ? 'A rota solicitada não pôde ser carregada.'
    : 'Algo quebrou ao renderizar esta tela. Tente novamente ou volte ao início.'

  return (
    <main className="flex min-h-svh items-center justify-center bg-neutral-50 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{titulo}</CardTitle>
          <CardDescription>{descricao}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className="w-full">
            <Link to="/">Ir para o início</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
