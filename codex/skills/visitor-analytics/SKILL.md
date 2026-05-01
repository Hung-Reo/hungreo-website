---
name: visitor-analytics
description: Thực hiện feature Visitor Analytics cho Hungreo (footer public + admin modal) theo chuẩn GDPR, không PII.
---

# Visitor Analytics (Hungreo)

## Khi nào dùng
- Khi cần triển khai hoặc cập nhật feature thống kê lượt truy cập (public footer + admin details).

## Tài liệu bắt buộc đọc
- `docs/CODEX_VISITOR_ANALYTICS_GUIDE.md`
- `CLAUDE.md`

## Quy trình khuyến nghị (tối giản)
1) Đọc `docs/CODEX_VISITOR_ANALYTICS_GUIDE.md` để nắm yêu cầu + key schema.
2) Tạo/điều chỉnh tracking server-side + client trigger theo guide.
3) Update admin stats endpoint và admin UI.
4) Update footer public + i18n months.
5) Kiểm tra privacy: không IP, không cookie, không user id.

## File trọng yếu
- `lib/visitorTracker.ts`
- `app/api/analytics/track/route.ts`
- `app/api/public/visitor-count/route.ts`
- `app/api/admin/stats/route.ts`
- `components/admin/AdminDashboard.tsx`
- `components/admin/VisitorStatsModal.tsx`
- `components/layout/Footer.tsx`
- `contexts/LanguageContext.tsx`

## Checklist nhanh
- [ ] Public footer hiển thị `X accessed/Mon` hoặc `X lượt truy cập/ThN`
- [ ] Admin stats có card “Unique Visitors” + modal
- [ ] KV key schema đúng theo guide
- [ ] Không lưu PII (IP/cookie/user id)
- [ ] Không track admin routes
