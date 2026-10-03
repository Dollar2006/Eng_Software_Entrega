import { z } from 'zod'

// Os mesmos limites do backend (app/schema/game.py).
export const REVIEW_MIN_LENGTH = 10
export const REVIEW_MAX_LENGTH = 2000

export const reviewSchema = z.object({
  text: z
    .string()
    .trim()
    .min(
      REVIEW_MIN_LENGTH,
      `A review precisa ter pelo menos ${REVIEW_MIN_LENGTH} caracteres.`,
    )
    .max(
      REVIEW_MAX_LENGTH,
      `A review deve ter no máximo ${REVIEW_MAX_LENGTH} caracteres.`,
    ),
})

export type ReviewFormValues = z.infer<typeof reviewSchema>
