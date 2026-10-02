import { useRef, useState } from 'react'
import { IconCamera, IconTrash } from '@tabler/icons-react'

import Avatar from '@/components/profile/Avatar'
import { Button } from '@/components/ui/button'

const MAX_FILE_SIZE_MB = 2
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

type AvatarPickerProps = {
  value: string | null
  name: string
  onChange: (value: string | null) => void
}

export default function AvatarPicker({ value, name, onChange }: AvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(value)
  const [error, setError] = useState<string | null>(null)

  function pickFile(file: File | undefined) {
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Use uma imagem JPEG, PNG ou WebP.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`A imagem deve ter no máximo ${MAX_FILE_SIZE_MB} MB.`)
      return
    }

    // Data URL em vez de createObjectURL: um object URL morre junto com esta
    // tela, e o perfil salvo ainda precisa da foto depois que o form sai de
    // cena. O custo é memória, e não pesa enquanto o perfil viver só em memória.
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setError('Não foi possível ler a imagem. Tente outra.')
        return
      }
      setPreview(reader.result)
      setError(null)
      onChange(reader.result)
    }
    reader.onerror = () => setError('Não foi possível ler a imagem. Tente outra.')
    reader.readAsDataURL(file)
  }

  function clearPhoto() {
    setPreview(null)
    setError(null)
    onChange(null)
    // Sem isso, escolher o mesmo arquivo de novo não dispara o onChange.
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
      <Avatar src={preview} name={name} />

      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={(event) => pickFile(event.target.files?.[0])}
          tabIndex={-1}
          className="sr-only"
        />

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => inputRef.current?.click()}
          >
            <IconCamera className="size-4" />
            {preview ? 'Trocar foto' : 'Escolher foto'}
          </Button>

          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="cursor-pointer"
              onClick={clearPhoto}
            >
              <IconTrash className="size-4" />
              Remover
            </Button>
          )}
        </div>

        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}