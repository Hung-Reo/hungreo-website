# VPS hardening — đã kiểm 2026-09-09

VPS `ssh hungreo-claude-vps` chạy **n8n + Telegram bot OpenClaw**.

## Kết luận: máy đã cứng sẵn, không cần làm gì thêm

Chạy `sudo sshd -T` ngày 09/09 cho thấy cấu hình đã đúng từ trước:

| Mục | Giá trị thật | Đánh giá |
|---|---|---|
| `passwordauthentication` | **no** | đã tắt — brute-force mật khẩu vô hiệu |
| `pubkeyauthentication` | yes | chỉ vào bằng key |
| `permitrootlogin` | `without-password` | = `prohibit-password`, chỉ key |
| `permitemptypasswords` | no | ok |
| `~/.ssh/authorized_keys` | 3 key | ok |
| fail2ban | **active** | đã cài và đang chạy |

Port phơi ra internet chỉ có **22 (sshd)** và **80/443 (caddy)**. Các service
còn lại chỉ nghe localhost (`[::1]:18789`, `[::1]:18795`) hoặc Tailscale
(`100.88.195.10`, `fd7a:115c:...`) — không tiếp cận được từ internet.

## Về IP VPS trong git history

`n8n.hungreo.com` và `bot.hungreo.com` là record A công khai, nên
`dig +short A n8n.hungreo.com` trả IP cho bất kỳ ai. **IP không phải bí mật và
không thể là bí mật** khi subdomain còn phải phân giải. Rewrite git history
không mua được gì. Việc gỡ IP khỏi docs (`458d29a`) giữ lại như vệ sinh tốt,
không phải như biện pháp bảo mật.

## Việc đã chạy ngày 09/09 (không đổi hành vi)

Thêm `/etc/ssh/sshd_config.d/99-hardening.conf` ghi lại đúng ba thiết lập vốn đã
có hiệu lực, backup `sshd_config`, `sshd -t` pass, `systemctl reload ssh`. Đăng
nhập từ terminal thứ hai sau đó: **VAO_DUOC_OK**. Sau reload:
`n8n.hungreo.com` trả 200, `hungreo.com` trả 200.

File này là no-op về hành vi — nó chỉ khiến cấu hình tường minh thay vì dựa vào
mặc định của distro. Muốn gỡ: `sudo rm /etc/ssh/sshd_config.d/99-hardening.conf
&& sudo systemctl reload ssh`.

## Nếu về sau cần đụng lại SSH

**Giữ nguyên phiên SSH đang mở.** Sau khi `reload`, mở terminal thứ hai đăng
nhập thử; chỉ khi vào được mới đóng terminal 1. Dùng `sshd -t` trước mọi lần
reload, và `reload` chứ không `restart` để không ngắt phiên đang mở.

Hoàn tác nhanh:

```bash
ssh hungreo-claude-vps 'sudo rm -f /etc/ssh/sshd_config.d/99-hardening.conf && sudo systemctl reload ssh'
```

## Không làm

- **Không đổi port SSH** — không tăng bảo mật thật, chỉ làm khó chính mình.
- **Không đụng DNS/nameserver** (cạm bẫy #1 trong `HANDOVER.md`).
- **Không bật ufw kiểu chặn hết rồi mở sau** — dễ chặn nhầm n8n webhook.

## Còn treo (không liên quan bảo mật)

`HANDOVER.md` ghi bot `nemotron` chết. Ngày 09/09 chỉ thấy **2** process bot nghe
ở `[::1]:18789` và `[::1]:18795`. Chưa xác minh đủ 3 bot đang chạy — cần kiểm
riêng, không thuộc phạm vi hardening.

Lệnh kiểm (chỉ đọc):

```bash
ssh hungreo-claude-vps 'sudo fail2ban-client status sshd; echo ---; docker ps --format "{{.Names}}\t{{.Status}}" 2>/dev/null | head'
```
