# Laundry / Dry Cleaner App API Plan

Scope: build APIs for these screens only:

1. New Receipt
2. Select Items
3. Order Summary
4. Receipt Preview
5. Orders List

Excluded: Payment Screen APIs.

---

## 1. Data Models

### Customer

```ts
Customer {
  id: string
  name: string
  phone: string
  createdAt: Date
  updatedAt: Date
}
```

### Service Category

```ts
ServiceCategory {
  id: string
  name: string // Dry Clean, Wash, Iron, Alteration
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

### Item

```ts
Item {
  id: string
  name: string // Shirt, Pant, Coat, Suit, Dress, Bedsheet
  categoryId: string
  rate: number
  imageUrl?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

### Order

```ts
Order {
  id: string
  invoiceNo: string // INV-2025-000125
  customerId: string
  orderDate: Date
  deliveryDate: Date
  categoryId?: string
  subtotal: number
  discount: number
  taxRate: number
  taxAmount: number
  grandTotal: number
  notes?: string
  paymentStatus: 'paid' | 'partial' | 'unpaid'
  orderStatus: 'pending' | 'in_process' | 'ready' | 'delivered' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}
```

### Order Item

```ts
OrderItem {
  id: string
  orderId: string
  itemId: string
  itemName: string
  categoryName: string
  qty: number
  rate: number
  total: number
}
```

---

## 2. API Endpoints

Base path suggestion:

```txt
/api/v1
```

---

# A. New Receipt Screen APIs

## A1. Create Draft Order / Receipt

Used after entering customer details and pressing **Next: Add Items**.

```http
POST /api/v1/orders/draft
```

### Request

```json
{
  "customer_name": "Ali Khan",
  "phone": "03XX XXX XXXX",
  "order_date": "2025-05-21",
  "delivery_date": "2025-05-23",
  "category_id": "dry_clean"
}
```

### Validation

- `customer_name` required
- `phone` required
- `order_date` required
- `delivery_date` required
- `delivery_date` must be same day or after `order_date`
- `category_id` required if the UI requires category before item selection

### Response

```json
{
  "success": true,
  "data": {
    "order_id": "ord_123",
    "invoice_no": "INV-2025-000125",
    "customer": {
      "id": "cus_123",
      "name": "Ali Khan",
      "phone": "03XX XXX XXXX"
    },
    "order_date": "2025-05-21",
    "delivery_date": "2025-05-23",
    "category_id": "dry_clean",
    "status": "draft"
  }
}
```

---

## A2. Get Categories

Used by the category dropdown and item filter tabs.

```http
GET /api/v1/service-categories
```

### Response

```json
{
  "success": true,
  "data": [
    { "id": "dry_clean", "name": "Dry Clean" },
    { "id": "wash", "name": "Wash" },
    { "id": "iron", "name": "Iron" },
    { "id": "alteration", "name": "Alteration" }
  ]
}
```

---

# B. Select Items Screen APIs

## B1. Get Items

Used to load Shirt, Pant, Coat, Suit, Dress, Bedsheet etc.

```http
GET /api/v1/items?category_id=dry_clean&search=shirt
```

### Query Params

| Param | Required | Purpose |
|---|---:|---|
| `category_id` | No | Filter by service category |
| `search` | No | Search item name |
| `is_active` | No | Default true |

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "item_shirt",
      "name": "Shirt",
      "category_id": "dry_clean",
      "category_name": "Dry Clean",
      "rate": 150,
      "image_url": "/images/items/shirt.png"
    },
    {
      "id": "item_pant",
      "name": "Pant",
      "category_id": "dry_clean",
      "category_name": "Dry Clean",
      "rate": 200,
      "image_url": "/images/items/pant.png"
    }
  ]
}
```

---

## B2. Add / Update Order Items

Used when user changes plus/minus quantity and presses **Next: Summary**.

```http
PUT /api/v1/orders/{order_id}/items
```

### Request

```json
{
  "items": [
    { "item_id": "item_shirt", "qty": 2 },
    { "item_id": "item_pant", "qty": 1 },
    { "item_id": "item_suit", "qty": 1 }
  ]
}
```

### Rules

- Quantity `0` means remove item from order.
- Backend must calculate rate and total from item master table.
- Do not trust rate from frontend.
- Order must be in `draft` or editable state.

### Response

```json
{
  "success": true,
  "data": {
    "order_id": "ord_123",
    "items_count": 4,
    "subtotal": 1100,
    "items": [
      {
        "item_id": "item_shirt",
        "name": "Shirt",
        "category_name": "Dry Clean",
        "qty": 2,
        "rate": 150,
        "total": 300
      },
      {
        "item_id": "item_pant",
        "name": "Pant",
        "category_name": "Dry Clean",
        "qty": 1,
        "rate": 200,
        "total": 200
      },
      {
        "item_id": "item_suit",
        "name": "Suit",
        "category_name": "Dry Clean",
        "qty": 1,
        "rate": 600,
        "total": 600
      }
    ]
  }
}
```

---

# C. Order Summary Screen APIs

## C1. Get Order Summary

Used by the summary screen.

```http
GET /api/v1/orders/{order_id}/summary
```

### Response

```json
{
  "success": true,
  "data": {
    "order_id": "ord_123",
    "invoice_no": "INV-2025-000125",
    "customer": {
      "name": "Ali Khan",
      "phone": "03XX XXX XXXX"
    },
    "order_date": "2025-05-21",
    "delivery_date": "2025-05-23",
    "items": [
      { "name": "Shirt", "qty": 2, "rate": 150, "total": 300 },
      { "name": "Pant", "qty": 1, "rate": 200, "total": 200 },
      { "name": "Suit", "qty": 1, "rate": 600, "total": 600 }
    ],
    "subtotal": 1100,
    "discount": 50,
    "tax_rate": 5,
    "tax_amount": 52.5,
    "grand_total": 1102.5,
    "notes": ""
  }
}
```

---

## C2. Update Summary Adjustments

Used when saving notes, discount, or tax changes.

```http
PATCH /api/v1/orders/{order_id}/summary
```

### Request

```json
{
  "discount": 50,
  "tax_rate": 5,
  "notes": "Urgent delivery"
}
```

### Rules

- Backend recalculates `tax_amount` and `grand_total`.
- Discount cannot be greater than subtotal.
- Tax applies after discount unless your business rule says otherwise.

### Response

```json
{
  "success": true,
  "data": {
    "subtotal": 1100,
    "discount": 50,
    "tax_rate": 5,
    "tax_amount": 52.5,
    "grand_total": 1102.5,
    "notes": "Urgent delivery"
  }
}
```

---

## C3. Confirm Order

Used by **Proceed to Payment** button, but does not handle payment.

```http
POST /api/v1/orders/{order_id}/confirm
```

### Request

```json
{
  "notes": "Add notes if any"
}
```

### Rules

- Order must have at least one item.
- Generates final invoice number if not already generated.
- Sets order status to `pending` or `in_process` depending on your workflow.
- Payment is not processed here.

### Response

```json
{
  "success": true,
  "data": {
    "order_id": "ord_123",
    "invoice_no": "INV-2025-000125",
    "order_status": "pending",
    "payment_status": "unpaid",
    "grand_total": 1102.5
  }
}
```

---

# D. Receipt Preview APIs

## D1. Get Receipt Preview

Used by receipt preview screen.

```http
GET /api/v1/orders/{order_id}/receipt
```

### Response

```json
{
  "success": true,
  "data": {
    "business": {
      "name": "Clean & Fresh Dry Cleaners",
      "address": "Main Road, Gulberg, Lahore",
      "phone": "03XX XXX XXXX",
      "logo_url": "/images/logo.png"
    },
    "invoice_no": "INV-2025-000125",
    "order_date": "2025-05-21",
    "delivery_date": "2025-05-23",
    "customer": {
      "name": "Ali Khan",
      "phone": "03XX XXX XXXX"
    },
    "items": [
      { "name": "Shirt", "qty": 2, "rate": 150, "total": 300 },
      { "name": "Pant", "qty": 1, "rate": 200, "total": 200 },
      { "name": "Suit", "qty": 1, "rate": 600, "total": 600 }
    ],
    "subtotal": 1100,
    "discount": 50,
    "tax_rate": 5,
    "tax_amount": 52.5,
    "grand_total": 1102.5,
    "payment_method": null,
    "paid_amount": 0,
    "payment_status": "unpaid",
    "footer_message": "Thank you! Visit Again 💜"
  }
}
```

---

## D2. Download Receipt PDF

Used by **Download PDF**.

```http
GET /api/v1/orders/{order_id}/receipt/pdf
```

### Response

```json
{
  "success": true,
  "data": {
    "pdf_url": "https://your-domain.com/storage/receipts/INV-2025-000125.pdf"
  }
}
```

Alternative: return the PDF file directly with:

```http
Content-Type: application/pdf
```

---

## D3. Print Receipt Data

Used by **Print Receipt**. Frontend can use this to print through browser/native print.

```http
GET /api/v1/orders/{order_id}/receipt/print
```

### Response

```json
{
  "success": true,
  "data": {
    "print_html": "<html>...</html>",
    "printer_width": "80mm"
  }
}
```

---

## D4. WhatsApp Share Link

Used by **Share WhatsApp**.

```http
GET /api/v1/orders/{order_id}/receipt/whatsapp
```

### Response

```json
{
  "success": true,
  "data": {
    "phone": "923001234567",
    "message": "Clean & Fresh Receipt INV-2025-000125. Total: Rs. 1,102.50. PDF: https://your-domain.com/storage/receipts/INV-2025-000125.pdf",
    "whatsapp_url": "https://wa.me/923001234567?text=..."
  }
}
```

---

# E. Orders List APIs

## E1. Get Orders List

Used by Orders screen with tabs: Today, Pending, Ready, Delivered.

```http
GET /api/v1/orders?status=ready&date=today&search=ali&page=1&limit=20
```

### Query Params

| Param | Required | Purpose |
|---|---:|---|
| `status` | No | `pending`, `in_process`, `ready`, `delivered`, `cancelled` |
| `payment_status` | No | `paid`, `partial`, `unpaid` |
| `date` | No | `today`, `week`, `month` |
| `from_date` | No | Custom start date |
| `to_date` | No | Custom end date |
| `search` | No | Search invoice, customer, phone |
| `page` | No | Pagination |
| `limit` | No | Pagination |

### Response

```json
{
  "success": true,
  "data": [
    {
      "order_id": "ord_125",
      "invoice_no": "INV-2025-000125",
      "customer_name": "Ali Khan",
      "phone": "03XX XXX XXXX",
      "order_date": "2025-05-21",
      "delivery_date": "2025-05-23",
      "grand_total": 1102.5,
      "payment_status": "paid",
      "order_status": "ready"
    },
    {
      "order_id": "ord_124",
      "invoice_no": "INV-2025-000124",
      "customer_name": "Usman Butt",
      "phone": "03XX XXX XXXX",
      "order_date": "2025-05-21",
      "delivery_date": "2025-05-23",
      "grand_total": 780,
      "payment_status": "partial",
      "order_status": "in_process"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 4,
    "total_pages": 1
  }
}
```

---

## E2. Get Single Order Detail

Used when opening an order from list.

```http
GET /api/v1/orders/{order_id}
```

### Response

```json
{
  "success": true,
  "data": {
    "order_id": "ord_123",
    "invoice_no": "INV-2025-000125",
    "customer": {
      "id": "cus_123",
      "name": "Ali Khan",
      "phone": "03XX XXX XXXX"
    },
    "order_date": "2025-05-21",
    "delivery_date": "2025-05-23",
    "items": [
      { "name": "Shirt", "qty": 2, "rate": 150, "total": 300 },
      { "name": "Pant", "qty": 1, "rate": 200, "total": 200 },
      { "name": "Suit", "qty": 1, "rate": 600, "total": 600 }
    ],
    "subtotal": 1100,
    "discount": 50,
    "tax_rate": 5,
    "tax_amount": 52.5,
    "grand_total": 1102.5,
    "payment_status": "unpaid",
    "order_status": "pending",
    "notes": ""
  }
}
```

---

## E3. Update Order Status

Used when order moves from pending to ready or delivered.

```http
PATCH /api/v1/orders/{order_id}/status
```

### Request

```json
{
  "order_status": "ready"
}
```

### Allowed Transitions

```txt
pending -> in_process
in_process -> ready
ready -> delivered
pending -> cancelled
in_process -> cancelled
```

### Response

```json
{
  "success": true,
  "data": {
    "order_id": "ord_123",
    "order_status": "ready",
    "updated_at": "2025-05-21T10:30:00Z"
  }
}
```

---

## E4. Search Customers

Useful for customer lookup while creating a new receipt.

```http
GET /api/v1/customers?search=ali
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "cus_123",
      "name": "Ali Khan",
      "phone": "03XX XXX XXXX",
      "last_order_date": "2025-05-21"
    }
  ]
}
```

---

# 3. Recommended Backend Implementation Order

Build in this order. Do not jump around.

1. Create database tables: customers, service_categories, items, orders, order_items.
2. Seed default service categories.
3. Seed default item/rate master.
4. Build customer create/search logic.
5. Build draft order creation.
6. Build item listing and category filtering.
7. Build add/update order items API.
8. Build summary calculation API.
9. Build confirm order API.
10. Build receipt preview API.
11. Build PDF/print/WhatsApp endpoints.
12. Build orders list filters.
13. Build order status update.

---

# 4. Calculation Rules

Use backend calculation only.

```ts
subtotal = sum(orderItem.qty * orderItem.rate)
taxableAmount = subtotal - discount
taxAmount = taxableAmount * (taxRate / 100)
grandTotal = taxableAmount + taxAmount
```

Guardrails:

- `qty` cannot be negative.
- `discount` cannot be negative.
- `discount` cannot exceed subtotal.
- `tax_rate` cannot be negative.
- Round money to 2 decimals.

---

# 5. Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Delivery date cannot be before order date",
    "fields": {
      "delivery_date": "Must be same day or after order date"
    }
  }
}
```

