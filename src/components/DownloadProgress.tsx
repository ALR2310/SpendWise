import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function DownloadProgress({ value }: { value: number }) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.getElementById('dock-container');
    setContainer(el);
  }, []);

  if (!container) return null;

  return createPortal(
    <progress className="absolute progress top-0 h-[3px] z-50 w-full" value={value} max="100"></progress>,
    container,
  );
}
