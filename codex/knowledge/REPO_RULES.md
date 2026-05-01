# Quy ước repo Hungreo

## Bảo mật & riêng tư (bắt buộc)
- GDPR compliant: không lưu PII.
- Không lưu IP, không dùng cookies để tracking.
- Public chỉ xem dữ liệu aggregate.

## Bilingual EN/VI
- Tất cả text user-facing phải dùng `useLanguage()`.
- Translation nằm ở `contexts/LanguageContext.tsx`.

## Admin Protection
- Tất cả route `/admin/*` phải check auth.
- Dùng `auth()` trong `lib/auth.ts`.
- Nếu không auth: redirect về `/admin/login`.

## Data Storage Pattern (KV)
- Dùng `lib/kv.ts` cho mọi KV operation.
- Key đặt theo cấu trúc rõ ràng (vd: `about:content`).

## API Route Pattern
- Admin API phải check session và role.

## Do / Don't
- Do: bám theo pattern hiện có, TypeScript strict.
- Do: test local trước khi deploy.
- Don't: commit `.env.local` hoặc secrets.
- Don't: bypass auth ở admin routes.
