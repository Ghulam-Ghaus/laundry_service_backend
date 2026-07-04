-- Migration: 0001_init_schema.sql
-- Description: Initialize database schema for Awais Dry Cleaner platform

-- Enable pgcrypto extension for gen_random_uuid() if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. roles table
CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NULL,
  is_system boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  created_by uuid NULL,
  updated_by uuid NULL,
  deleted_by uuid NULL,
  is_deleted boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_version integer NOT NULL DEFAULT 1
);

-- 2. permissions table
CREATE TABLE permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  resource text NOT NULL,
  action text NOT NULL,
  description text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  created_by uuid NULL,
  updated_by uuid NULL,
  deleted_by uuid NULL,
  is_deleted boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_version integer NOT NULL DEFAULT 1
);

-- 3. role_permissions table
CREATE TABLE role_permissions (
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL,
  PRIMARY KEY (role_id, permission_id)
);

-- 4. lookup_groups table
CREATE TABLE lookup_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  created_by uuid NULL,
  updated_by uuid NULL,
  deleted_by uuid NULL,
  is_deleted boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_version integer NOT NULL DEFAULT 1
);

-- 5. lookup_values table
CREATE TABLE lookup_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES lookup_groups(id) ON DELETE CASCADE,
  code text NOT NULL,
  label text NOT NULL,
  description text NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  created_by uuid NULL,
  updated_by uuid NULL,
  deleted_by uuid NULL,
  is_deleted boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_version integer NOT NULL DEFAULT 1,
  UNIQUE(group_id, code)
);

-- 6. app_users table
CREATE TABLE app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE NULL,
  email text UNIQUE NOT NULL,
  phone text UNIQUE NULL,
  first_name text NOT NULL,
  last_name text NULL,
  display_name text NULL,
  avatar_url text NULL,
  preferred_language_id uuid NULL REFERENCES lookup_values(id),
  default_role_id uuid NULL REFERENCES roles(id),
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  created_by uuid NULL,
  updated_by uuid NULL,
  deleted_by uuid NULL,
  is_deleted boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_version integer NOT NULL DEFAULT 1
);

-- 7. user_roles table (cross-reference table)
CREATE TABLE user_roles (
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL,
  PRIMARY KEY (user_id, role_id)
);

-- 8. service_categories table
CREATE TABLE service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NULL,
  icon_key text NULL,
  image_url text NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  created_by uuid NULL REFERENCES app_users(id),
  updated_by uuid NULL REFERENCES app_users(id),
  deleted_by uuid NULL REFERENCES app_users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_version integer NOT NULL DEFAULT 1
);

-- 9. catalog_items table
CREATE TABLE catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NULL,
  icon_key text NULL,
  image_url text NULL,
  unit_label text NOT NULL DEFAULT 'item',
  min_quantity integer NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  created_by uuid NULL REFERENCES app_users(id),
  updated_by uuid NULL REFERENCES app_users(id),
  deleted_by uuid NULL REFERENCES app_users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_version integer NOT NULL DEFAULT 1
);

-- 10. service_options table
CREATE TABLE service_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  created_by uuid NULL REFERENCES app_users(id),
  updated_by uuid NULL REFERENCES app_users(id),
  deleted_by uuid NULL REFERENCES app_users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_version integer NOT NULL DEFAULT 1
);

-- 11. item_prices table
CREATE TABLE item_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  service_option_id uuid NOT NULL REFERENCES service_options(id) ON DELETE CASCADE,
  currency_code text NOT NULL DEFAULT 'PKR',
  price numeric(12,2) NOT NULL,
  compare_at_price numeric(12,2) NULL,
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  created_by uuid NULL REFERENCES app_users(id),
  updated_by uuid NULL REFERENCES app_users(id),
  deleted_by uuid NULL REFERENCES app_users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_version integer NOT NULL DEFAULT 1
);

-- 12. service_areas table
CREATE TABLE service_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  city text NOT NULL,
  province text NULL,
  country text NOT NULL DEFAULT 'Pakistan',
  is_serviceable boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  created_by uuid NULL REFERENCES app_users(id),
  updated_by uuid NULL REFERENCES app_users(id),
  deleted_by uuid NULL REFERENCES app_users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_version integer NOT NULL DEFAULT 1
);

