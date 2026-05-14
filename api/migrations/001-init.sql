CREATE TABLE IF NOT EXISTS paywall_payments (
    site TEXT NOT NULL,
    walletAddressId TEXT NOT NULL,
    walletAddress TEXT NOT NULL,
    url TEXT NOT NULL,
    paymentId TEXT NOT NULL,
    outgoingPaymentId TEXT NOT NULL,
    incomingPaymentId TEXT NOT NULL,
    ts INTEGER NOT NULL,
    PRIMARY KEY (walletAddressId, url)
);

CREATE INDEX IF NOT EXISTS idx_paywall_payments ON paywall_payments(walletAddressId, url);
CREATE INDEX IF NOT EXISTS idx_paywall_payments2 ON paywall_payments(walletAddress, url);
