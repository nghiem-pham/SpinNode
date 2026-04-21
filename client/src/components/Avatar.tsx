const PALETTE = [
  '#009999', '#6366f1', '#f97316', '#22c55e',
  '#ec4899', '#8b5cf6', '#3b82f6', '#0ea5e9',
  '#14b8a6', '#a855f7', '#ef4444', '#84cc16',
];

function hashName(name: string): number {
  return name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

interface AvatarProps {
  name: string;
  size?: number;
  className?: string;
}

export function Avatar({ name, size = 36, className = '' }: AvatarProps) {
  const bg = PALETTE[hashName(name) % PALETTE.length];
  const initials = getInitials(name);
  const fontSize = Math.round(size * 0.38);

  return (
    <div
      className={`flex-shrink-0 rounded-full flex items-center justify-center font-bold select-none ${className}`}
      style={{ width: size, height: size, background: bg, fontSize, color: '#fff', lineHeight: 1 }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
