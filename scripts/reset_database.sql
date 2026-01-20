-- Antigravity Casino: Database Clean-up & GGR Reset Script
-- Use this script in Cloudflare D1 to prepare for production launch.

-- 1. Reset Betting History
-- This effectively starts the history from scratch.
DELETE FROM bets;
DELETE FROM sqlite_sequence WHERE name = 'bets';

-- 2. Reset Financial Transaction History
-- This resets the Profit/Loss calculations (GGR).
DELETE FROM transactions;
DELETE FROM sqlite_sequence WHERE name = 'transactions';

-- 3. Clean up Test Users
-- IMPORTANT: Replace 'ADMIN_USER_ID' with your actual wallet ID or account ID to avoid deleting yourself.
-- If you have multiple admins, use: WHERE id NOT IN ('id1', 'id2')
DELETE FROM users 
WHERE id NOT IN ('ADMIN_USER_ID_PLACEHOLDER');

-- 4. Re-calibrate Initial Balances
-- Sets the 'initial_balance' to the current balance for accurate reconciliation moving forward.
UPDATE users 
SET initial_balance = balance,
    xp = 0,
    level = 1;

-- 5. Verification Check
SELECT 'Maintenance Complete' as status, 
       (SELECT COUNT(*) FROM users) as remaining_users,
       (SELECT COUNT(*) FROM bets) as betting_history_count;
