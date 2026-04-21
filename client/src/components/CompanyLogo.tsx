import { useState } from 'react';

interface CompanyLogoProps {
  companyName: string;
  logoUrl?: string;
  className?: string;
}

interface CompanyBrand {
  label: string;
  background: string;
  textColor?: string;
}

const verifiedLogoUrls: Record<string, string> = {
  Google: 'https://commons.wikimedia.org/wiki/Special:FilePath/Google_2015_logo.svg',
  Meta: 'https://commons.wikimedia.org/wiki/Special:FilePath/Meta_Platforms_logo.svg',
  Amazon: 'https://commons.wikimedia.org/wiki/Special:FilePath/Amazon_2024.svg',
  Apple: 'https://commons.wikimedia.org/wiki/Special:FilePath/Apple_Logo.svg',
  Netflix: 'https://commons.wikimedia.org/wiki/Special:FilePath/Netflix_2015_logo.svg',
  OpenAI: 'https://commons.wikimedia.org/wiki/Special:FilePath/OpenAI_logo_2025_%28symbol%29.svg',
};

const companyBrands: Record<string, CompanyBrand> = {
  Google: {
    label: 'G',
    background: 'linear-gradient(135deg, #4285F4 0%, #34A853 35%, #FBBC05 68%, #EA4335 100%)',
  },
  Meta: {
    label: '∞',
    background: 'linear-gradient(135deg, #0866FF 0%, #5B9DFF 100%)',
  },
  Amazon: {
    label: 'a',
    background: 'linear-gradient(135deg, #111827 0%, #232F3E 100%)',
  },
  Apple: {
    label: '',
    background: 'linear-gradient(135deg, #111827 0%, #6B7280 100%)',
  },
  Netflix: {
    label: 'N',
    background: 'linear-gradient(135deg, #8B0000 0%, #E50914 100%)',
  },
  OpenAI: {
    label: 'OA',
    background: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)',
  },
};

function AppleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden="true">
      <path d="M15.6 12.9c0-2.4 2-3.5 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-2-.9-3.2-.9-1.7 0-3.2 1-4 2.4-1.7 2.9-.4 7.2 1.2 9.5.8 1.1 1.7 2.3 2.9 2.3 1.1 0 1.5-.7 2.9-.7 1.3 0 1.7.7 2.9.7 1.2 0 2-1.1 2.8-2.2.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.5-1-2.5-3.8Zm-2.4-7c.7-.9 1.2-2.1 1.1-3.3-1 .1-2.2.7-2.9 1.6-.7.8-1.2 2-1.1 3.2 1.1.1 2.2-.6 2.9-1.5Z" />
    </svg>
  );
}

function FallbackLogo({ companyName }: { companyName: string }) {
  const brand = companyBrands[companyName] || {
    label: companyName
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join(''),
    background: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)',
  };

  return (
    <div
      className="size-full rounded-[inherit] flex items-center justify-center text-white font-black tracking-tight"
      style={{ background: brand.background, color: brand.textColor || 'white' }}
      aria-label={companyName}
      title={companyName}
    >
      {companyName === 'Apple' ? <AppleGlyph /> : <span className="text-sm">{brand.label}</span>}
    </div>
  );
}

export function CompanyLogo({ companyName, logoUrl, className = '' }: CompanyLogoProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const resolvedLogoUrl = verifiedLogoUrls[companyName] || logoUrl;
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
