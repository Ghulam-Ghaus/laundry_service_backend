-- Seed Data: 0002_seed_data.sql
-- Description: Populate database with initial lookups, roles, permissions, service catalog, service areas, and settings.

-- 1. Seed lookup_groups
INSERT INTO lookup_groups (group_key, name, description) VALUES
  ('order_status', 'Order Status', 'Statuses of an order in the laundry lifecycle'),
  ('task_type', 'Task Type', 'Types of tasks assigned to staff'),
  ('task_status', 'Task Status', 'Statuses of staff tasks'),
  ('payment_method', 'Payment Method', 'Supported methods of payment'),
  ('payment_status', 'Payment Status', 'Statuses of payment transactions'),
  ('address_type', 'Address Type', 'Label types for customer addresses'),
  ('slot_type', 'Time Slot Type', 'Type of time slot (pickup or delivery)'),
  ('frequency_type', 'Frequency Type', 'Subscription/reoccurrence frequencies'),
  ('notification_channel', 'Notification Channel', 'Channels through which notifications are sent'),
  ('notification_status', 'Notification Status', 'Delivery statuses of notifications'),
  ('discount_type', 'Discount Type', 'Types of coupon discounts'),
  ('language', 'Language', 'Supported languages')
ON CONFLICT (group_key) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 2. Seed lookup_values
-- order_status
INSERT INTO lookup_values (group_id, code, label, sort_order) VALUES
  ((SELECT id FROM lookup_groups WHERE group_key = 'order_status'), 'draft', 'Draft', 1),
  ((SELECT id FROM lookup_groups WHERE group_key = 'order_status'), 'pending_confirmation', 'Pending Confirmation', 2),
  ((SELECT id FROM lookup_groups WHERE group_key = 'order_status'), 'confirmed', 'Confirmed', 3),
  ((SELECT id FROM lookup_groups WHERE group_key = 'order_status'), 'assigned', 'Assigned', 4),
  ((SELECT id FROM lookup_groups WHERE group_key = 'order_status'), 'pickup_in_progress', 'Pickup in Progress', 5),
  ((SELECT id FROM lookup_groups WHERE group_key = 'order_status'), 'picked_up', 'Picked Up', 6),
  ((SELECT id FROM lookup_groups WHERE group_key = 'order_status'), 'cleaning', 'Cleaning', 7),
  ((SELECT id FROM lookup_groups WHERE group_key = 'order_status'), 'ready_for_delivery', 'Ready for Delivery', 8),
  ((SELECT id FROM lookup_groups WHERE group_key = 'order_status'), 'delivery_in_progress', 'Delivery in Progress', 9),
  ((SELECT id FROM lookup_groups WHERE group_key = 'order_status'), 'delivered', 'Delivered', 10),
  ((SELECT id FROM lookup_groups WHERE group_key = 'order_status'), 'completed', 'Completed', 11),
  ((SELECT id FROM lookup_groups WHERE group_key = 'order_status'), 'cancelled', 'Cancelled', 12),
  ((SELECT id FROM lookup_groups WHERE group_key = 'order_status'), 'failed', 'Failed', 13)
ON CONFLICT (group_id, code) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

-- task_type
INSERT INTO lookup_values (group_id, code, label, sort_order) VALUES
  ((SELECT id FROM lookup_groups WHERE group_key = 'task_type'), 'pickup', 'Pickup', 1),
  ((SELECT id FROM lookup_groups WHERE group_key = 'task_type'), 'cleaning', 'Cleaning', 2),
  ((SELECT id FROM lookup_groups WHERE group_key = 'task_type'), 'delivery', 'Delivery', 3)
ON CONFLICT (group_id, code) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

