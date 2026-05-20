import React from 'react';

const AdminInput = ({ value, onChange, placeholder, themeColors, type = 'text', ...rest }) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-3 rounded-2xl bg-white/5 border"
      style={{
        borderColor: themeColors.border,
        color: themeColors.text,
      }}
      {...rest}
    />
  );
};

export default AdminInput;

