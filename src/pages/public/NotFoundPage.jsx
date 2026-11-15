import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useLanguage } from '../../hooks/useLanguage';

export const NotFoundPage = () => {
  const { isHindi } = useLanguage();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16 space-y-4">
      <h1 className="text-6xl font-extrabold text-slate-800">404</h1>
      <h2 className="text-xl sm:text-2xl font-bold text-slate-700">
        {isHindi ? 'पृष्ठ नहीं मिला (Page Not Found)' : 'Page Not Found'}
      </h2>
      <p className="text-slate-500 text-sm max-w-sm">
        {isHindi
          ? 'यह पृष्ठ उपलब्ध नहीं है या हटा दिया गया है।'
          : 'The page you are looking for does not exist or has been moved.'}
      </p>
      <Link to="/" className="pt-2">
        <Button icon={Home}>
          {isHindi ? 'मुख्य पृष्ठ पर जाएं' : 'Back to Home'}
        </Button>
      </Link>
    </div>
  );
};

