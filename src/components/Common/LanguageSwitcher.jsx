// 语言切换组件
import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import '../../styles/language-switcher.css';

const LanguageSwitcher = ({ className = '' }) => {
  const { currentLanguage, changeLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (languageCode) => {
    changeLanguage(languageCode);
    setIsOpen(false);
  };

  const currentLang = languages[currentLanguage];

  return (
    <div className={`language-switcher ${className}`}>
      <button 
        className="language-toggle"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className="language-flag">{currentLang.flag}</span>
        <span className="language-name">{currentLang.name}</span>
        <span className="language-arrow">▼</span>
      </button>
      
      {isOpen && (
        <div className="language-dropdown">
          {Object.values(languages).map(language => (
            <button
              key={language.code}
              className={`language-option ${
                currentLanguage === language.code ? 'active' : ''
              }`}
              onClick={() => handleLanguageChange(language.code)}
              type="button"
            >
              <span className="language-flag">{language.flag}</span>
              <span className="language-name">{language.name}</span>
              {currentLanguage === language.code && (
                <span className="language-check">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
      
      {/* 点击外部关闭下拉菜单 */}
      {isOpen && (
        <div 
          className="language-backdrop"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default LanguageSwitcher;