-- task_status
INSERT INTO lookup_values (group_id, code, label, sort_order) VALUES
  ((SELECT id FROM lookup_groups WHERE group_key = 'task_status'), 'pending', 'Pending', 1),
  ((SELECT id FROM lookup_groups WHERE group_key = 'task_status'), 'assigned', 'Assigned', 2),
  ((SELECT id FROM lookup_groups WHERE group_key = 'task_status'), 'in_progress', 'In Progress', 3),
  ((SELECT id FROM lookup_groups WHERE group_key = 'task_status'), 'completed', 'Completed', 4),
  ((SELECT id FROM lookup_groups WHERE group_key = 'task_status'), 'failed', 'Failed', 5),
  ((SELECT id FROM lookup_groups WHERE group_key = 'task_status'), 'cancelled', 'Cancelled', 6)
ON CONFLICT (group_id, code) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

-- payment_method
INSERT INTO lookup_values (group_id, code, label, sort_order) VALUES
  ((SELECT id FROM lookup_groups WHERE group_key = 'payment_method'), 'cash_on_delivery', 'Cash on Delivery', 1),
  ((SELECT id FROM lookup_groups WHERE group_key = 'payment_method'), 'bank_transfer', 'Bank Transfer', 2),
  ((SELECT id FROM lookup_groups WHERE group_key = 'payment_method'), 'card_manual', 'Card (Manual)', 3),
  ((SELECT id FROM lookup_groups WHERE group_key = 'payment_method'), 'wallet_later', 'Wallet / Pay Later', 4)
ON CONFLICT (group_id, code) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

-- payment_status
INSERT INTO lookup_values (group_id, code, label, sort_order) VALUES
  ((SELECT id FROM lookup_groups WHERE group_key = 'payment_status'), 'unpaid', 'Unpaid', 1),
  ((SELECT id FROM lookup_groups WHERE group_key = 'payment_status'), 'pending', 'Pending', 2),
  ((SELECT id FROM lookup_groups WHERE group_key = 'payment_status'), 'paid', 'Paid', 3),
  ((SELECT id FROM lookup_groups WHERE group_key = 'payment_status'), 'failed', 'Failed', 4),
  ((SELECT id FROM lookup_groups WHERE group_key = 'payment_status'), 'refunded', 'Refunded', 5)
ON CONFLICT (group_id, code) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

-- address_type
INSERT INTO lookup_values (group_id, code, label, sort_order) VALUES
  ((SELECT id FROM lookup_groups WHERE group_key = 'address_type'), 'home', 'Home', 1),
  ((SELECT id FROM lookup_groups WHERE group_key = 'address_type'), 'office', 'Office', 2),
  ((SELECT id FROM lookup_groups WHERE group_key = 'address_type'), 'hotel', 'Hotel', 3),
  ((SELECT id FROM lookup_groups WHERE group_key = 'address_type'), 'other', 'Other', 4)
ON CONFLICT (group_id, code) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

-- slot_type
INSERT INTO lookup_values (group_id, code, label, sort_order) VALUES
  ((SELECT id FROM lookup_groups WHERE group_key = 'slot_type'), 'pickup', 'Pickup Slot', 1),
  ((SELECT id FROM lookup_groups WHERE group_key = 'slot_type'), 'delivery', 'Delivery Slot', 2)
ON CONFLICT (group_id, code) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

-- frequency_type
INSERT INTO lookup_values (group_id, code, label, sort_order) VALUES
  ((SELECT id FROM lookup_groups WHERE group_key = 'frequency_type'), 'just_once', 'Just Once', 1),
  ((SELECT id FROM lookup_groups WHERE group_key = 'frequency_type'), 'weekly', 'Weekly', 2),
  ((SELECT id FROM lookup_groups WHERE group_key = 'frequency_type'), 'every_two_weeks', 'Every Two Weeks', 3),
  ((SELECT id FROM lookup_groups WHERE group_key = 'frequency_type'), 'every_four_weeks', 'Every Four Weeks', 4)
ON CONFLICT (group_id, code) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

