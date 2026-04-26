const CONTACT_SEPARATOR_REGEX = /[;,\n]+/;

const normalizeContactEntry = (value) => String(value || "").replace(/\s+/g, " ").trim();

const splitUniqueValues = (value, { lowercase = false } = {}) => {
  const seen = new Set();

  return String(value || "")
    .split(CONTACT_SEPARATOR_REGEX)
    .map(normalizeContactEntry)
    .map((entry) => (lowercase ? entry.toLowerCase() : entry))
    .filter((entry) => {
      if (!entry || seen.has(entry)) return false;
      seen.add(entry);
      return true;
    });
};

export const splitEmailValues = (value) => splitUniqueValues(value, { lowercase: true });

export const splitPhoneValues = (value) => splitUniqueValues(value);

export const normalizeMultiValueContact = (value, options) =>
  splitUniqueValues(value, options).join("; ");

export const getPrimaryEmail = (value) => splitEmailValues(value)[0] || "";

export const getPrimaryPhone = (...values) => {
  for (const value of values) {
    const primary = splitPhoneValues(value)[0];
    if (primary) return primary;
  }

  return "";
};

export const toTelHref = (value) => {
  const phone = getPrimaryPhone(value);
  if (!phone) return "";

  const hasLeadingPlus = phone.trim().startsWith("+");
  const digits = phone.replace(/\D/g, "");
  return digits ? `tel:${hasLeadingPlus ? "+" : ""}${digits}` : "";
};

export const toMailtoHref = (value) => {
  const email = getPrimaryEmail(value);
  return email ? `mailto:${email}` : "";
};
