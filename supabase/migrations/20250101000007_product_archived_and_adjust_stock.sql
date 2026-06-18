-- 0007: soft-delete for products + atomic retail stock adjustment RPC

-- Soft-delete flag: archived products are hidden from all UIs but kept for history
ALTER TABLE product ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

-- retail_adjust_stock: atomically updates inventory.qty_on_hand and inserts
-- an inventory_movement ledger entry in a single transaction.
CREATE OR REPLACE FUNCTION retail_adjust_stock(
  p_product_id   uuid,
  p_qty_delta    integer,
  p_kind         inventory_movement_kind DEFAULT 'adjustment',
  p_note         text                    DEFAULT NULL,
  p_reference_id uuid                    DEFAULT NULL
)
RETURNS inventory_movement
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inventory_id uuid;
  v_qty_after    integer;
  v_movement     inventory_movement;
BEGIN
  -- Lock the row and apply the delta in one shot
  UPDATE inventory
     SET qty_on_hand = qty_on_hand + p_qty_delta,
         updated_at  = now()
   WHERE product_id = p_product_id
   RETURNING id, qty_on_hand
        INTO v_inventory_id, v_qty_after;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'inventory_not_found: no inventory row for product %', p_product_id;
  END IF;

  INSERT INTO inventory_movement (
    inventory_id, kind, qty_delta, qty_after,
    reference_id, note, created_by
  ) VALUES (
    v_inventory_id, p_kind, p_qty_delta, v_qty_after,
    p_reference_id, p_note, auth.uid()
  )
  RETURNING * INTO v_movement;

  RETURN v_movement;
END;
$$;