-- notification_channel
INSERT INTO lookup_values (group_id, code, label, sort_order) VALUES
  ((SELECT id FROM lookup_groups WHERE group_key = 'notification_channel'), 'email', 'Email', 1),
  ((SELECT id FROM lookup_groups WHERE group_key = 'notification_channel'), 'sms', 'SMS', 2),
  ((SELECT id FROM lookup_groups WHERE group_key = 'notification_channel'), 'whatsapp', 'WhatsApp', 3),
  ((SELECT id FROM lookup_groups WHERE group_key = 'notification_channel'), 'in_app', 'In-App Notification', 4)
ON CONFLICT (group_id, code) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

-- notification_status
INSERT INTO lookup_values (group_id, code, label, sort_order) VALUES
  ((SELECT id FROM lookup_groups WHERE group_key = 'notification_status'), 'pending', 'Pending', 1),
  ((SELECT id FROM lookup_groups WHERE group_key = 'notification_status'), 'sent', 'Sent', 2),
  ((SELECT id FROM lookup_groups WHERE group_key = 'notification_status'), 'failed', 'Failed', 3),
  ((SELECT id FROM lookup_groups WHERE group_key = 'notification_status'), 'skipped', 'Skipped', 4)
ON CONFLICT (group_id, code) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

-- discount_type
INSERT INTO lookup_values (group_id, code, label, sort_order) VALUES
  ((SELECT id FROM lookup_groups WHERE group_key = 'discount_type'), 'fixed_amount', 'Fixed Amount Discount', 1),
  ((SELECT id FROM lookup_groups WHERE group_key = 'discount_type'), 'percentage', 'Percentage Discount', 2)
ON CONFLICT (group_id, code) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

-- language
INSERT INTO lookup_values (group_id, code, label, sort_order, is_default) VALUES
  ((SELECT id FROM lookup_groups WHERE group_key = 'language'), 'en', 'English', 1, true),
  ((SELECT id FROM lookup_groups WHERE group_key = 'language'), 'ur', 'Urdu', 2, false)
ON CONFLICT (group_id, code) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order, is_default = EXCLUDED.is_default;


-- 3. Seed roles
INSERT INTO roles (code, name, description, is_system) VALUES
  ('customer', 'Customer', 'Normal Customer Account', true),
  ('staff_pickup', 'Staff Pickup', 'Staff responsible for collecting laundry', true),
  ('staff_delivery', 'Staff Delivery', 'Staff responsible for delivering clean laundry', true),
  ('staff_cleaning', 'Staff Cleaning', 'Staff in charge of washing, ironing and dry cleaning', true),
  ('admin', 'Admin', 'Store Administrator', true),
  ('super_admin', 'Super Admin', 'System Owner / Super Administrator with full database permissions', true)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;


