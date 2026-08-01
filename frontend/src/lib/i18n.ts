const tr = {
  save: 'Kaydet',
  cancel: 'Vazgeç',
  retry: 'Tekrar dene',
  loading: 'Yükleniyor',
  networkError: 'İnternet bağlantını kontrol et.',
  required: 'Bu alan gerekli.',
} as const;
export const i18n = { locale: 'tr-TR', t: (key: keyof typeof tr) => tr[key] };
