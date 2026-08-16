import { useState, useRef, useEffect } from 'react';
import styles from './CustomSelect.module.css';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  placeholder: string;
}

export default function CustomSelect({ value, onChange, options, placeholder }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={styles.selectContainer} ref={dropdownRef}>
      <div className={styles.selectHeader} onClick={() => setIsOpen(!isOpen)}>
        <span className={!selectedOption ? styles.placeholder : ''}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg className={`${styles.chevron} ${isOpen ? styles.open : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </div>
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={`${styles.option} ${value === "" ? styles.selected : ''}`} onClick={() => { onChange(""); setIsOpen(false); }}>
            {placeholder}
          </div>
          {options.map((opt) => (
            <div 
              key={opt.value} 
              className={`${styles.option} ${value === opt.value ? styles.selected : ''}`}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
