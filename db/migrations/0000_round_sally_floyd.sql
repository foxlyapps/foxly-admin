-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "shops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_domain" varchar(255) NOT NULL,
	"access_token" text NOT NULL,
	"scope" text,
	"installed_at" timestamp with time zone DEFAULT now(),
	"uninstalled_at" timestamp with time zone,
	CONSTRAINT "shops_shop_domain_unique" UNIQUE("shop_domain")
);
--> statement-breakpoint
ALTER TABLE "shops" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "customers" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"shop_domain" text NOT NULL,
	"phone" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"state" text,
	"city" text,
	"zipcode" text,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "customers_shop_phone_unique" UNIQUE("shop_domain","phone")
);
--> statement-breakpoint
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "integration_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_domain" varchar(255) NOT NULL,
	"integration_id" varchar(100) NOT NULL,
	"enabled" boolean DEFAULT false,
	"connected" boolean DEFAULT false,
	"connected_email" varchar(255),
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp with time zone,
	"config" jsonb DEFAULT '{}'::jsonb,
	"connected_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "integration_settings_unique" UNIQUE("shop_domain","integration_id")
);
--> statement-breakpoint
ALTER TABLE "integration_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "upsell_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_domain" text NOT NULL,
	"type" text DEFAULT 'click_upsell' NOT NULL,
	"campaign_name" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true,
	"upsell_mode" text DEFAULT 'post_purchase',
	"show_condition_type" text DEFAULT 'always',
	"trigger_product_ids" jsonb DEFAULT '[]'::jsonb,
	"min_order_value" numeric DEFAULT '0',
	"max_order_value" numeric DEFAULT '0',
	"offers" jsonb DEFAULT '[]'::jsonb,
	"design" jsonb DEFAULT '{}'::jsonb,
	"linked_downsell_id" uuid,
	"display_location" text DEFAULT 'in_form',
	"checkbox_default_checked" boolean DEFAULT false,
	"priority" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"form_close_count" integer DEFAULT 1
);
--> statement-breakpoint
ALTER TABLE "upsell_offers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "quantity_offer_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_domain" varchar(255) NOT NULL,
	"name" varchar(255) DEFAULT 'New Quantity Offer' NOT NULL,
	"active" boolean DEFAULT false,
	"product_ids" jsonb DEFAULT '[]'::jsonb,
	"offers" jsonb DEFAULT '[]'::jsonb,
	"design" jsonb DEFAULT '{}'::jsonb,
	"placement" varchar(50) DEFAULT 'inside_form',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "quantity_offer_groups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "shipping_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_domain" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric DEFAULT '0' NOT NULL,
	"condition_type" text DEFAULT 'none',
	"min_value" numeric,
	"max_value" numeric,
	"applies_to_products" boolean DEFAULT false,
	"product_ids" text[] DEFAULT '{""}',
	"applies_to_countries" boolean DEFAULT false,
	"country_codes" text[] DEFAULT '{""}',
	"applies_to_states" boolean DEFAULT false,
	"state_codes" text[] DEFAULT '{""}',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"applies_to_collections" boolean DEFAULT false,
	"collection_ids" text[] DEFAULT '{""}'
);
--> statement-breakpoint
ALTER TABLE "shipping_rates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "form_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_domain" varchar(255) NOT NULL,
	"enabled" boolean DEFAULT false,
	"button_text" varchar(100) DEFAULT 'Order Now (COD)',
	"primary_color" varchar(7) DEFAULT '#000000',
	"required_fields" jsonb DEFAULT '["name","phone","address"]'::jsonb,
	"max_quantity" integer DEFAULT 10,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"button_style" text DEFAULT 'solid',
	"button_size" text DEFAULT 'large',
	"button_position" text DEFAULT 'below_atc',
	"form_title" text DEFAULT 'Cash on Delivery Order',
	"form_subtitle" text DEFAULT 'Fill in your details to place a COD order',
	"success_message" text DEFAULT 'Your order has been placed! We will contact you shortly.',
	"submit_button_text" text DEFAULT 'Place COD Order',
	"show_product_image" boolean DEFAULT true,
	"show_price" boolean DEFAULT true,
	"show_quantity_selector" boolean DEFAULT true,
	"show_email_field" boolean DEFAULT false,
	"show_notes_field" boolean DEFAULT false,
	"email_required" boolean DEFAULT false,
	"name_placeholder" text DEFAULT 'Enter your full name',
	"phone_placeholder" text DEFAULT 'Enter your phone number',
	"address_placeholder" text DEFAULT 'Enter your delivery address',
	"notes_placeholder" text DEFAULT 'Any special instructions?',
	"modal_style" text DEFAULT 'modern',
	"animation_style" text DEFAULT 'fade',
	"border_radius" integer DEFAULT 12,
	"form_background_color" varchar(20) DEFAULT '#ffffff',
	"field_background_color" varchar(20) DEFAULT '#f9fafb',
	"label_color" varchar(20) DEFAULT '#374151',
	"base_font_size" integer DEFAULT 14,
	"field_order" jsonb DEFAULT '["name","phone","address","email","notes"]'::jsonb,
	"input_text_color" varchar(7) DEFAULT '#111827',
	"label_font_size" varchar(20) DEFAULT 'medium',
	"input_font_size" varchar(20) DEFAULT 'medium',
	"title_font_size" varchar(20) DEFAULT 'large',
	"form_type" varchar(20) DEFAULT 'popup',
	"button_subtitle" text,
	"button_text_color" varchar(7) DEFAULT '#ffffff',
	"button_text_size" integer DEFAULT 16,
	"button_text_bold" boolean DEFAULT true,
	"button_text_italic" boolean DEFAULT false,
	"button_border_color" varchar(7) DEFAULT '#ffffff',
	"button_border_width" integer DEFAULT 0,
	"button_border_radius" integer DEFAULT 8,
	"button_shadow" integer DEFAULT 0,
	"button_animation" varchar(20) DEFAULT 'none',
	"form_text_color" varchar(7) DEFAULT '#000000',
	"form_text_size" integer DEFAULT 16,
	"form_text_bold" boolean DEFAULT false,
	"form_text_italic" boolean DEFAULT false,
	"form_label_alignment" varchar(10) DEFAULT 'left',
	"form_border_color" varchar(7) DEFAULT '#000000',
	"form_border_width" integer DEFAULT 0,
	"form_border_radius" integer DEFAULT 8,
	"form_shadow" integer DEFAULT 0,
	"form_icon_color" varchar(7) DEFAULT '#212529',
	"form_icon_background" varchar(7) DEFAULT '#e1e1e1',
	"hide_field_labels" boolean DEFAULT false,
	"allowed_countries" jsonb DEFAULT '[]'::jsonb,
	"fields" jsonb DEFAULT '[{"id":"name","type":"text","label":"Full Name","order":1,"visible":true,"required":true},{"id":"phone","type":"tel","label":"Phone Number","order":2,"visible":true,"required":true},{"id":"address","type":"textarea","label":"Address","order":3,"visible":true,"required":true},{"id":"zip","type":"text","label":"ZIP Code","order":4,"visible":false,"required":false},{"id":"state","type":"text","label":"State","order":5,"visible":false,"required":false},{"id":"city","type":"text","label":"City","order":6,"visible":false,"required":false},{"id":"email","type":"email","label":"Email","order":7,"visible":false,"required":false},{"id":"notes","type":"textarea","label":"Notes","order":8,"visible":false,"required":false},{"id":"quantity","type":"number","label":"Quantity","order":9,"visible":true,"required":false},{"id":"marketing","type":"checkbox","label":"Buyer accepts marketing","order":10,"visible":false,"required":false}]'::jsonb,
	"blocks" jsonb DEFAULT '{"order_summary":true,"buyer_marketing":false,"shipping_options":false,"cart_quantity_offers":false}'::jsonb,
	"custom_fields" jsonb DEFAULT '[]'::jsonb,
	"styles" jsonb DEFAULT '{"shadow":true,"iconColor":"#6366f1","textColor":"#333333","borderRadius":12,"iconBackground":"#f3f4f6","labelAlignment":"left","backgroundColor":"#ffffff"}'::jsonb,
	"button_styles" jsonb DEFAULT '{"shadow":true,"animation":"none","textColor":"#ffffff","borderColor":"#6366f1","borderWidth":0,"borderRadius":12,"backgroundColor":"#6366f1"}'::jsonb,
	"shipping_options" jsonb DEFAULT '{"enabled":false,"options":[{"id":"free_shipping","label":"Free Shipping","price":0},{"id":"standard","label":"Standard Shipping","price":50},{"id":"express","label":"Express Shipping","price":100}],"defaultOption":"free_shipping"}'::jsonb,
	"partial_cod_enabled" boolean DEFAULT false,
	"partial_cod_advance_amount" integer DEFAULT 100,
	"partial_cod_commission" numeric(10, 2) DEFAULT '0',
	"shipping_rates_enabled" boolean DEFAULT false,
	"form_submit_button" jsonb,
	"enable_coupon_field" boolean DEFAULT false,
	"coupon_field_position" integer DEFAULT 13,
	"coupons" jsonb DEFAULT '[]'::jsonb,
	CONSTRAINT "form_settings_shop_domain_unique" UNIQUE("shop_domain")
);
--> statement-breakpoint
ALTER TABLE "form_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "pixel_tracking_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_domain" text NOT NULL,
	"provider" text NOT NULL,
	"label" text,
	"pixel_id" text,
	"access_token" text,
	"conversion_api_token" text,
	"track_initiate_checkout" boolean DEFAULT true,
	"track_purchase" boolean DEFAULT true,
	"track_add_to_cart" boolean DEFAULT false,
	"track_view_content" boolean DEFAULT false,
	"track_add_payment_info" boolean DEFAULT false,
	"enabled" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fraud_protection_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_domain" text NOT NULL,
	"limit_orders_enabled" boolean DEFAULT false,
	"max_orders" integer,
	"limit_hours" integer,
	"limit_quantity_enabled" boolean DEFAULT false,
	"max_quantity" integer,
	"blocked_phone_numbers" text[] DEFAULT '{""}',
	"blocked_emails" text[] DEFAULT '{""}',
	"blocked_ip_addresses" text[] DEFAULT '{""}',
	"allowed_ip_addresses" text[] DEFAULT '{""}',
	"postal_code_mode" text DEFAULT 'none',
	"postal_codes" text[] DEFAULT '{""}',
	"blocked_message" text DEFAULT 'Sorry, you are not allowed to place orders.',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "fraud_protection_settings_shop_domain_key" UNIQUE("shop_domain")
);
--> statement-breakpoint
CREATE TABLE "shopify_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"shop" text NOT NULL,
	"state" text,
	"is_online" boolean DEFAULT false,
	"scope" text,
	"access_token" text,
	"expires_at" timestamp with time zone,
	"online_access_info" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"refresh_token" text,
	"refresh_token_expires" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "order_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_domain" varchar(255) NOT NULL,
	"shopify_order_id" varchar(255),
	"shopify_order_name" varchar(255),
	"customer_name" varchar(255),
	"customer_phone" varchar(50),
	"customer_address" text,
	"product_id" varchar(255),
	"product_title" varchar(255),
	"variant_id" varchar(255),
	"quantity" integer DEFAULT 1,
	"total_price" numeric(10, 2),
	"currency" varchar(10) NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now(),
	"customer_email" varchar(255),
	"customer_notes" text,
	"city" text,
	"state" text,
	"pincode" text,
	"is_partial_cod" boolean DEFAULT false,
	"advance_amount" numeric(10, 2),
	"remaining_cod_amount" numeric(10, 2),
	"shipping_label" varchar(255),
	"shipping_price" numeric(10, 2) DEFAULT '0',
	"sync_status" text DEFAULT 'pending_sync',
	"sync_attempts" integer DEFAULT 0,
	"sync_error" text,
	"last_synced_at" timestamp with time zone,
	"next_retry_at" timestamp with time zone,
	"order_payload" jsonb,
	"coupon_code" varchar(100),
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"original_total" numeric(10, 2),
	"final_total" numeric(10, 2),
	"is_full_prepaid" boolean DEFAULT false,
	"payment_method" text DEFAULT 'cod'
);
--> statement-breakpoint
ALTER TABLE "order_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "partial_payment_settings" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"shop_domain" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"payment_options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cod_fee_enabled" boolean DEFAULT false NOT NULL,
	"cod_fee_name" text DEFAULT 'COD Fee' NOT NULL,
	"cod_fee_type" text DEFAULT 'fixed' NOT NULL,
	"cod_fee_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"minimum_order_total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"maximum_order_total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"allowed_product_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"allowed_collection_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"allowed_countries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"excluded_countries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"modal_settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"module_flags" jsonb DEFAULT '{"apply_coupons_to_partial":true,"apply_upsells_to_partial":true,"apply_bundle_discounts_to_partial":true}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"full_prepaid_enabled" boolean DEFAULT false,
	"full_prepaid_minimum_order_total" numeric DEFAULT '0',
	"full_prepaid_maximum_order_total" numeric DEFAULT '0',
	"full_prepaid_allowed_product_ids" jsonb DEFAULT '[]'::jsonb,
	"full_prepaid_allowed_collection_ids" jsonb DEFAULT '[]'::jsonb,
	"prepaid_discount_enabled" boolean DEFAULT false,
	"prepaid_discount_type" text DEFAULT 'percentage',
	"prepaid_discount_value" numeric(10, 2) DEFAULT '0',
	"pure_cod_enabled" boolean DEFAULT false,
	"pure_cod_fee_enabled" boolean DEFAULT false,
	"pure_cod_fee_name" text DEFAULT 'COD Fee',
	"pure_cod_fee_type" text DEFAULT 'fixed',
	"pure_cod_fee_amount" numeric DEFAULT '0',
	"pure_cod_minimum_order_total" numeric DEFAULT '0',
	"pure_cod_maximum_order_total" numeric DEFAULT '0',
	"pure_cod_allowed_product_ids" jsonb DEFAULT '[]'::jsonb,
	"pure_cod_allowed_collection_ids" jsonb DEFAULT '[]'::jsonb,
	"country_restrictions" jsonb DEFAULT '{"full_cod":{"allowedCountries":[],"excludedCountries":[]},"full_prepaid":{"allowedCountries":[],"excludedCountries":[]},"partial_payment":{"allowedCountries":[],"excludedCountries":[]}}'::jsonb,
	CONSTRAINT "partial_payment_settings_shop_domain_key" UNIQUE("shop_domain")
);
--> statement-breakpoint
ALTER TABLE "integration_settings" ADD CONSTRAINT "fk_integration_settings_shop" FOREIGN KEY ("shop_domain") REFERENCES "public"."shops"("shop_domain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quantity_offer_groups" ADD CONSTRAINT "fk_quantity_offers_shop" FOREIGN KEY ("shop_domain") REFERENCES "public"."shops"("shop_domain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_settings" ADD CONSTRAINT "fk_form_settings_shop" FOREIGN KEY ("shop_domain") REFERENCES "public"."shops"("shop_domain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_logs" ADD CONSTRAINT "fk_order_logs_shop" FOREIGN KEY ("shop_domain") REFERENCES "public"."shops"("shop_domain") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_shops_domain" ON "shops" USING btree ("shop_domain" text_ops);--> statement-breakpoint
CREATE INDEX "idx_customers_shop_phone" ON "customers" USING btree ("shop_domain" text_ops,"phone" text_ops);--> statement-breakpoint
CREATE INDEX "idx_customers_updated_at" ON "customers" USING btree ("updated_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_integration_settings_enabled" ON "integration_settings" USING btree ("enabled" bool_ops) WHERE (enabled = true);--> statement-breakpoint
CREATE INDEX "idx_integration_settings_integration" ON "integration_settings" USING btree ("integration_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_integration_settings_shop" ON "integration_settings" USING btree ("shop_domain" text_ops);--> statement-breakpoint
CREATE INDEX "idx_upsell_offers_active" ON "upsell_offers" USING btree ("shop_domain" text_ops,"active" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_upsell_offers_shop" ON "upsell_offers" USING btree ("shop_domain" text_ops);--> statement-breakpoint
CREATE INDEX "idx_upsell_offers_type" ON "upsell_offers" USING btree ("shop_domain" text_ops,"type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_quantity_offers_active" ON "quantity_offer_groups" USING btree ("active" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_quantity_offers_products" ON "quantity_offer_groups" USING gin ("product_ids" jsonb_ops);--> statement-breakpoint
CREATE INDEX "idx_quantity_offers_shop" ON "quantity_offer_groups" USING btree ("shop_domain" text_ops);--> statement-breakpoint
CREATE INDEX "idx_quantity_offers_updated" ON "quantity_offer_groups" USING btree ("updated_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_shipping_rates_active" ON "shipping_rates" USING btree ("shop_domain" text_ops,"is_active" text_ops);--> statement-breakpoint
CREATE INDEX "idx_shipping_rates_shop" ON "shipping_rates" USING btree ("shop_domain" text_ops);--> statement-breakpoint
CREATE INDEX "idx_form_settings_shop" ON "form_settings" USING btree ("shop_domain" text_ops);--> statement-breakpoint
CREATE INDEX "pixel_tracking_shop_domain_idx" ON "pixel_tracking_settings" USING btree ("shop_domain" text_ops);--> statement-breakpoint
CREATE INDEX "fraud_protection_shop_domain_idx" ON "fraud_protection_settings" USING btree ("shop_domain" text_ops);--> statement-breakpoint
CREATE INDEX "idx_shopify_sessions_shop" ON "shopify_sessions" USING btree ("shop" text_ops);--> statement-breakpoint
CREATE INDEX "idx_order_logs_coupon_code" ON "order_logs" USING btree ("shop_domain" text_ops,"coupon_code" text_ops);--> statement-breakpoint
CREATE INDEX "idx_order_logs_created" ON "order_logs" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_order_logs_partial_cod" ON "order_logs" USING btree ("is_partial_cod" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_order_logs_payment_method" ON "order_logs" USING btree ("shop_domain" text_ops,"payment_method" text_ops);--> statement-breakpoint
CREATE INDEX "idx_order_logs_shop" ON "order_logs" USING btree ("shop_domain" text_ops);--> statement-breakpoint
CREATE INDEX "idx_order_logs_status" ON "order_logs" USING btree ("status" text_ops);--> statement-breakpoint
CREATE POLICY "Service role has full access to shops" ON "shops" AS PERMISSIVE FOR ALL TO public USING ((auth.role() = 'service_role'::text));--> statement-breakpoint
CREATE POLICY "Allow all operations on customers" ON "customers" AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Service role has full access to integration_settings" ON "integration_settings" AS PERMISSIVE FOR ALL TO public USING ((auth.role() = 'service_role'::text));--> statement-breakpoint
CREATE POLICY "upsell_offers_delete" ON "upsell_offers" AS PERMISSIVE FOR DELETE TO public USING (true);--> statement-breakpoint
CREATE POLICY "upsell_offers_insert" ON "upsell_offers" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "upsell_offers_select" ON "upsell_offers" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "upsell_offers_update" ON "upsell_offers" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Service role has full access to quantity_offer_groups" ON "quantity_offer_groups" AS PERMISSIVE FOR ALL TO public USING ((auth.role() = 'service_role'::text));--> statement-breakpoint
CREATE POLICY "shop_shipping_rates_delete" ON "shipping_rates" AS PERMISSIVE FOR DELETE TO public USING ((shop_domain = current_setting('request.jwt.claims.shop_domain'::text, true)));--> statement-breakpoint
CREATE POLICY "shop_shipping_rates_insert" ON "shipping_rates" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "shop_shipping_rates_select" ON "shipping_rates" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "shop_shipping_rates_update" ON "shipping_rates" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Service role has full access to form_settings" ON "form_settings" AS PERMISSIVE FOR ALL TO public USING ((auth.role() = 'service_role'::text));--> statement-breakpoint
CREATE POLICY "Allow update for all" ON "order_logs" AS PERMISSIVE FOR UPDATE TO public USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Service role has full access to order_logs" ON "order_logs" AS PERMISSIVE FOR ALL TO public;
*/