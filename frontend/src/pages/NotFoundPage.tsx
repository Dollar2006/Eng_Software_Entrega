import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-neutral-50 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Página não encontrada</CardTitle>
          <CardDescription>
            O endereço acessado não corresponde a nenhuma rota.
          </CardDescription>
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