import React from 'react';

const AdminEmptyState = ({ title, description, icon }) => {
  return (
    <div className="py-14 text-center opacity-80">
      {icon ? <div className="mb-4">{icon}</div> : null}
      <div className="text-lg font-bold">{title}</div>
      {description ? <div className="mt-2 text-sm opacity-70">{description}</div> : null}
    </div>
  );
};

export default AdminEmptyState;

