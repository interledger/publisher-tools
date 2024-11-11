import { createCookieSessionStorage } from "@remix-run/node";

const ENV = import.meta.env.PROD;

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    cookie: {
      name: "ilpay-session",
      httpOnly: true,
      secure: ENV,
      sameSite: "none",
      secrets: [
        process.env.SESSION_COOKIE_SECRET_KEY || "supersecretilpaystring",
      ],
      maxAge: 300,
    },
  });

export { getSession, commitSession, destroySession };

