const CONSENT_STORAGE_KEY = 'almazfond_cookie_consent';
const ACCEPTED_VALUE = 'accepted';

const getConsentValue = () => {
  try {
    return localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    return null;
  }
};

const saveConsentValue = () => {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, ACCEPTED_VALUE);
  } catch {
    // Storage can be blocked by browser privacy settings; hiding the current banner is still valid.
  }
};

export function initCookieBanner() {
  const bannerElement = document.querySelector('[data-cookie-banner]');
  const acceptButton = bannerElement?.querySelector('[data-cookie-banner-accept]');

  if (!bannerElement || !acceptButton) {
    return;
  }

  if (getConsentValue() === ACCEPTED_VALUE) {
    bannerElement.hidden = true;
    return;
  }

  bannerElement.hidden = false;

  acceptButton.addEventListener('click', () => {
    saveConsentValue();
    bannerElement.hidden = true;
  });
}
