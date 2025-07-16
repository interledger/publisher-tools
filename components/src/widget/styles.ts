import { css } from 'lit';

export const widgetStyles = css`
    :host {
      display: block;
      font-family: var(--wm-font-family, system-ui, sans-serif);
      --primary-color: var(--wm-primary-color, #10b981);
      --background-color: var(--wm-background-color, #ffffff);
      --text-color: var(--wm-text-color, #000000);
    }

    .wm_widget {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .content {
      display: flex;
      flex-direction: column;
      background: var(--background-color);
      width: 24rem;
      height: 37rem;
      overflow: hidden;
      border: 1px solid #f3f4f6;
      transition: all 1s ease-in-out;
      border-radius: 6px;
      padding: 0.25rem;
      outline: none;
    }

    .content:focus {
      outline: none;
    }

    .content.open {
      max-width: 24rem;
      max-height: 37rem;
      opacity: 1;
    }

    .content.closed {
      max-width: 0;
      max-height: 0;
      opacity: 0;
    }

    .widget-header {
      display: flex;
      flex-direction: column;
      height: auto;
      padding: 16px;
    }

    .widget-header h5 {
      margin: 0 0 0.5rem 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .widget-header p {
      margin: 0;
      max-height: 8rem;
      overflow: hidden;
      color: var(--text-color);
      opacity: 0.8;
    }

    .payment-content {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .payment-form {
      padding: 16px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: var(--text-color);
      font-size: 0.875rem;
    }

    .form-input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 16px;
      box-sizing: border-box;
      transition: border-color 0.2s ease;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }

    .form-input:read-only {
      background-color: #f9fafb;
      color: #6b7280;
    }

    .support-button {
      width: 100%;
      padding: 16px;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: auto;
    }

    .support-button:hover:not(:disabled) {
      background: #059669;
    }

    .support-button:disabled {
      background: #d1d5db;
      cursor: not-allowed;
    }

    .trigger {
      cursor: pointer;
      background: var(--wm-widget-trigger-bg-color, #f3f4f6);
      width: 3.5rem;
      height: 3.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 1rem;
      border: transparent;
      border-radius: 50%;
    }

    .trigger img {
      width: 2rem;
    }

    .powered-by {
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      margin-top: 16px;
      padding: 0 16px;
    }

    .powered-by a {
      color: var(--primary-color);
      text-decoration: none;
    }
  `;