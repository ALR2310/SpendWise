import { motion } from 'framer-motion';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

interface OptionValue {
  value: string;
  label: string;
}

interface SettingItemProps {
  title: string;
  description: string;
  iconEl?: ReactNode;
  flex?: number;
  type: 'select' | 'toggle' | 'link' | 'button';
  defaultSelect?: string;
  options?: OptionValue[];
  onSelectChange?: (value: string) => void;
  defaultToggle?: boolean;
  onToggleChange?: (value: boolean) => void;
  disabled?: boolean;
  onClick?: () => void | Promise<void>;
  linkTo?: string;
}

export default function SettingsItem({
  title,
  description,
  iconEl,
  flex,
  type,
  defaultSelect,
  options,
  onSelectChange,
  defaultToggle,
  onToggleChange,
  disabled = false,
  onClick,
  linkTo,
}: SettingItemProps) {
  const [selectedOption, setSelectedOption] = useState(defaultSelect || '');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const itemRef = useRef<HTMLLabelElement>(null);

  const isButton = type === 'button';
  const isSelect = type === 'select';
  const isToggle = type === 'toggle';
  const isLink = type === 'link';
  const isDisabled = isButton && (isLoading || disabled);

  const selectedLabel = useMemo(() => {
    return options?.find((option) => option.value === selectedOption)?.label || '';
  }, [selectedOption, options]);

  const handleClick = async () => {
    if (!onClick || isLoading || disabled) return;

    try {
      const result = onClick();
      if (result instanceof Promise) {
        setIsLoading(true);
        await result;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemClick = () => {
    if (isSelect) setIsOpen(!isOpen);
    if (isButton && !isDisabled) handleClick();
  };

  const handleSelectOption = (value: string) => {
    setSelectedOption(value);
    setIsOpen(false);
    onSelectChange?.(value);
  };

  useEffect(() => {
    setSelectedOption(defaultSelect || '');
  }, [defaultSelect]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (itemRef.current && !itemRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const containerClass = `
    relative p-4 rounded-box bg-base-100 shadow-sm flex gap-4 items-center justify-between cursor-pointer 
    hover:bg-base-200 active:bg-base-300
    ${isDisabled ? 'opacity-50 cursor-not-allowed hover:bg-base-100 active:bg-base-100' : ''}
  `;

  const content = (
    <motion.label
      ref={itemRef}
      className={containerClass}
      whileTap={isButton && !isDisabled ? { scale: 0.99 } : undefined}
      transition={{ duration: 0.3 }}
      onClick={handleItemClick}
    >
      {iconEl && <div>{iconEl}</div>}

      <div style={{ flex: flex || 3 }}>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-base-content">{description}</p>
      </div>

      {isSelect && (
        <>
          <div className="select select-ghost focus:outline-none flex-1 ps-0 text-end">
            <span className="w-full">{selectedLabel}</span>
          </div>

          {isOpen && (
            <ul className="absolute top-full right-0 mt-1 p-2 rounded bg-base-100 shadow z-10" style={{ width: '60%' }}>
              {options?.map((o) => (
                <li
                  key={o.value}
                  className="px-3 py-1 cursor-pointer hover:bg-base-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectOption(o.value);
                  }}
                >
                  {o.label}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {isToggle && (
        <div className="flex justify-end flex-1">
          <input
            type="checkbox"
            defaultChecked={defaultToggle}
            className="toggle"
            onChange={(e) => onToggleChange?.(e.target.checked)}
          />
        </div>
      )}

      {(isLink || isButton) &&
        (isLoading ? (
          <span className="loading loading-spinner loading-sm"></span>
        ) : (
          <i className="fa-sharp-duotone fa-regular fa-angle-right text-xl"></i>
        ))}
    </motion.label>
  );

  return isLink && linkTo ? (
    <Link to={linkTo} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}