-- 13. customer_addresses table
CREATE TABLE customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  area_id uuid NULL REFERENCES service_areas(id) ON DELETE SET NULL,
  address_type_id uuid NULL REFERENCES lookup_values(id) ON DELETE SET NULL,
  address_line_1 text NOT NULL,
  address_line_2 text NULL,
  city text NOT NULL,
  latitude numeric(10,7) NULL,
  longitude numeric(10,7) NULL,
  instructions text NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  created_by uuid NULL REFERENCES app_users(id),
  updated_by uuid NULL REFERENCES app_users(id),
  deleted_by uuid NULL REFERENCES app_users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_version integer NOT NULL DEFAULT 1
);

-- 14. time_slots table
CREATE TABLE time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_type_id uuid NOT NULL REFERENCES lookup_values(id) ON DELETE CASCADE,
  label text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  capacity integer NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  created_by uuid NULL REFERENCES app_users(id),
  updated_by uuid NULL REFERENCES app_users(id),
  deleted_by uuid NULL REFERENCES app_users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_version integer NOT NULL DEFAULT 1
);

-- 15. area_slot_availability table
CREATE TABLE area_slot_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id uuid NOT NULL REFERENCES service_areas(id) ON DELETE CASCADE,
  slot_id uuid NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_available boolean NOT NULL DEFAULT true,
  capacity_override integer NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  created_by uuid NULL REFERENCES app_users(id),
  updated_by uuid NULL REFERENCES app_users(id),
  deleted_by uuid NULL REFERENCES app_users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_version integer NOT NULL DEFAULT 1
);

-- 16. orders table
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_id uuid NULL REFERENCES app_users(id) ON DELETE SET NULL,
  customer_address_id uuid NULL REFERENCES customer_addresses(id) ON DELETE SET NULL,
  status_id uuid NOT NULL REFERENCES lookup_values(id),
  frequency_id uuid NULL REFERENCES lookup_values(id),
  pickup_date date NULL,
  pickup_slot_id uuid NULL REFERENCES time_slots(id) ON DELETE SET NULL,
  delivery_date date NULL,
  delivery_slot_id uuid NULL REFERENCES time_slots(id) ON DELETE SET NULL,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  service_fee numeric(12,2) NOT NULL DEFAULT 0,
  discount_total numeric(12,2) NOT NULL DEFAULT 0,
  grand_total numeric(12,2) NOT NULL DEFAULT 0,
  currency_code text NOT NULL DEFAULT 'PKR',
  special_instructions text NULL,
  is_item_selection_skipped boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  created_by uuid NULL REFERENCES app_users(id),
  updated_by uuid NULL REFERENCES app_users(id),
  deleted_by uuid NULL REFERENCES app_users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_version integer NOT NULL DEFAULT 1
);

-- 17. order_items table
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES catalog_items(id),
  service_option_id uuid NOT NULL REFERENCES service_options(id),
  status_id uuid NULL REFERENCES lookup_values(id),
  item_name_snapshot text NOT NULL,
  service_name_snapshot text NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric(12,2) NOT NULL,
  line_total numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  created_by uuid NULL REFERENCES app_users(id),
  updated_by uuid NULL REFERENCES app_users(id),
  deleted_by uuid NULL REFERENCES app_users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_version integer NOT NULL DEFAULT 1
);

-- 18. order_status_history table
CREATE TABLE order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status_id uuid NULL REFERENCES lookup_values(id),
  to_status_id uuid NOT NULL REFERENCES lookup_values(id),
  changed_by uuid NULL REFERENCES app_users(id) ON DELETE SET NULL,
  note text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- 19. staff_tasks table
