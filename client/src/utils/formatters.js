export const formatINR = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatRating = (value, fallback = "N/A") => {
  const rating = Number(value);
  if (!Number.isFinite(rating) || rating <= 0) return fallback;

  return rating.toFixed(1);
};

export const formatDateIN = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN");
};

export const formatTime12Hour = (value) => {
  if (!value || typeof value !== "string") return "";

  const [hoursText, minutesText] = value.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;

  const suffix = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 || 12;

  return `${String(normalizedHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${suffix}`;
};

export const parseRideDateTime = (dateValue, timeValue) => {
  if (!dateValue || !timeValue) return null;

  const datePart =
    typeof dateValue === "string" && dateValue.includes("T")
      ? dateValue.split("T")[0]
      : dateValue;

  const parsed = new Date(`${datePart}T${timeValue}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getRideCompletionUnlockAt = (ride) => {
  const startTime = parseRideDateTime(ride?.departureDate, ride?.departureTime);
  if (!startTime) return null;

  const estimatedDurationMinutes = Number(ride?.estimatedDurationMinutes || 0);
  const unlockOffsetMinutes =
    estimatedDurationMinutes > 0 ? Math.max(1, Math.ceil(estimatedDurationMinutes * 0.1)) : 0;

  return new Date(startTime.getTime() + unlockOffsetMinutes * 60 * 1000);
};
