import { css } from "lit";

export const interactionStyles = [

  css`
  :host {
    display: block;
    width: 100%;
    height: 100%;
  }

  .interaction-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    text-align: center;
    padding: 24px;
    box-sizing: border-box;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e5e7eb;
    border-top: 3px solid var(--primary-color, #10b981);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .status-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
  }

  .success-icon {
    background: #dcfce7;
    color: #16a34a;
  }

  .error-icon {
    background: #fef2f2;
    color: #dc2626;
  }

  .status-icon svg {
    width: 32px;
    height: 32px;
  }

  .status-title {
    margin: 0 0 8px 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-color, #000);
  }

  .status-title.success {
    color: #16a34a;
  }

  .status-title.error {
    color: #dc2626;
  }

  .status-description {
    margin: 0 0 24px 0;
    font-size: 0.875rem;
    opacity: 0.7;
    color: var(--text-color, #000);
  }

  .error-code {
    font-weight: 600;
    color: #dc2626;
    font-size: 0.75rem;
    margin-bottom: 4px;
  }

  .error-message {
    color: #dc2626;
    font-size: 0.875rem;
    line-height: 1.4;
  }

  .action-button {
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
    min-width: 120px;
  }

  .cancel-button {
    background: transparent;
    border: 2px solid #dc2626;
    color: #dc2626;
  }

  .cancel-button:hover {
    background: #dc2626;
    color: white;
  }

  .success-button {
    background: #16a34a;
    color: white;
  }

  .success-button:hover {
    background: #15803d;
  }

  .retry-button {
    background: #dc2626;
    color: white;
  }

  .retry-button:hover {
    background: #b91c1c;
  }
`
]