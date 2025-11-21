import { type PublicidadePlano } from '../types';

interface PlanoBadgeProps {
  plano: PublicidadePlano;
  className?: string;
}

const PlanoBadge = ({ plano, className = '' }: PlanoBadgeProps) => {
  const planoConfig = {
    top: {
      label: 'TOP',
      bgColor: 'bg-yellow-400',
      textColor: 'text-yellow-900',
    },
    quality: {
      label: 'QUALITY',
      bgColor: 'bg-blue-400',
      textColor: 'text-blue-900',
    },
    standard: {
      label: 'STANDARD',
      bgColor: 'bg-gray-400',
      textColor: 'text-gray-900',
    },
    intermediario: {
      label: 'INTERMEDIÁRIO',
      bgColor: 'bg-green-400',
      textColor: 'text-green-900',
    },
  };

  const config = planoConfig[plano];

  return (
    <span
      className={`inline-block ${config.bgColor} ${config.textColor} text-xs font-semibold px-2 py-1 rounded ${className}`}
    >
      {config.label}
    </span>
  );
};

export default PlanoBadge;

