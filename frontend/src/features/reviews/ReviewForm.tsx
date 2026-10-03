import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import {
  IconAlertTriangleFilled,
  IconCircleCheckFilled,
} from '@tabler/icons-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import FieldError from '@/features/auth/FieldError'
import {
  REVIEW_MAX_LENGTH,
  reviewSchema,
  type ReviewFormValues,
} from '@/features/reviews/reviewSchema'
import { ApiError } from '@/lib/api'
import { writeReview } from '@/lib/games'
import { cn } from '@/lib/utils'

type ReviewFormProps = {
  gameId: string | number
  // Nota atual do usuário: a review é publicada junto com ela.
  rating: number | null
  initialText: string
  onSaved: () => void
}

export default function ReviewForm({
  gameId,
  rating,
  initialText,
  onSaved,
}: ReviewFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [published, setPublished] = useState(initialText.length > 0)

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { text: initialText },
  })

  const length = useWatch({ control, name: 'text' }).length
  const isOverLimit = length > REVIEW_MAX_LENGTH

  async function onSubmit(values: ReviewFormValues) {
    if (!rating) return
    setSubmitError(null)
    setSaved(false)

    try {
      await writeReview(gameId, rating, values.text)
      setPublished(true)
      setSaved(true)
      onSaved()
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setSubmitError('Erro inesperado. Tente novamente.')
        return
      }

      const fieldMessage = error.fieldErrors.text
      if (fieldMessage) {
        setError('text', { message: fieldMessage })
        return
      }
      setSubmitError(error.message)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-3"
    >
      {saved && (
        <Alert>
          <IconCircleCheckFilled />
          <AlertTitle>Review salva</AlertTitle>
          <AlertDescription>
            Sua review já aparece para a comunidade.
          </AlertDescription>
        </Alert>
      )}

      {submitError && (
        <Alert variant="destructive">
          <IconAlertTriangleFilled />
          <AlertTitle>Não foi possível salvar a review</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="review-text">Sua review</Label>
        <Textarea
          id="review-text"
          rows={5}
          placeholder="Conte como foi sua experiência com o jogo."
          className="field-sizing-fixed h-32 resize-y"
          aria-invalid={errors.text ? true : undefined}
          aria-describedby={errors.text ? 'review-text-error' : undefined}
          {...register('text')}
        />
        <div className="flex items-start justify-between gap-2">
          <FieldError id="review-text-error" message={errors.text?.message} />
          <span
            className={cn(
              'ml-auto text-xs tabular-nums text-neutral-500',
              isOverLimit && 'text-destructive',
            )}
          >
            {length}/{REVIEW_MAX_LENGTH}
          </span>
        </div>
      </div>

      {!rating && (
        <p className="text-xs text-neutral-500">
          Dê uma nota de 1 a 5 estrelas acima para poder publicar sua review.
        </p>
      )}

      <div>
        <Button
          type="submit"
          disabled={isSubmitting || !rating}
          className="cursor-pointer"
        >
          {isSubmitting
            ? 'Salvando...'
            : published
              ? 'Atualizar review'
              : 'Publicar review'}
        </Button>
      </div>
    </form>
  )
}
