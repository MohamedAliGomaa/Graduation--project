import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';

/**
 * Minimal typing for the parts of Google Identity Services (GIS) we use.
 * Official docs: https://developers.google.com/identity/gsi/web/guides/overview
 */
interface GoogleCredentialResponse {
  /** The Google ID token (JWT). Must be verified by the backend. */
  credential?: string;
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    ux_mode?: 'popup' | 'redirect';
    use_fedcm_for_button?: boolean;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      type?: 'standard' | 'icon';
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
      shape?: 'rectangular' | 'pill';
      logo_alignment?: 'left' | 'center';
      width?: number;
      locale?: string;
    },
  ): void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } };
  }
}

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

/**
 * Wraps the official Google Identity Services script.
 *
 * - Nothing is loaded from Google unless a client ID is configured.
 * - It only hands the Google ID token to the caller. It never signs anyone in:
 *   the backend must verify the token (see AuthService.loginWithGoogle).
 */
@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private scriptPromise: Promise<void> | null = null;
  private initialized = false;
  private credentialHandler: ((idToken: string) => void) | null = null;

  /** True when a Google client ID has been set in the environment file. */
  get isConfigured(): boolean {
    return environment.googleClientId.trim().length > 0;
  }

  /**
   * Loads the GIS script (once) and initializes it.
   * Rejects if the script cannot be loaded (offline, blocked by an extension, ...).
   */
  async init(onCredential: (idToken: string) => void): Promise<void> {
    this.credentialHandler = onCredential;
    await this.loadScript();

    const gid = window.google?.accounts?.id;
    if (!gid) throw new Error('Google Identity Services is not available.');

    if (!this.initialized) {
      gid.initialize({
        client_id: environment.googleClientId.trim(),
        callback: (response) => {
          if (response.credential) this.credentialHandler?.(response.credential);
        },
        ux_mode: 'popup',
      });
      this.initialized = true;
    }
  }

  /** Renders Google's official "Continue with Google" button inside `parent`. */
  renderButton(parent: HTMLElement, width: number): void {
    const gid = window.google?.accounts?.id;
    if (!gid) return;
    parent.innerHTML = '';
    gid.renderButton(parent, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'center',
      // GIS accepts a pixel width between 200 and 400.
      width: Math.max(200, Math.min(400, Math.floor(width))),
      locale: 'en',
    });
  }

  private loadScript(): Promise<void> {
    if (this.scriptPromise) return this.scriptPromise;

    this.scriptPromise = new Promise<void>((resolve, reject) => {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = GIS_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        this.scriptPromise = null; // allow a retry later
        script.remove();
        reject(new Error('Could not load the Google sign-in script.'));
      };
      document.head.appendChild(script);
    });

    return this.scriptPromise;
  }
}
