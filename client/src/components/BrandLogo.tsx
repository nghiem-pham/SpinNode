import { Link } from 'react-router';

interface BrandLogoProps {
  compact?: boolean;
  showTagline?: boolean;
  className?: string;
}

export function BrandLogo({ compact = false, showTagline = false, className = '' }: BrandLogoProps) {
  const titleSize = compact ? 'text-xl' : 'text-3xl';

  return (
    <Link to="/" className={`inline-flex items-center ${className}`.trim()} aria-label="Spin Node home">
      <div className="leading-none">
        <div className={`${titleSize} font-black tracking-[-0.05em] leading-none`}>
          <span
            style={{
              background: 'linear-gradient(135deg, #013B44 0%, #009999 55%, #74E0D3 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Spin
          </span>
          <span className="brand-node"> Node</span>
        </div>
        {showTagline && (
          <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#009999]">
            Careers In Motion
          </div>
        )}
      </div>
    </Link>
  );
}