Common codes:

```txt
VALIDATION_ERROR
ORDER_NOT_FOUND
CUSTOMER_NOT_FOUND
ITEM_NOT_FOUND
ORDER_NOT_EDITABLE
INVALID_STATUS_TRANSITION
```

---

# 6. Minimum Required Seed Data

```json
{
  "categories": [
    { "id": "dry_clean", "name": "Dry Clean" },
    { "id": "wash", "name": "Wash" },
    { "id": "iron", "name": "Iron" },
    { "id": "alteration", "name": "Alteration" }
  ],
  "items": [
    { "name": "Shirt", "category_id": "dry_clean", "rate": 150 },
    { "name": "Pant", "category_id": "dry_clean", "rate": 200 },
    { "name": "Coat", "category_id": "dry_clean", "rate": 500 },
    { "name": "Suit", "category_id": "dry_clean", "rate": 600 },
    { "name": "Dress", "category_id": "dry_clean", "rate": 450 },
    { "name": "Bedsheet", "category_id": "wash", "rate": 250 }
  ]
}
```

---

# 7. Notes For Coding Agent

Do not create payment-processing APIs from this file.

The only payment-related fields allowed here are read-only display fields:

```txt
payment_status
payment_method
paid_amount
remaining_amount
```

Actual payment creation/update should be handled separately later.

For now, `confirm order` can leave `payment_status = unpaid` unless your existing project already has payment logic.
