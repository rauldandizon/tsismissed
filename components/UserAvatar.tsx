interface UserAvatarProps {
  displayName?: string;
  photoURL?: string;
  size?: number;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

function getColorClass(name: string): string {
  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-green-500",
    "bg-rose-500",
    "bg-amber-500",
    "bg-teal-500",
    "bg-indigo-500",
    "bg-pink-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function UserAvatar({ displayName = "", photoURL, size = 40, className = "" }: UserAvatarProps) {
  const style = { width: size, height: size, fontSize: size * 0.38 };

  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={displayName}
        style={style}
        className={`rounded-full object-cover flex-shrink-0 border-2 border-tsismis-border ${className}`}
      />
    );
  }

  const initials = getInitials(displayName) || "?";

  return (
    <div
      style={style}
      className={`rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 select-none bg-tsismis-gradient border-2 border-tsismis-border ${className}`}
    >
      {initials}
    </div>
  );
}
