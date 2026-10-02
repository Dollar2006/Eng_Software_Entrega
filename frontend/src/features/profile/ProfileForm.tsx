import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

import AvatarPicker from '@/components/profile/AvatarPicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import FieldError from '@/features/auth/FieldError'
import {
    BIO_MAX_LENGTH,
    profileSchema,
    type ProfileFormValues,
} from '@/features/profile/profileSchema'
import { cn } from '@/lib/utils'

export type ProfileDraft = {
    displayName: string
    bio: string
    avatarUrl: string | null
}

type ProfileFormProps = {
    profile: ProfileDraft
    email: string
    onSave: (draft: ProfileDraft) => void
    onCancel: () => void
}

export default function ProfileForm({
    profile,
    email,
    onSave,
    onCancel,
}: ProfileFormProps) {
    // O avatar fica fora do react-hook-form por não ser um campo de texto:
    // é um input de arquivo, e entra no payload junto com o resto.
    const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatarUrl)

    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: { displayName: profile.displayName, bio: profile.bio },
    })

    // useWatch em vez de watch(): o React Compiler não consegue memoizar a
    // função watch e pularia a memoização deste componente inteiro.
    const displayName = useWatch({ control, name: 'displayName' })
    const bioLength = useWatch({ control, name: 'bio' }).length
    const isOverLimit = bioLength > BIO_MAX_LENGTH

    return (
        <form
            onSubmit={handleSubmit((values) => onSave({ ...values, avatarUrl }))}
            noValidate
            className="flex flex-col gap-6"
        >
            <AvatarPicker
                value={avatarUrl}
                name={displayName || email.split('@')[0]}
                onChange={setAvatarUrl}
            />

            <div className="flex flex-col gap-2">
                <Label htmlFor="displayName">Nome de exibição</Label>
                <Input
                    id="displayName"
                    placeholder={email.split('@')[0]}
                    aria-invalid={errors.displayName ? true : undefined}
                    aria-describedby={errors.displayName ? 'display-name-error' : undefined}
                    {...register('displayName')}
                />
                <FieldError id="display-name-error" message={errors.displayName?.message} />
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                    id="bio"
                    rows={4}
                    placeholder="Fale um pouco sobre você e o que você joga."
                    className="field-sizing-fixed h-24 resize-y"
                    aria-invalid={errors.bio ? true : undefined}
                    aria-describedby={errors.bio ? 'bio-error' : undefined}
                    {...register('bio')}
                />
                <div className="flex items-start justify-between gap-2">
                    <FieldError id="bio-error" message={errors.bio?.message} />
                    <span
                        className={cn(
                            'ml-auto text-xs tabular-nums text-neutral-500',
                            isOverLimit && 'text-destructive',
                        )}
                    >
                        {bioLength}/{BIO_MAX_LENGTH}
                    </span>
                </div>
            </div>

            <div className="flex gap-2">
                <Button type="submit" className="cursor-pointer">
                    Salvar
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