export const fmtIDR = (n) => 'Rp ' + n.toLocaleString('id-ID');

export const fmtIDRShort = (n) => {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}K`;
  return `Rp ${n}`;
};
