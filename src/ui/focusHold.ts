/**
 * While a page or dialog is open (#537): everything else in the document is
 * inert, so Tab and a screen reader stay inside it, and closing it puts
 * focus back on whatever opened it rather than dropping it on `<body>`.
 */
export interface FocusHold {
  release(): void;
}

export function holdFocus(modal: HTMLElement): FocusHold {
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  // A page opened from inside another held page: that page made this one
  // inert along with everything else, so lift it while this one is open.
  const modalWasInert = modal.hasAttribute('inert');
  modal.removeAttribute('inert');
  const others = [...document.body.children].filter(
    (el): el is HTMLElement =>
      el instanceof HTMLElement && el !== modal && !el.contains(modal) && !el.hasAttribute('inert'),
  );
  for (const el of others) el.setAttribute('inert', '');
  return {
    release() {
      for (const el of others) el.removeAttribute('inert');
      if (modalWasInert) modal.setAttribute('inert', '');
      if (opener?.isConnected && opener !== document.body) opener.focus();
    },
  };
}
