import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { IconAlertTriangleFilled } from '@tabler/icons-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import {
  changeEmail,
  type EmailChangeResult,
} from '@/features/account/accountApi'
import {
  changeEmailSchema,
  type ChangeEmailValues,
} from '@/features/account/accountSchema'
import { mapAccountError } from '@/features/account/mapAccountError'
import FieldError from '@/features/auth/FieldError'

type ChangeEmailFormProps = {
  onSuccess: (result: EmailChangeResult) => void
  onCancel: () => void
}

export default function ChangeEmailForm({
  onSuccess,
  onCancel,
}: ChangeEmailFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangeEmailValues>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { newEmail: '', currentPassword: '' },
  })

  async function onSubmit(values: ChangeEmailValues) {
    setSubmitError(null)

    try {
      onSuccess(await changeEmail(values))
    } catch (error) {
      const { field, message } = mapAccountError(error, 'email')

      if (field === 'newEmail' || field === 'currentPassword') {
        setError(field, { message })
      } else {
        setSubmitError(message)
      }
    }
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
          <AlertTitle>Não foi possível alterar o e-mail</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="new-email">Novo e-mail</Label>
        <Input
          id="new-email"
          type="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          aria-invalid={errors.newEmail ? true : undefined}
          aria-describedby={errors.newEmail ? 'new-email-error' : undefined}
          {...register('newEmail')}
        />
        <FieldError id="new-email-error" message={errors.newEmail?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email-current-password">Senha atual</Label>
        <PasswordInput
          id="email-current-password"
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.currentPassword ? true : undefined}
          aria-describedby={
            errors.currentPassword ? 'email-current-password-error' : undefined
          }
          {...register('currentPassword')}
        />
        <FieldError
          id="email-current-password-error"
          message={errors.currentPassword?.message}
        />
      </div>

      <p className="text-xs text-neutral-500">
        Enviaremos um link de confirmação para o novo endereço. O e-mail só muda
        depois que você confirmar.
      </p>

      <div className="flex gap-2">
        <Button
          type="submit"
          className="cursor-pointer"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="cursor-pointer"
          onClick={onCancel}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