-- 4. Seed permissions
INSERT INTO permissions (code, name, resource, action, description) VALUES
  ('orders.read', 'Read Orders', 'orders', 'read', 'Allow viewing orders'),
  ('orders.create', 'Create Orders', 'orders', 'create', 'Allow creating orders'),
  ('orders.update', 'Update Orders', 'orders', 'update', 'Allow updating orders'),
  ('orders.change_status', 'Change Order Status', 'orders', 'change_status', 'Allow changing order status'),
  ('orders.assign_staff', 'Assign Staff to Orders', 'orders', 'assign_staff', 'Allow assigning drivers/cleaning staff'),
  ('orders.cancel', 'Cancel Orders', 'orders', 'cancel', 'Allow canceling orders'),
  ('catalog.read', 'Read Catalog', 'catalog', 'read', 'Allow viewing services and prices'),
  ('catalog.create', 'Create Catalog Items', 'catalog', 'create', 'Allow adding categories, items and prices'),
  ('catalog.update', 'Update Catalog Items', 'catalog', 'update', 'Allow updating categories, items and prices'),
  ('catalog.delete', 'Delete Catalog Items', 'catalog', 'delete', 'Allow deleting categories, items and prices'),
  ('areas.read', 'Read Areas', 'areas', 'read', 'Allow viewing service areas'),
  ('areas.create', 'Create Areas', 'areas', 'create', 'Allow adding service areas'),
  ('areas.update', 'Update Areas', 'areas', 'update', 'Allow updating service areas'),
  ('areas.delete', 'Delete Areas', 'areas', 'delete', 'Allow deleting service areas'),
  ('slots.read', 'Read Time Slots', 'slots', 'read', 'Allow viewing pickup and delivery time slots'),
  ('slots.create', 'Create Time Slots', 'slots', 'create', 'Allow adding time slots'),
  ('slots.update', 'Update Time Slots', 'slots', 'update', 'Allow updating time slots'),
  ('slots.delete', 'Delete Time Slots', 'slots', 'delete', 'Allow deleting time slots'),
  ('users.read', 'Read Users', 'users', 'read', 'Allow viewing user profiles'),
  ('users.create_staff', 'Create Staff Account', 'users', 'create_staff', 'Allow creating staff or administrative accounts'),
  ('users.update', 'Update Users', 'users', 'update', 'Allow updating user profiles'),
  ('users.delete', 'Delete Users', 'users', 'delete', 'Allow disabling or soft-deleting users'),
  ('users.update_roles', 'Manage User Roles', 'users', 'update_roles', 'Allow assigning roles to users'),
  ('discounts.read', 'Read Discounts', 'discounts', 'read', 'Allow viewing discounts'),
  ('discounts.create', 'Create Discounts', 'discounts', 'create', 'Allow creating coupons'),
  ('discounts.update', 'Update Discounts', 'discounts', 'update', 'Allow updating coupons'),
  ('discounts.delete', 'Delete Discounts', 'discounts', 'delete', 'Allow deleting coupons'),
  ('notifications.read', 'Read Notification Logs', 'notifications', 'read', 'Allow viewing notifications'),
  ('notifications.update', 'Manage Notification Templates', 'notifications', 'update', 'Allow editing notification templates'),
  ('settings.read', 'Read System Settings', 'settings', 'read', 'Allow viewing settings'),
  ('settings.update', 'Update System Settings', 'settings', 'update', 'Allow modifying settings'),
  ('audit.read', 'Read Audit Logs', 'audit', 'read', 'Allow viewing system audit logs')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, resource = EXCLUDED.resource, action = EXCLUDED.action, description = EXCLUDED.description;


-- 5. Seed role_permissions (Assign all permissions to super_admin and admin, and relevant permissions to customer/staff)
-- super_admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE code = 'super_admin'), id FROM permissions
ON CONFLICT DO NOTHING;

-- admin gets most permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE code = 'admin'), id FROM permissions
WHERE code NOT IN ('users.update_roles')
ON CONFLICT DO NOTHING;

-- customer gets customer specific permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE code = 'customer'), id FROM permissions
WHERE code IN ('orders.read', 'orders.create', 'orders.cancel', 'catalog.read', 'areas.read', 'slots.read')
ON CONFLICT DO NOTHING;

-- staff pickup gets staff permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE code = 'staff_pickup'), id FROM permissions
WHERE code IN ('orders.read', 'orders.change_status')
ON CONFLICT DO NOTHING;

-- staff delivery gets staff permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE code = 'staff_delivery'), id FROM permissions
WHERE code IN ('orders.read', 'orders.change_status')
ON CONFLICT DO NOTHING;

-- staff cleaning gets staff permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE code = 'staff_cleaning'), id FROM permissions
WHERE code IN ('orders.read', 'orders.change_status')
ON CONFLICT DO NOTHING;


-- 6. Seed service_categories
INSERT INTO service_categories (code, name, description, sort_order) VALUES
  ('shirts_tops', 'Shirts/Tops', 'Shirts, T-shirts, Polo shirts, and lightweight tops', 1),
  ('suits', 'Suits', 'Men and women suits, blazers, and coats', 2),
  ('dress_skirt', 'Dress/Skirt', 'Dresses, long skirts, frocks', 3),
  ('trousers', 'Trousers', 'Pants, jeans, trousers, shalwars', 4),
  ('home', 'Home', 'Bedsheets, blankets, curtains, duvets', 5),
  ('steam_press', 'Steam Press Only', 'Professional steam ironing services', 6),
  ('outdoor', 'Outdoor & Heavy', 'Jackets, windbreakers, heavy winter coats', 7),
  ('knitwear', 'Knitwear', 'Sweaters, cardigans, scarves', 8),
  ('laundry', 'Laundry (Wash & Fold)', 'Bulk household wash, dry and fold', 9)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order;


