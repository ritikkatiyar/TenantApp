# Database Schema

## Tables

### `user_tbl`
- Stores identity records for application users.
- Fields: `id`, `auth_uid`, `full_name`, `phone_number`, `password_hash`, `role`, `created_at`, `updated_at`.

### `property_tbl`
- Stores property metadata and owner relationships.
- Fields: `id`, `owner_id`, `name`, `address`, `city`, `landmark`, `created_at`, `updated_at`.
- `owner_id` references `user_tbl.id`.

### `user_property_role_tbl`
- Stores explicit role assignments for users on properties.
- Fields: `id`, `user_id`, `property_id`, `role`, `assigned_by`, `created_at`, `updated_at`.
- `user_id` references `user_tbl.id`.
- `property_id` references `property_tbl.id`.
- `assigned_by` references `user_tbl.id`.

### `unit_tbl`
- Stores units within properties.
- Fields: `id`, `property_id`, `unit_number`, `floor`, `type`, `capacity`, `facing`, `created_at`, `updated_at`.
- `property_id` references `property_tbl.id`.
- Unique constraint: `property_id + unit_number`.

### `lease_tbl`
- Stores leases for users occupying units.
- Fields: `id`, `user_id`, `unit_id`, `rent_amount`, `move_in_date`, `move_out_date`, `status`, `created_at`, `updated_at`.
- `user_id` references `user_tbl.id`.
- `unit_id` references `unit_tbl.id`.

### `rent_cycle_tbl`
- Stores rent cycle records for a lease.
- Fields: `id`, `lease_id`, `month`, `amount`, `due_date`, `status`, `paid_at`, `created_at`, `updated_at`.
- `lease_id` references `lease_tbl.id`.

### `refreshtoken_tbl`
- Stores refresh token records for user sessions.
- Fields: `id`, `user_id`, `token_hash`, `expires_at`, `revoked`, `created_at`, `updated_at`.
- `user_id` references `user_tbl.id`.

## Relationships

- A `user_tbl` row may own many `property_tbl` rows.
- A `property_tbl` row may contain many `unit_tbl` rows.
- A `user_tbl` row may hold many `lease_tbl` rows.
- A `unit_tbl` row may be leased by at most one `lease_tbl` row at a time.
- A `lease_tbl` row may have many `rent_cycle_tbl` rows.
- `user_property_role_tbl` assigns users to properties with a specific role.
