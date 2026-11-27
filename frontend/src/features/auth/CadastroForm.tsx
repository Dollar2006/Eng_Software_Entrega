import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { IconAlertTriangleFilled, IconMailFast } from '@tabler/icons-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput }  from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { registerAccount } from '@/features/auth/authApi'
import {
  cadastroSchema,
  type CadastroFormValues,
} from '@/features/auth/cadastroSchema'
import FieldError from '@/features/auth/FieldError'
import { ApiError } from '@/lib/api'

export default function CadastroForm() {
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [confirmationRequired, setConfirmationRequired] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<CadastroFormValues>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: { gamertag: '', email: '', password: '', confirmPassword: '' },
  })

  async function onSubmit(values: CadastroFormValues) {
    setSubmitError(null)

    try {
      const result = await registerAccount({
        email: values.email,
        password: values.password,
        gamertag: values.gamertag.trim() || null,
      })

      if (result.email_confirmation_required) {
        setConfirmationRequired(true)
      } else {
        // O backend ja emitiu os cookies de sessao no cadastro, entao o usuario
        // ja esta autenticado: vai direto para a home em vez de pedir o login.
        navigate('/')
      }
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setSubmitError('Erro inesperado. Tente novamente.')
        return
      }

      let handled = false

      for (const [field, message] of Object.entries(error.fieldErrors)) {
        if (field === 'email' || field === 'password' || field === 'gamertag') {
          setError(field, { message })
          handled = true
        }
      }

      if (!handled && error.status === 409) {
        const target = error.message.toLowerCase().includes('gamertag') ? 'gamertag' : 'email'
        setError(target, { message: error.message })
        handled = true
      }

      if (!handled) setSubmitError(error.message)
    }
  }

  if (confirmationRequired) {
    return (
      <Alert>
        <IconMailFast />
        <AlertTitle>Confirme seu e-mail</AlertTitle>
        <AlertDescription>
          Enviamos um link de confirmação para {getValues('email')}. Abra o
          link para ativar a conta.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      {submitError && (
        <Alert variant="destructive">
          <IconAlertTriangleFilled />
          <AlertTitle>Não foi possível criar a conta</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="gamertag">Gamertag (opcional)</Label>
        <Input
          id="gamertag"
          type="text"
          autoComplete="nickname"
          placeholder="seu_nome"
          aria-invalid={errors.gamertag ? true : undefined}
          aria-describedby={errors.gamertag ? 'gamertag-error gamertag-help' : 'gamertag-help'}
          {...register('gamertag')}
        />
        <p id="gamertag-help" className="text-xs text-muted-foreground">
          3-30 caracteres: letras, números, _ ou . Você pode definir depois.
        </p>
        <FieldError id="gamertag-error" message={errors.gamertag?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
        <FieldError id="email-error" message={errors.email?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Senha</Label>
        <PasswordInput
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo de 8 caracteres"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? 'password-error' : undefined}
          {...register('password')}
        />
        <FieldError id="password-error" message={errors.password?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">Confirmar senha</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.confirmPassword ? true : undefined}
          aria-describedby={
            errors.confirmPassword ? 'confirm-password-error' : undefined
          }
          {...register('confirmPassword')}
        />
        <FieldError
          id="confirm-password-error"
          message={errors.confirmPassword?.message}
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full cursor-pointer"
      >
        {isSubmitting ? 'Criando conta...' : 'Criar conta'}
      </Button>
    </form>
  )
}
