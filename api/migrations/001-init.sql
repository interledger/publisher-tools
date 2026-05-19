-- DROP TABLE IF EXISTS paywall_payments;
-- DROP TABLE IF EXISTS paywall_payments_meta;

CREATE TABLE IF NOT EXISTS paywall_payments (
  site VARCHAR(255) NOT NULL,
  url VARCHAR(64) NOT NULL, -- hashed
  -- sender
  sender VARCHAR(64) NOT NULL, -- hashed, walletAddress.id
  senderWalletAddressUrl VARCHAR(64) NOT NULL, -- hashed
  -- receiver
  receiver VARCHAR(64) NOT NULL, -- hashed, walletAddress.id
  receiverWalletAddressUrl VARCHAR(64) NOT NULL, -- hashed
  -- metadata
  paymentId VARCHAR(32) NOT NULL UNIQUE,
  status INT NOT NULL DEFAULT 0, -- 0: created, 1: complete; if failed, delete entry
  PRIMARY KEY (sender, url),
  CONSTRAINT limit_status CHECK (status IN (0, 1))
);

CREATE TABLE IF NOT EXISTS paywall_payments_meta (
  paymentId VARCHAR(32) NOT NULL PRIMARY KEY,
  outgoingPaymentId VARCHAR(1024) NOT NULL,
  incomingPaymentId VARCHAR(1024) NOT NULL,
  amount TEXT NOT NULL, -- JSON
  ts BIGINT NOT NULL DEFAULT (unixepoch() * 1000), -- Date.now()
  CONSTRAINT chk_valid_amount_json CHECK (
    json_valid(amount) AND
    json_extract(amount, '$.value') IS NOT NULL AND
    json_extract(amount, '$.assetCode') IS NOT NULL AND
    json_extract(amount, '$.assetScale') IS NOT NULL AND
    -- no other fields
    json_remove(amount, '$.value', '$.assetCode', '$.assetScale') = '{}'
  )
);

CREATE INDEX IF NOT EXISTS idx_paywall_payments ON paywall_payments(senderWalletAddressUrl, url);
