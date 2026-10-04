import { useRef, useState } from 'react'
import { IconCamera, IconTrash } from '@tabler/icons-react'

import Avatar from '@/components/profile/Avatar'
import { Button } from '@/components/ui/button'

const MAX_FILE_SIZE_MB = 2
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// O Avatar e um circulo de 96 px com object-cover, entao 512 tem folga de sobra
// para tela de retina sem inflar a coluna Text do banco.
const AVATAR_SIZE = 512

// Detectado uma vez: onde nao ha suporte a WebP (Safari antigo) o caminho cai
// para JPEG, que nao tem canal alpha e precisa de fundo branco atras.
const SUPPORTS_WEBP = (() => {
  const probe = document.createElement('canvas')
  probe.width = 1
  probe.height = 1
  return probe.toDataURL('image/webp').startsWith('data:image/webp')
})()

async function decodeImage(file: File): Promise<{
  source: ImageBitmap | HTMLImageElement
  release: () => void
}> {
  // createImageBitmap decodifica fora da main thread e e o caminho dos
  // navegadores atuais. O <img> cobre os mais antigos; o object URL so vive
  // dentro desta promessa e e revogado logo apos o load.
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file)
    return { source: bitmap, release: () => bitmap.close() }
  }

  const url = URL.createObjectURL(file)
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('falha ao decodificar'))
    img.src = url
  })
  return { source: image, release: () => URL.revokeObjectURL(url) }
}

async function resizeToSquare(file: File): Promise<string> {
  const { source, release } = await decodeImage(file)

  try {
    // Crop no lado menor, centralizado. Esticar para quadrado deformaria a
    // imagem; o Avatar ja faz o object-cover, entao o corte acontece aqui.
    const side = Math.min(source.width, source.height)
    const sx = (source.width - side) / 2
    const sy = (source.height - side) / 2

    const canvas = document.createElement('canvas')
    canvas.width = AVATAR_SIZE
    canvas.height = AVATAR_SIZE

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas indisponivel')

    if (!SUPPORTS_WEBP) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE)
    }

    ctx.drawImage(source, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE)

    return SUPPORTS_WEBP
      ? canvas.toDataURL('image/webp', 0.85)
      : canvas.toDataURL('image/jpeg', 0.85)
  } finally {
    release()
  }
}

type AvatarPickerProps = {
  value: string | null
  name: string
  onChange: (value: string | null) => void
}

export default function AvatarPicker({ value, name, onChange }: AvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(value)
  const [error, setError] = useState<string | null>(null)

  async function pickFile(file: File | undefined) {
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Use uma imagem JPEG, PNG ou WebP.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`A imagem deve ter no máximo ${MAX_FILE_SIZE_MB} MB.`)
      return
    }

    // As guardas acima sao sincronas de proposito: arquivo invalido nao chega
    // a ser decodificado.
    setError(null)

    // O avatar viaja como data URL na coluna Text, entao o que importa aqui
    // nao e so a imagem bonita e sim o tamanho da string. Um JPEG de 2 MB
    // viraria ~2,7 MB de base64 e ainda seria reenviado a cada edicao da bio;
    // em 512x512 a string fica na casa das dezenas de KB.
    try {
      const dataUrl = await resizeToSquare(file)
      setPreview(dataUrl)
      onChange(dataUrl)
    } catch {
      setError('Não foi possível processar a imagem. Tente outra.')
    }
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
          onChange={(event) => {
            void pickFile(event.target.files?.[0])
          }}
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