-- 7. Seed service_options
INSERT INTO service_options (code, name, description) VALUES
  ('wash_iron', 'Wash & Iron', 'Thorough laundering followed by premium steam iron press'),
  ('dry_clean', 'Dry Clean', 'Dry-cleaning process for sensitive materials'),
  ('steam_press', 'Steam Press', 'Professional steam ironing only'),
  ('wash_dry_fold', 'Wash, Dry & Fold', 'Laundered and neatly folded, no iron press'),
  ('alteration', 'Alteration', 'Tailoring, stitching, button replacement, repairs')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;


-- 8. Seed catalog_items
INSERT INTO catalog_items (category_id, code, name, description, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE code = 'shirts_tops'), 'hung_shirt', 'Hung Shirt', 'Standard shirt, washed, pressed and placed on hanger', 1),
  ((SELECT id FROM service_categories WHERE code = 'shirts_tops'), 'folded_shirt', 'Folded Shirt', 'Standard shirt, washed, pressed and neatly folded', 2),
  ((SELECT id FROM service_categories WHERE code = 'shirts_tops'), 'hung_tshirt', 'Hung T-Shirt', 'Casual T-shirt, washed, pressed and hung', 3),
  ((SELECT id FROM service_categories WHERE code = 'shirts_tops'), 'folded_tshirt', 'Folded T-Shirt', 'Casual T-shirt, washed, pressed and folded', 4),
  ((SELECT id FROM service_categories WHERE code = 'shirts_tops'), 'dinner_shirt', 'Dinner Shirt', 'Formal tuxedo or dress shirt requiring special care', 5),
  ((SELECT id FROM service_categories WHERE code = 'suits'), 'blazer', 'Blazer', 'Men or women jacket/blazer dry cleaned', 1),
  ((SELECT id FROM service_categories WHERE code = 'suits'), 'two_piece_suit', 'Two-Piece Suit', 'Coat and trousers set dry cleaned and pressed', 2),
  ((SELECT id FROM service_categories WHERE code = 'dress_skirt'), 'dress', 'Dress', 'Regular dress or formal wear', 1),
  ((SELECT id FROM service_categories WHERE code = 'trousers'), 'trousers', 'Trousers', 'Pants, trousers, jeans, or shalwar', 1),
  ((SELECT id FROM service_categories WHERE code = 'suits'), 'jacket', 'Jacket', 'Regular wear jacket dry cleaned', 3),
  ((SELECT id FROM service_categories WHERE code = 'outdoor'), 'overcoat', 'Overcoat', 'Heavy long winter overcoat dry cleaned', 1),
  ((SELECT id FROM service_categories WHERE code = 'knitwear'), 'scarf', 'Scarf', 'Scarf, muffler or stole dry cleaned', 1),
  ((SELECT id FROM service_categories WHERE code = 'suits'), 'sherwani', 'Sherwani', 'Formal traditional Sherwani coat dry cleaned', 4),
  ((SELECT id FROM service_categories WHERE code = 'home'), 'bedsheet', 'Bedsheet', 'Double or single bedsheet washed and pressed', 1),
  ((SELECT id FROM service_categories WHERE code = 'home'), 'blanket', 'Blanket', 'Warm blanket/duvet dry cleaned', 2),
  ((SELECT id FROM service_categories WHERE code = 'home'), 'curtain', 'Curtain', 'Window or door curtain washed/dry-cleaned per panel', 3)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order;


