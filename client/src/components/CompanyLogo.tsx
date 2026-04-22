import { useState } from 'react';

interface CompanyLogoProps {
  companyName: string;
  logoUrl?: string;
  className?: string;
}

const LOGO_DEV_TOKEN = import.meta.env.VITE_LOGO_DEV_TOKEN as string;

function toLogoDev(url?: string): string | undefined {
  if (!url) return undefined;
  let domain: string | undefined;
  if (url.includes('logo.clearbit.com/')) {
    domain = url.replace('https://logo.clearbit.com/', '');
  } else if (url.includes('img.logo.dev/')) {
    domain = url.replace('https://img.logo.dev/', '').split('?')[0];
  }
  if (domain) return `https://img.logo.dev/${domain}?token=${LOGO_DEV_TOKEN}`;
  return url;
}

function FallbackLogo({ companyName }: { companyName: string }) {
  const initials = companyName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  return (
    <div
      className="size-full rounded-[inherit] flex items-center justify-center text-white font-black tracking-tight text-sm"
      style={{ background: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)' }}
      aria-label={companyName}
      title={companyName}
    >
      {initials}
    </div>
  );
}

export function CompanyLogo({ companyName, logoUrl, className = '' }: CompanyLogoProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const resolvedLogoUrl = toLogoDev(logoUrl);
  const shouldUseImage = Boolean(resolvedLogoUrl) && !imageFailed;

  return (
    <div
      className={`overflow-hidden rounded-xl border border-gray-200 shadow-sm ${className}`.trim()}
      style={{ backgroundColor: '#ffffff' }}
      aria-hidden="true"
    >
      {shouldUseImage ? (
        <img
          src={resolvedLogoUrl}
          alt={companyName}
          className="size-full object-contain p-2"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <FallbackLogo companyName={companyName} />
      )}
    </div>
  );
}
