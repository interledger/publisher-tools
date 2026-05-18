-- DROP TABLE IF EXISTS paywall_payments;
-- DROP TABLE IF EXISTS paywall_payments_meta;

CREATE TABLE IF NOT EXISTS paywall_payments (
  site TEXT NOT NULL,
  url VARCHAR(64) NOT NULL, -- hashed
  -- sender
  sender VARCHAR(64) NOT NULL, -- hashed, walletAddress.id
  senderWalletAddressUrl VARCHAR(64) NOT NULL, -- hashed
  -- receiver
  receiver VARCHAR(64) NOT NULL, -- hashed, walletAddress.id
  receiverWalletAddressUrl VARCHAR(64) NOT NULL, -- hashed
  -- metadata
  paymentId TEXT NOT NULL UNIQUE,
  status INTEGER NOT NULL, -- 0: created, 1: complete; if failed, delete entry
  PRIMARY KEY (sender, url),
  CONSTRAINT limit_status CHECK (status IN (0, 1))
);

CREATE TABLE IF NOT EXISTS paywall_payments_meta (
  paymentId TEXT NOT NULL PRIMARY KEY,
  outgoingPaymentId TEXT NOT NULL,
  incomingPaymentId TEXT NOT NULL,
  ts INTEGER NOT NULL DEFAULT (unixepoch() * 1000), -- Date.now()
  amount TEXT NOT NULL,
  currency TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_paywall_payments ON paywall_payments(senderWalletAddressUrl, url);