-- 9. Seed item_prices (Base prices in PKR)
INSERT INTO item_prices (item_id, service_option_id, price) VALUES
  ((SELECT id FROM catalog_items WHERE code = 'hung_shirt'), (SELECT id FROM service_options WHERE code = 'wash_iron'), 250.00),
  ((SELECT id FROM catalog_items WHERE code = 'folded_shirt'), (SELECT id FROM service_options WHERE code = 'wash_iron'), 300.00),
  ((SELECT id FROM catalog_items WHERE code = 'hung_tshirt'), (SELECT id FROM service_options WHERE code = 'wash_iron'), 250.00),
  ((SELECT id FROM catalog_items WHERE code = 'folded_tshirt'), (SELECT id FROM service_options WHERE code = 'wash_iron'), 300.00),
  ((SELECT id FROM catalog_items WHERE code = 'dinner_shirt'), (SELECT id FROM service_options WHERE code = 'dry_clean'), 300.00),
  ((SELECT id FROM catalog_items WHERE code = 'blazer'), (SELECT id FROM service_options WHERE code = 'dry_clean'), 750.00),
  ((SELECT id FROM catalog_items WHERE code = 'two_piece_suit'), (SELECT id FROM service_options WHERE code = 'dry_clean'), 2700.00),
  ((SELECT id FROM catalog_items WHERE code = 'dress'), (SELECT id FROM service_options WHERE code = 'dry_clean'), 800.00),
  ((SELECT id FROM catalog_items WHERE code = 'trousers'), (SELECT id FROM service_options WHERE code = 'wash_iron'), 250.00),
  ((SELECT id FROM catalog_items WHERE code = 'jacket'), (SELECT id FROM service_options WHERE code = 'dry_clean'), 800.00),
  ((SELECT id FROM catalog_items WHERE code = 'overcoat'), (SELECT id FROM service_options WHERE code = 'dry_clean'), 1500.00),
  ((SELECT id FROM catalog_items WHERE code = 'scarf'), (SELECT id FROM service_options WHERE code = 'dry_clean'), 400.00),
  ((SELECT id FROM catalog_items WHERE code = 'sherwani'), (SELECT id FROM service_options WHERE code = 'dry_clean'), 2000.00)
ON CONFLICT DO NOTHING;


-- 10. Seed service_areas
INSERT INTO service_areas (code, name, city, country, sort_order) VALUES
  ('dha', 'DHA', 'Lahore', 'Pakistan', 1),
  ('gulberg', 'Gulberg', 'Lahore', 'Pakistan', 2),
  ('johar_town', 'Johar Town', 'Lahore', 'Pakistan', 3),
  ('model_town', 'Model Town', 'Lahore', 'Pakistan', 4),
  ('faisal_town', 'Faisal Town', 'Lahore', 'Pakistan', 5),
  ('bahria_town', 'Bahria Town', 'Lahore', 'Pakistan', 6),
  ('wapda_town', 'Wapda Town', 'Lahore', 'Pakistan', 7),
  ('garden_town', 'Garden Town', 'Lahore', 'Pakistan', 8),
  ('askari', 'Askari', 'Lahore', 'Pakistan', 9),
  ('valencia', 'Valencia', 'Lahore', 'Pakistan', 10),
  ('allama_iqbal_town', 'Allama Iqbal Town', 'Lahore', 'Pakistan', 11),
  ('township', 'Township', 'Lahore', 'Pakistan', 12),
  ('lake_city', 'Lake City', 'Lahore', 'Pakistan', 13)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, city = EXCLUDED.city, sort_order = EXCLUDED.sort_order;


-- 11. Seed system_settings
INSERT INTO system_settings (setting_key, setting_value, description, is_public) VALUES
  ('brand_name', '"Awais Dry Cleaner"', 'Store Brand Name', true),
  ('default_currency', '"PKR"', 'System currency code', true),
  ('minimum_order_value', '"3000.00"', 'Minimum order requirement for free pickup/delivery', true),
  ('service_fee', '"100.00"', 'Base service fee for laundry orders below threshold', true),
  ('default_language', '"en"', 'Default system locale', true),
  ('support_phone', '"+923001234567"', 'Store support telephone number', true),
  ('support_whatsapp', '"+923001234567"', 'WhatsApp channel number', true),
  ('support_email', '"support@awaisdrycleaner.com"', 'Support email inbox address', true)
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, description = EXCLUDED.description, is_public = EXCLUDED.is_public;


