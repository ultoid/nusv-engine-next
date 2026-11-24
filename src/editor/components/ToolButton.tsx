import React from 'react';

export interface ToolButtonProps {
  icon?: React.ReactNode;
  glyph?: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
  primary?: boolean;
  onClick: () => void;
}

export function ToolButton({ icon, glyph, label, active, disabled, primary, onClick }: ToolButtonProps) {
  return (
    <button
      className={`mv-tool ${active ? 'active' : ''} ${primary ? 'play' : ''}`}
      disabled={disabled}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      <span aria-hidden="true" className="mz-icon-container">{icon ?? glyph}</span>
    </button>
  );
}
