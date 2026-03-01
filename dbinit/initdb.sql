-- Create User table
CREATE TABLE IF NOT EXISTS "user" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR NOT NULL,
    "email" VARCHAR NOT NULL,
    "password" VARCHAR NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Balances table
CREATE TABLE IF NOT EXISTS "balances" (
    "userId" INTEGER PRIMARY KEY,
    "amount" NUMERIC NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_balances_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
);

-- Create Transactions table
CREATE TABLE IF NOT EXISTS "transactions" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "transactionAmount" DECIMAL(10, 2) NOT NULL,
    "endingBalance" DECIMAL(10, 2) NOT NULL,
    "updatedDateTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_transactions_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "IDX_transactions_userId" ON "transactions"("userId");
CREATE INDEX IF NOT EXISTS "IDX_transactions_referenceNumber" ON "transactions"("referenceNumber");
CREATE INDEX IF NOT EXISTS "IDX_user_email" ON "user"("email");