-- 12. Seed time_slots (standard slots)
INSERT INTO time_slots (slot_type_id, label, start_time, end_time, capacity, sort_order) VALUES
  ((SELECT id FROM lookup_values WHERE code = 'pickup' AND group_id = (SELECT id FROM lookup_groups WHERE group_key = 'slot_type')), 'Morning (09:00 AM - 12:00 PM)', '09:00:00', '12:00:00', 10, 1),
  ((SELECT id FROM lookup_values WHERE code = 'pickup' AND group_id = (SELECT id FROM lookup_groups WHERE group_key = 'slot_type')), 'Afternoon (12:00 PM - 03:00 PM)', '12:00:00', '15:00:00', 10, 2),
  ((SELECT id FROM lookup_values WHERE code = 'pickup' AND group_id = (SELECT id FROM lookup_groups WHERE group_key = 'slot_type')), 'Evening (03:00 PM - 06:00 PM)', '15:00:00', '18:00:00', 10, 3),
  ((SELECT id FROM lookup_values WHERE code = 'pickup' AND group_id = (SELECT id FROM lookup_groups WHERE group_key = 'slot_type')), 'Night (06:00 PM - 09:00 PM)', '18:00:00', '21:00:00', 10, 4),
  ((SELECT id FROM lookup_values WHERE code = 'delivery' AND group_id = (SELECT id FROM lookup_groups WHERE group_key = 'slot_type')), 'Morning (09:00 AM - 12:00 PM)', '09:00:00', '12:00:00', 10, 1),
  ((SELECT id FROM lookup_values WHERE code = 'delivery' AND group_id = (SELECT id FROM lookup_groups WHERE group_key = 'slot_type')), 'Afternoon (12:00 PM - 03:00 PM)', '12:00:00', '15:00:00', 10, 2),
  ((SELECT id FROM lookup_values WHERE code = 'delivery' AND group_id = (SELECT id FROM lookup_groups WHERE group_key = 'slot_type')), 'Evening (03:00 PM - 06:00 PM)', '15:00:00', '18:00:00', 10, 3),
  ((SELECT id FROM lookup_values WHERE code = 'delivery' AND group_id = (SELECT id FROM lookup_groups WHERE group_key = 'slot_type')), 'Night (06:00 PM - 09:00 PM)', '18:00:00', '21:00:00', 10, 4)
ON CONFLICT DO NOTHING;


