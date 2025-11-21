import Link from 'next/link';
import { type ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

const Button = ({
  children,
  href,
  onClick,
  variant = 'primary',
  className = '',
  type = 'button',
  disabled = false,
}: ButtonProps) => {
  const baseStyles =
    'inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantStyles = {
    primary:
      'bg-[#0073e6] text-white hover:bg-[#005bb5] focus:ring-[#003366] shadow-md hover:shadow-lg transition-all',
    secondary:
      'bg-[#003366] text-white hover:bg-[#002244] focus:ring-[#003366] shadow-md hover:shadow-lg transition-all',
    outline:
      'border-2 border-[#0073e6] text-[#0073e6] hover:bg-[#0073e6]/10 focus:ring-[#0073e6] transition-all',
  };

  const disabledStyles = disabled
    ? 'opacity-50 cursor-not-allowed'
    : '';

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${disabledStyles} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combinedClassName}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={combinedClassName}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;

