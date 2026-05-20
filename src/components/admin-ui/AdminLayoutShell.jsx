import React from 'react';

const AdminLayoutShell = ({
  children,
  themeColors,
  title,
  subtitle,
  topRight,
}) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: themeColors.bgCard,
        border: `1px solid ${themeColors.border}`,
        borderRadius: '28px',
        margin: '1.5rem',
        padding: '1.25rem',
      }}
    >
      <div className="relative">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black leading-tight" style={{ color: themeColors.text }}>
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-2 text-sm md:text-base" style={{ color: themeColors.textSecondary }}>
                {subtitle}
              </p>
            ) : null}
          </div>
          {topRight}
        </div>
        {children}
      </div>
    </div>
  );
};

export default AdminLayoutShell;

