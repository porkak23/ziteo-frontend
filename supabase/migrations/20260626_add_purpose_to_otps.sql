-- P0 security fix: prevent cross-flow OTP reuse (register code used for reset-pin and vice versa).
alter table public.otps
  add column purpose text not null default 'verify_phone'
  check (purpose in ('verify_phone', 'reset_pin'));

comment on column public.otps.purpose is
  'Prevents cross-flow OTP reuse: verify_phone (register/resend) vs reset_pin (forgot-pin).';
