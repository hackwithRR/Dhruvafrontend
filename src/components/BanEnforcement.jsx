import React from 'react';

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


/**
 * Frontend-only ban enforcement.
 *
 * Architecture:
 * - AuthContext listens to `users/{uid}` document in Firestore.
 * - When admin sets `isBanned=true` (and `ban_reason`), AuthContext updates `userData.isBanned`.
 * - This guard ensures banned users can never render protected pages or navigation.
 */
export default function BanEnforcement({ children }) {
  const { userData, loading } = useAuth();

  // Wait for AuthContext to finish; never redirect while loading.
  if (loading) return null;

  // AuthContext normalizes some fields, but we harden here for legacy + partial data shapes.
  // A user is considered banned if ANY of these signals are present.
  const effectiveBanReason =
    userData?.banReason ??
    userData?.ban_reason ??
    userData?.ban?.reason ??
    null;

  const isBanned =
    userData?.isBanned === true ||
    effectiveBanReason != null ||
    userData?.banned_at != null ||
    userData?.ban?.at != null;

  // If user is banned, always redirect to /banned.
  // Important: during refresh, `currentUser` can briefly be null while AuthContext catches up,
  // but `userData`/ban signals may already be available.
  if (isBanned) {
    return <Navigate to="/banned" replace />;
  }



  // Optional: If not banned, render normally.
  return children;
}
