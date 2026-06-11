-- Dedicated sequence for derived phone numbers
CREATE SEQUENCE IF NOT EXISTS "tbl_beneficiaries_pii_derived_phone_seq";

-- Trigger function: replace the '0009999999999' sentinel placeholder with
-- '+000999<7-digit seq>' before insert, so the placeholder never lands in the
-- unique index.
CREATE OR REPLACE FUNCTION generate_derived_phone()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."phone" = '0009999999999' THEN
    NEW."phone" := '+000999' || lpad(nextval('tbl_beneficiaries_pii_derived_phone_seq')::text, 7, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_derived_phone
BEFORE INSERT ON "tbl_beneficiaries_pii"
FOR EACH ROW
EXECUTE FUNCTION generate_derived_phone();