-- 13. Seed notification_templates
INSERT INTO notification_templates (code, channel_id, language_id, subject, body) VALUES
  ('order_created_customer', 
   (SELECT id FROM lookup_values WHERE code = 'email' AND group_id = (SELECT id FROM lookup_groups WHERE group_key = 'notification_channel')),
   (SELECT id FROM lookup_values WHERE code = 'en' AND group_id = (SELECT id FROM lookup_groups WHERE group_key = 'language')),
   'Your Order {{order_number}} is Created!',
   'Dear {{first_name}},\n\nYour laundry booking has been submitted. Order Number: {{order_number}}. Amount: PKR {{grand_total}}. Selected Pickup: {{pickup_date}} ({{pickup_slot}}).\n\nThank you for choosing Awais Dry Cleaner!'),
   
  ('order_created_admin', 
   (SELECT id FROM lookup_values WHERE code = 'email' AND group_id = (SELECT id FROM lookup_groups WHERE group_key = 'notification_channel')),
   (SELECT id FROM lookup_values WHERE code = 'en' AND group_id = (SELECT id FROM lookup_groups WHERE group_key = 'language')),
   'New Booking Received - Order {{order_number}}',
   'Admin Notice:\n\nA new laundry order has been submitted. Order Number: {{order_number}}. Customer: {{first_name}} {{last_name}}. Total Amount: PKR {{grand_total}}.\n\nAssign staff driver now.'),
   
  ('order_confirmed_customer', 
   (SELECT id FROM lookup_values WHERE code = 'sms' AND group_id = (SELECT id FROM lookup_groups WHERE group_key = 'notification_channel')),
   (SELECT id FROM lookup_values WHERE code = 'en' AND group_id = (SELECT id FROM lookup_groups WHERE group_key = 'language')),
   NULL,
   'Your order {{order_number}} is confirmed. Our rider will arrive in the scheduled slot: {{pickup_slot}}. Call support for queries.'),
   
  ('pickup_reminder_customer', 
   (SELECT id FROM lookup_values WHERE code = 'whatsapp' AND group_id = (SELECT id FROM lookup_groups WHERE group_key = 'notification_channel')),
   (SELECT id FROM lookup_values WHERE code = 'en' AND group_id = (SELECT id FROM lookup_groups WHERE group_key = 'language')),
   NULL,
   'Friendly reminder from Awais Dry Cleaner! Our rider is scheduled to collect your laundry today in the slot {{pickup_slot}}. Please keep your clothes ready!'),
   
  ('picked_up_customer', 
   (SELECT id FROM lookup_values WHERE code = 'email' AND group_id = (SELECT id FROM lookup_groups WHERE group_key = 'notification_channel')),
   (SELECT id FROM lookup_values WHERE code = 'en' AND group_id = (SELECT id FROM lookup_groups WHERE group_key = 'language')),
   'Laundry Collected - Order {{order_number}}',
   'Dear {{first_name}},\n\nWe have successfully collected your clothes for order {{order_number}}. They are being processed at our dry-cleaning facility.\n\nWe will notify you once they are clean and ready for delivery.'),
   
  ('ready_for_delivery_customer', 
   (SELECT id FROM lookup_values WHERE code = 'whatsapp' AND group_id = (SELECT id FROM lookup_groups WHERE group_key = 'notification_channel')),
   (SELECT id FROM lookup_values WHERE code = 'en' AND group_id = (SELECT id FROM lookup_groups WHERE group_key = 'language')),
   NULL,
   'Great news! Your clothes for order {{order_number}} are clean, packed, and ready. We will deliver them as scheduled on {{delivery_date}} ({{delivery_slot}}).'),
   
  ('delivered_customer', 
   (SELECT id FROM lookup_values WHERE code = 'sms' AND group_id = (SELECT id FROM lookup_groups WHERE group_key = 'notification_channel')),
   (SELECT id FROM lookup_values WHERE code = 'en' AND group_id = (SELECT id FROM lookup_groups WHERE group_key = 'language')),
   NULL,
   'Order {{order_number}} has been delivered. Thank you for your business. We appreciate your feedback!'),
   
  ('password_reset', 
   (SELECT id FROM lookup_values WHERE code = 'email' AND group_id = (SELECT id FROM lookup_groups WHERE group_key = 'notification_channel')),
   (SELECT id FROM lookup_values WHERE code = 'en' AND group_id = (SELECT id FROM lookup_groups WHERE group_key = 'language')),
   'Password Reset Request - Awais Dry Cleaner',
   'Hello,\n\nYou requested a password reset. Please click on the link below to set a new password:\n\n{{reset_link}}\n\nIf you did not request this, you can safely ignore this email.')
ON CONFLICT (code) DO UPDATE SET subject = EXCLUDED.subject, body = EXCLUDED.body;


-- 14. Seed area_slot_availability (link all time slots to all service areas for all days of the week)
INSERT INTO area_slot_availability (area_id, slot_id, day_of_week, is_available)
SELECT 
  a.id AS area_id,
  s.id AS slot_id,
  d.day AS day_of_week,
  true AS is_available
FROM service_areas a
CROSS JOIN time_slots s
CROSS JOIN (
  SELECT 0 AS day UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6
) d;

