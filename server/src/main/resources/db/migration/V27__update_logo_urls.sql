UPDATE companies
SET logo_url = REPLACE(
    REPLACE(logo_url, 'https://logo.clearbit.com/', 'https://img.logo.dev/'),
    'https://img.logo.dev/',
    'https://img.logo.dev/'
)
WHERE logo_url LIKE 'https://logo.clearbit.com/%';

UPDATE companies
SET logo_url = logo_url || '?token=pk_ZoaqzQQgRF0xL1DznzzB8Q'
WHERE logo_url LIKE 'https://img.logo.dev/%'
  AND logo_url NOT LIKE '%?token=%';
