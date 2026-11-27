interface Props {
  name: string | null;
  avatar: string | null;
  className?: string;
}

export default function UserAvatar({ name, avatar, className = "size-10" }: Props) {
  const initial = (name?.trim() || "?").charAt(0).toUpperCase();
  const isImage =
    !!avatar &&
    (avatar.startsWith("http") || avatar.startsWith("data:") || avatar.startsWith("/"));

  if (isImage) {
    return (
      <img
        src={avatar}
        alt=""
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium`}
    >
      {initial}
    </span>
  );
}