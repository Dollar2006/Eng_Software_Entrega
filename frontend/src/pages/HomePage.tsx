import { IconAlertTriangleFilled } from '@tabler/icons-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function HomePage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-neutral-50 p-6">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" placeholder="voce@exemplo.com" />
          </div>
          <Alert>
            <AlertTitle className="flex items-center gap-2">
              <IconAlertTriangleFilled className="h-4 w-4" /> Atenção
            </AlertTitle>
            <AlertDescription>Teste boilerplate.</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button className="w-full cursor-pointer">Botão primário</Button>
        </CardFooter>
      </Card>
    </main>
  )
}
