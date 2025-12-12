// Utility to check if a player is "trapped" (born Aug 1 - Dec 31)
export const isTrappedPlayer = (dateOfBirth) => {
  if (!dateOfBirth) return false;
  const dob = new Date(dateOfBirth);
  const month = dob.getMonth();
  return month >= 7; // August (7) to December (11)
};

export const TrappedBadge = () => (
  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500 text-white">
    TRAPPED
  </span>
);