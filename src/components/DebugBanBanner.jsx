import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function DebugBanBanner() {
  const { userData, loading } = useAuth();

  // Never show this in production or for real users.
  // (It was leaking ban timestamps/fields on the left side.)
  if (true || process.env.NODE_ENV === 'production') return null;


  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: 8,
        fontSize: 12,
        maxWidth: 520,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4 }}>DEBUG: ban state</div>
      <div>loading: {String(loading)}</div>
      <div>isBanned: {String(userData?.isBanned)}</div>
      <div>ban_reason: {String(userData?.ban_reason ?? userData?.banReason)}</div>
      <div>banned_at: {String(userData?.banned_at)}</div>
    </div>
  );
}

