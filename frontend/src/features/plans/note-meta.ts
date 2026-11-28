const LOCATION_PREFIX = '📍 ';

export function encodePlanNote(location: string, note: string): string | undefined {
  const cleanLocation = location.trim();
  const cleanNote = note.trim();
  if (!cleanLocation && !cleanNote) return undefined;
  if (cleanLocation && cleanNote)
    return `${LOCATION_PREFIX}${cleanLocation}\n${cleanNote}`;
  if (cleanLocation) return `${LOCATION_PREFIX}${cleanLocation}`;
  return cleanNote;
}

export function decodePlanNote(raw?: string | null): {
  location: string;
  note: string;
} {
  if (!raw) return { location: '', note: '' };
  const lines = raw.split('\n');
  const first = lines[0] ?? '';
  if (first.startsWith(LOCATION_PREFIX)) {
    return {
      location: first.slice(LOCATION_PREFIX.length).trim(),
      note: lines.slice(1).join('\n').trim(),
    };
  }
  return { location: '', note: raw.trim() };
}
