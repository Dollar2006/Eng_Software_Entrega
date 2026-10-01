import * as React from "react"
import { IconEye, IconEyeClosed } from "@tabler/icons-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function PasswordInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <div className="relative w-full">
      <Input
        {...props}
        className={cn("bg-background pr-10", className)}
        type={showPassword ? "text" : "password"}
      />
      <Button
        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
        className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
        onClick={() => setShowPassword(!showPassword)}
        size="icon"
        tabIndex={-1}
        type="button"
        variant="ghost"
      >
        {showPassword ? (
          <IconEyeClosed className="size-4 text-muted-foreground" />
        ) : (
          <IconEye className="size-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  )
}

export { PasswordInput }
