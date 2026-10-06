import { useEffect, useState } from 'react';
import { fetchPublicContent, type PublicContentResponse } from '../services/publicContentService';

export function usePublicContent() {
  const [content, setContent] = useState<PublicContentResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    fetchPublicContent().then((result) => {
      if (active) setContent(result);
    }).catch(() => {
      if (active) setError(true);
    });
    return () => { active = false; };
  }, []);

  return { content, error, loading: !content && !error };
}
