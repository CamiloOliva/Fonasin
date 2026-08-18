import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');

      const scrollToHash = () => {
        const element = document.getElementById(id);

        if (element) {
          element.scrollIntoView({ behavior: 'auto', block: 'start' });
          return true;
        }

        return false;
      };

      if (scrollToHash()) {
        return;
      }

      const raf = requestAnimationFrame(() => {
        scrollToHash();
      });

      return () => cancelAnimationFrame(raf);
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [hash, pathname]);

  return null;
}
