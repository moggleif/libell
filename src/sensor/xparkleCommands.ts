/**
 * Command frames Libell writes to an Xparkle box, byte for byte as the
 * official app's `com.skyrc.balance.config.Cmd` builds them (see
 * `xparkleProtocol.ts` for how that was read).
 */

/** The factory password every box ships with (`Constants.DEFAULT_PASSWORD`). */
export const XPARKLE_DEFAULT_PASSWORD = '0000';

/** Command bytes (`com.skyrc.balance.config.Cmd`). */
export const XPARKLE_COMMAND = {
  factoryReset: 0x01,
  queryParameters: 0x02,
  setParameters: 0x03,
  password: 0x04,
  resetZero: 0x05,
} as const;

export type XparkleCommand = (typeof XPARKLE_COMMAND)[keyof typeof XPARKLE_COMMAND];

/** First byte of every frame, in both directions (`Cmd.base`, and
 * `ConnectListener.onNotify`'s `bytes[0] == 15` start-of-frame test). */
export const XPARKLE_FRAME_HEADER = 0x0f;

/**
 * Frame a command for `XPARKLE_WRITE_CHARACTERISTIC_UUID`, byte for byte
 * as `Cmd.base()` does it:
 *
 * ```
 * [0]            0x0F
 * [1]            payload.length + 3
 * [2]            command
 * [3]            0x00                (unused by every command the app sends)
 * [4 .. 4+n-1]   payload
 * [n+4]          checksum
 * [n+5], [n+6]   0xFF, 0xFF
 * ```
 *
 * The checksum is `(1 + Σ bytes[2..])` truncated to a byte. The app's own
 * loop runs over the whole frame including the three trailing bytes, which
 * are still zero when it runs, so this is equivalent to summing the
 * command byte, the unused `[3]`, and the payload. (It sums Java's *signed*
 * bytes, but a signed byte and its unsigned reading are congruent mod 256,
 * so the truncated result is identical either way.)
 */
export function buildCommandFrame(command: number, payload: ArrayLike<number>): Uint8Array {
  const frame = new Uint8Array(payload.length + 7);
  frame[0] = XPARKLE_FRAME_HEADER;
  frame[1] = payload.length + 3;
  frame[2] = command;
  frame[3] = 0;
  frame.set(Uint8Array.from(payload), 4);

  let checksum = 1;
  for (const byte of frame.subarray(2)) checksum += byte;
  frame[payload.length + 4] = checksum & 0xff;
  frame[payload.length + 5] = 0xff;
  frame[payload.length + 6] = 0xff;
  return frame;
}

/**
 * The app passes a single zero byte, not an empty array, as the payload of
 * every argument-less command (`Cmd.factoryReset`/`resetZero`/
 * `queryParameters` all call `base(cmd, new byte[1])`), which makes those
 * frames 8 bytes rather than 7. Reproduced exactly: a box that validates
 * the declared length would reject the shorter form.
 */
const EMPTY_PAYLOAD = [0];

/** `Cmd.queryParameters`. */
export function buildQueryParameters(): Uint8Array {
  return buildCommandFrame(XPARKLE_COMMAND.queryParameters, EMPTY_PAYLOAD);
}

/**
 * Zero the box where it currently sits (`Cmd.resetZero`) — the device's
 * own equivalent of R34's installation offset, stored in its firmware.
 * Must only ever be sent behind an explicit user action.
 */
export function buildResetZero(): Uint8Array {
  return buildCommandFrame(XPARKLE_COMMAND.resetZero, EMPTY_PAYLOAD);
}

/** Wipe the box's stored configuration (`Cmd.factoryReset`). Same caution
 * as `buildResetZero`, more so. */
export function buildFactoryReset(): Uint8Array {
  return buildCommandFrame(XPARKLE_COMMAND.factoryReset, EMPTY_PAYLOAD);
}

/**
 * Password mode byte. The app sends `0` on connect with the stored
 * password in the "new" field (i.e. "here is my password, do you accept
 * it") and `1` from its change-password screen with both fields
 * meaningful. Named here because `0` reading as "set password" would be
 * actively misleading at the call site.
 */
export const XPARKLE_PASSWORD_MODE = {
  verify: 0x00,
  change: 0x01,
} as const;

export type XparklePasswordMode =
  (typeof XPARKLE_PASSWORD_MODE)[keyof typeof XPARKLE_PASSWORD_MODE];

/** A box password is exactly four decimal digits (`PasswordViewModel`'s
 * input filter, and the fixed 4-byte slots in `Cmd.setPassword`). */
const XPARKLE_PASSWORD_LENGTH = 4;

export function isValidXparklePassword(password: string): boolean {
  return new RegExp(`^\\d{${XPARKLE_PASSWORD_LENGTH}}$`).test(password);
}

/**
 * Build the password frame (`Cmd.setPassword`): a 9-byte payload of mode,
 * then the four digits of the *new* password one digit per byte as a
 * plain number (not ASCII), then the four digits of the old one.
 *
 * Returns `null` rather than throwing for anything that is not four
 * digits — the transport should refuse to send a malformed password, not
 * crash the connect flow.
 */
export function buildPasswordFrame(
  mode: XparklePasswordMode,
  oldPassword: string,
  newPassword: string,
): Uint8Array | null {
  if (!isValidXparklePassword(oldPassword) || !isValidXparklePassword(newPassword)) return null;
  const payload = new Uint8Array(9);
  payload[0] = mode;
  for (let i = 0; i < XPARKLE_PASSWORD_LENGTH; i++) {
    payload[1 + i] = Number(newPassword[i]);
    payload[5 + i] = Number(oldPassword[i]);
  }
  return buildCommandFrame(XPARKLE_COMMAND.password, payload);
}
