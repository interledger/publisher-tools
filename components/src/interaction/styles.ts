import { css } from "lit";
import { bodySyles as step1BodyStyles } from "../widget/styles";

const hostStyles = [
css`
  :host {
    display: flex;
    flex-direction: column;
    flex: 1 1 0%;
    min-height: 0;
  }
`
]

export const interactionStyles = [
  hostStyles,
step1BodyStyles,
css`
  .interaction-container {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    align-items: center;
    flex: 1;
    padding: 0px var(--Paddings-2xl, 32px);
  }
    
  .empty-header {
    height: 64px;
  }
    
  .interaction-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    margin-top: var(--Spacings-lg, 24px);
  }

  .interaction-body img {
    margin-top: var(--Paddings-2xl, 32px);
  }
    
  .title {
    text-align: center;

    /* Typography Hierarchy/H6 */
    font-family: var(--Font-Family-Inter, Inter);
    font-size: var(--Font-Size-text-lg, 18px);
    font-style: normal;
    font-weight: var(--Font-Weight-Bold, 700);
    line-height: var(--Font-Line-Height-lg, 26px); /* 144.444% */
  }

  .purple {
    color: var(--Tools-Colors-Interface-heading-container, #8075B3);
  }

  .green {
    color: var(--Tools-Colors-Text-paragraph-success, #27797A)
  }

  .red {
    color: var(--Tools-Colors-Text-paragraph-error, #E51D25);
  }

  .description {
    color: var(--Tools-Colors-Text-fields-helpertext-default, #676767);
    text-align: center;

    /* Typography Hierarchy/small-standard */
    font-family: var(--Font-Family-Inter, Inter);
    font-size: var(--Font-Size-text-sm, 14px);
    font-style: normal;
    font-weight: var(--Font-Weight-Regular, 400);
    line-height: var(--Font-Line-Height-sm, 20px); /* 142.857% */
  }

  .icon {
    width: 122px;
    height: 200px;
  }

  .button-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    margin-top: auto;
    cursor:pointer;
  }

  .empty-button {
    display: flex;
    padding: var(--Paddings-sm, 12px) 12px;
    justify-content: center;
    align-items: center;
    gap: var(--Spacings-xs, 8px);
    align-self: stretch;

    border-radius: var(--Radius-Moderate-rounding, 8px);
    border: 1px solid var(--Tools-Colors-Buttons-Secondary-edge-default, #8075B3);
    background: #FFFFFF;

    color: var(--Tools-Colors-Text-buttons-default, #8075B3);
    /* Typography Hierarchy/body-emphasis */
    font-family: var(--Font-Family-Inter, Inter);
    font-size: var(--Font-Size-text-base, 16px);
    font-style: normal;
    font-weight: var(--Font-Weight-Bold, 400);
    line-height: var(--Font-Line-Height-md, 24px); /* 150% */
  }

  .filled-button {
    display: flex;
    padding: var(--Paddings-xs, 8px);
    justify-content: center;
    align-items: center;
    gap: 10px;
    align-self: stretch;
    height: 44px;
    outline: none;
    border: none;

    border-radius: 8px;
    background: var(--Colors-green-400, #56B7B5);

    color: #FFFFFF;

    /* Typography Hierarchy/small-standard */
    font-family: var(--Font-Family-Inter, Inter);
    font-size: var(--Font-Size-text-sm, 14px);
    font-style: normal;
    font-weight: var(--Font-Weight-Regular, 400);
    line-height: var(--Font-Line-Height-sm, 20px); /* 142.857% */
  }
`
]

const interactionStylesOld = [

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