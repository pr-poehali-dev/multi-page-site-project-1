import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  path?: string;
}

const SITE_NAME = 'ИНДИГО';
const BASE_URL = 'https://индиго-арт.рф';
const DEFAULT_IMAGE = 'https://cdn.poehali.dev/projects/ecdaf1c5-6d12-4487-8a18-89243ebbcc9e/files/f12cbba3-c13a-46c4-a4e1-1c4662cd56c7.jpg';

export const useSEO = ({ title, description, keywords, ogImage, ogType = 'website', path = '' }: SEOProps) => {
  useEffect(() => {
    const fullTitle = `${title} — ${SITE_NAME}`;
    const image = ogImage || DEFAULT_IMAGE;
    const url = `${BASE_URL}${path}`;

    document.title = fullTitle;

    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        const [attrName, attrVal] = selector.replace('meta[', '').replace(']', '').split('="');
        el.setAttribute(attrName, attrVal.replace('"', ''));
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', 'content', description);
    if (keywords) setMeta('meta[name="keywords"]', 'content', keywords);

    setMeta('meta[property="og:title"]', 'content', fullTitle);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:image"]', 'content', image);
    setMeta('meta[property="og:url"]', 'content', url);
    setMeta('meta[property="og:type"]', 'content', ogType);
    setMeta('meta[property="og:site_name"]', 'content', SITE_NAME);
    setMeta('meta[property="og:locale"]', 'content', 'ru_RU');

    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'content', fullTitle);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('meta[name="twitter:image"]', 'content', image);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  }, [title, description, keywords, ogImage, ogType, path]);
};