CREATE TABLE staff_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  assigned_to_user_id uuid NULL REFERENCES app_users(id) ON DELETE SET NULL,
  task_type_id uuid NOT NULL REFERENCES lookup_values(id),
  status_id uuid NOT NULL REFERENCES lookup_values(id),
  scheduled_date date NULL,
  slot_id uuid NULL REFERENCES time_slots(id) ON DELETE SET NULL,
  started_at timestamptz NULL,
  completed_at timestamptz NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  created_by uuid NULL REFERENCES app_users(id),
  updated_by uuid NULL REFERENCES app_users(id),
  deleted_by uuid NULL REFERENCES app_users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_version integer NOT NULL DEFAULT 1
);

-- 20. discounts table
CREATE TABLE discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  discount_type_id uuid NOT NULL REFERENCES lookup_values(id),
  value numeric(12,2) NOT NULL,
  max_discount_amount numeric(12,2) NULL,
  min_order_amount numeric(12,2) NULL,
  usage_limit integer NULL,
  used_count integer NOT NULL DEFAULT 0,
  starts_at timestamptz NULL,
  ends_at timestamptz NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  created_by uuid NULL REFERENCES app_users(id),
  updated_by uuid NULL REFERENCES app_users(id),
  deleted_by uuid NULL REFERENCES app_users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_version integer NOT NULL DEFAULT 1
);

-- 21. payments table
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_method_id uuid NOT NULL REFERENCES lookup_values(id),
  payment_status_id uuid NOT NULL REFERENCES lookup_values(id),
  amount numeric(12,2) NOT NULL,
  currency_code text NOT NULL DEFAULT 'PKR',
  provider text NULL,
  provider_reference text NULL,
  paid_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  created_by uuid NULL REFERENCES app_users(id),
  updated_by uuid NULL REFERENCES app_users(id),
  deleted_by uuid NULL REFERENCES app_users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_version integer NOT NULL DEFAULT 1
);

-- 22. notification_templates table
CREATE TABLE notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  channel_id uuid NOT NULL REFERENCES lookup_values(id),
  language_id uuid NULL REFERENCES lookup_values(id),
  subject text NULL,
  body text NOT NULL,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  created_by uuid NULL REFERENCES app_users(id),
  updated_by uuid NULL REFERENCES app_users(id),
  deleted_by uuid NULL REFERENCES app_users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_version integer NOT NULL DEFAULT 1
);

-- 23. notification_logs table
CREATE TABLE notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NULL REFERENCES notification_templates(id) ON DELETE SET NULL,
  user_id uuid NULL REFERENCES app_users(id) ON DELETE SET NULL,
  order_id uuid NULL REFERENCES orders(id) ON DELETE SET NULL,
  channel_id uuid NOT NULL REFERENCES lookup_values(id),
  status_id uuid NOT NULL REFERENCES lookup_values(id),
  recipient text NOT NULL,
  subject text NULL,
  body text NOT NULL,
  provider text NULL,
  provider_reference text NULL,
  error_message text NULL,
  sent_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- 24. audit_logs table
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NULL REFERENCES app_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_name text NOT NULL,
  entity_id uuid NULL,
  old_values jsonb NULL,
  new_values jsonb NULL,
  request_id text NULL,
  ip_address text NULL,
  user_agent text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- 25. system_settings table
CREATE TABLE system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  description text NULL,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  created_by uuid NULL REFERENCES app_users(id),
  updated_by uuid NULL REFERENCES app_users(id),
  deleted_by uuid NULL REFERENCES app_users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_version integer NOT NULL DEFAULT 1
);

-- Indexes
CREATE INDEX idx_app_users_email ON app_users(email) WHERE is_deleted = false;
CREATE INDEX idx_orders_customer_id ON orders(customer_id) WHERE is_deleted = false;
CREATE INDEX idx_orders_status_id ON orders(status_id) WHERE is_deleted = false;
CREATE INDEX idx_orders_pickup_date ON orders(pickup_date) WHERE is_deleted = false;
CREATE INDEX idx_order_items_order_id ON order_items(order_id) WHERE is_deleted = false;
CREATE INDEX idx_staff_tasks_assigned_to ON staff_tasks(assigned_to_user_id) WHERE is_deleted = false;
CREATE INDEX idx_lookup_values_group_id ON lookup_values(group_id) WHERE is_deleted = false;
