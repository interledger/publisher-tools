export interface Amount {
  value: string;
  assetCode: string;
  assetScale: number;
}
export const predefinedPaymentValues = ["1", "5", "10"];

export const getCurrencySymbol = (assetCode: string): string => {
  return new Intl.NumberFormat("en-US", {
    currency: assetCode,
    style: "currency",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })
    .format(0)
    .replace(/0/g, "")
    .trim();
};

type FormatDateArgs = {
  date: string;
  time?: boolean;
  month?: Intl.DateTimeFormatOptions["month"];
};
export const formatDate = ({
  date,
  time = true,
  month = "short",
}: FormatDateArgs): string => {
  return new Date(date).toLocaleDateString("default", {
    day: "2-digit",
    month,
    year: "numeric",
    ...(time && { hour: "2-digit", minute: "2-digit" }),
  });
};

export type FormattedAmount = {
  amount: number;
  amountWithCurrency: string;
  symbol: string;
};

type FormatAmountArgs = Amount & {
  value: string;
};

export const formatAmount = (args: FormatAmountArgs): FormattedAmount => {
  const { value, assetCode, assetScale } = args;
  const formatterWithCurrency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: assetCode,
    maximumFractionDigits: assetScale,
    minimumFractionDigits: assetScale,
  });
  const formatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: assetScale,
    minimumFractionDigits: assetScale,
  });

  const amount = Number(formatter.format(Number(`${value}e-${assetScale}`)));
  const amountWithCurrency = formatterWithCurrency.format(
    Number(`${value}e-${assetScale}`)
  );
  const symbol = getCurrencySymbol(assetCode);

  return {
    amount,
    amountWithCurrency,
    symbol,
  };
};

export const objectToUrlParams = (obj: { [key: string]: number | string }) => {
  const params = [];

  for (const key in obj) {
    params.push(`${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`);
  }

  return params.join("&");
};

// ensure received css is non corupted, valid css
export const sanitizeAndAddCss = (css: string) => {
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.style.width = "10px";
  iframe.style.height = "10px";
  document.body.appendChild(iframe);
  if (iframe && iframe.contentDocument) {
    const style = iframe.contentDocument.createElement("style");
    style.innerHTML = css;
    iframe.contentDocument.head.appendChild(style);
    const sheet = style.sheet as CSSStyleSheet;
    const result = Array.from(sheet.cssRules)
      .map((rule) => rule.cssText || "")
      .join("\n");
    iframe.remove();

    const sanitizedCss =  document.createElement('style');
    sanitizedCss.setAttribute("id", "wm_tools_styles");

    sanitizedCss.innerHTML = result || "";
    document.head.appendChild(sanitizedCss);
  }
};


export const setCookie = (
  name: string,
  value: string,
  expiresInMinutes: number,
  path: string = "/",
  domain?: string,
  secure: boolean = false,
  httpOnly: boolean = false,
  sameSite: "Strict" | "Lax" | "None" = "Lax"
) => {
  let cookieString = `${name}=${encodeURIComponent(value)}`;

  // Set expiration
  if (expiresInMinutes) {
    const date = new Date();
    date.setTime(date.getTime() + expiresInMinutes * 60 * 1000);
    cookieString += `; expires=${date.toUTCString()}`;
  }

  // Set path
  cookieString += `; path=${path}`;

  // Set domain
  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  // Set Secure attribute
  if (secure) {
    cookieString += "; secure";
  }

  // Set HttpOnly attribute - Note: HttpOnly cookies are only set via server headers, so this won't work client-side
  if (httpOnly) {
    cookieString += "; httponly";
  }

  // Set SameSite attribute
  cookieString += `; samesite=${sameSite}`;

  // Apply the cookie
  document.cookie = cookieString;
};
// Function to get a cookie value and check its validity
export const getCookie = (name: string): string | null => {
  const cookies = document.cookie.split("; ").reduce((acc, cookie) => {
    const [key, val] = cookie.split("=");
    acc[key] = decodeURIComponent(val);
    return acc;
  }, {} as Record<string, string>);

  if (cookies[name]) {
    try {
      return JSON.parse(cookies[name])
    } catch (error) {
      console.error("Failed to parse cookie", error);
      return null;
    }
  }
  return null; // Cookie not found
}