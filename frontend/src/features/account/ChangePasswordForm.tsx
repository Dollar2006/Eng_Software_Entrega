import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { IconAlertTriangleFilled } from '@tabler/icons-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { changePassword } from '@/features/account/accountApi'
import {
  changePasswordSchema,
  type ChangePasswordValues,
} from '@/features/account/accountSchema'
import { mapAccountError } from '@/features/account/mapAccountError'
import FieldError from '@/features/auth/FieldError'

type ChangePasswordFormProps = {
  onSuccess: () => void
  onCancel: () => void
}

export default function ChangePasswordForm({
  onSuccess,
  onCancel,
}: ChangePasswordFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  async function onSubmit(values: ChangePasswordValues) {
    setSubmitError(null)

    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      onSuccess()
    } catch (error) {
      const { field, message } = mapAccountError(error, 'password')

      if (field === 'currentPassword' || field === 'newPassword') {
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
          <AlertTitle>Não foi possível alterar a senha</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="password-current-password">Senha atual</Label>
        <PasswordInput
          id="password-current-password"
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.currentPassword ? true : undefined}
          aria-describedby={
            errors.currentPassword ? 'password-current-password-error' : undefined
          }
          {...register('currentPassword')}
        />
        <FieldError
          id="password-current-password-error"
          message={errors.currentPassword?.message}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="new-password">Nova senha</Label>
        <PasswordInput
          id="new-password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo de 8 caracteres"
          aria-invalid={errors.newPassword ? true : undefined}
          aria-describedby={errors.newPassword ? 'new-password-error' : undefined}
          {...register('newPassword')}
        />
        <FieldError id="new-password-error" message={errors.newPassword?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm-new-password">Confirmar nova senha</Label>
        <PasswordInput
          id="confirm-new-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.confirmPassword ? true : undefined}
          aria-describedby={
            errors.confirmPassword ? 'confirm-new-password-error' : undefined
          }
          {...register('confirmPassword')}
        />
        <FieldError
          id="confirm-new-password-error"
          message={errors.confirmPassword?.message}
        />
      </div>

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
