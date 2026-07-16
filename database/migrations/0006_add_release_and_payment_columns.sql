-- Add quantity_delivered to order_items to track partial pickups
ALTER TABLE order_items ADD COLUMN quantity_delivered integer NOT NULL DEFAULT 0;

-- Add payment_status and amount_paid to orders to track POS payments
ALTER TABLE orders ADD COLUMN payment_status text NOT NULL DEFAULT 'unpaid';
ALTER TABLE orders ADD COLUMN amount_paid numeric(10,2) NOT NULL DEFAULT 0;
