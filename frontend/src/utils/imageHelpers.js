// Default avatar as a data URI (Neutral Grey)
export const DEFAULT_AVATAR = `data:image/svg+xml,%3Csvg width='150' height='150' viewBox='0 0 150 150' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='75' cy='75' r='75' fill='%23F3F4F6'/%3E%3Cg transform='translate(75, 75)'%3E%3Ccircle cx='0' cy='-10' r='22' fill='%239CA3AF'/%3E%3Cpath d='M -35 30 Q -35 8 -22 2 L 22 2 Q 35 8 35 30 L 35 55 L -35 55 Z' fill='%239CA3AF'/%3E%3C/g%3E%3C/svg%3E`;

/**
 * Get profile picture URL with fallback to default avatar
 * @param {string} profilePic - The user's profile picture URL
 * @returns {string} Profile picture URL or default avatar
 */
export const getProfilePicture = (profilePic) => {
  // Check if profilePic is a valid non-empty string
  if (
    !profilePic ||
    profilePic.trim() === "" ||
    profilePic === "https://via.placeholder.com/150"
  ) {
    return DEFAULT_AVATAR;
  }
  return profilePic;
};
