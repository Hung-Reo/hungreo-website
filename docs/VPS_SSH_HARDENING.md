# VPS hardening — Hưng tự chạy

VPS `ssh hungreo-claude-vps` chạy **n8n + 3 Telegram bot OpenClaw**. Làm sai
cấu hình SSH là tự khoá mình ra khỏi máy, nên các bước dưới đây có chốt an toàn.
Claude Code không SSH được vào máy này (permission classifier chặn), nên phần
này không tự động hoá được.

## Vì sao vẫn nên làm, dù IP vốn công khai

IP nằm trong DNS công khai (`dig +short A n8n.hungreo.com`) nên không giấu được.
Điều giấu được là **cách vào**: nếu SSH còn cho đăng nhập bằng mật khẩu thì bot
quét cả ngày sẽ brute-force. Mục tiêu: chỉ cho key, và chặn kẻ dò.

## ⚠️ Quy tắc chống tự khoá mình

**Giữ nguyên phiên SSH đang mở trong suốt quá trình.** Sau khi restart sshd, mở
**terminal thứ hai** và đăng nhập thử. Chỉ khi terminal 2 vào được mới đóng
terminal 1. Nếu terminal 2 hỏng, dùng terminal 1 để hoàn tác.

## Bước 1 — Xem hiện trạng (chỉ đọc, không đổi gì)

```bash
ssh hungreo-claude-vps 'sudo sshd -T | grep -Ei "^(passwordauthentication|permitrootlogin|pubkeyauthentication|port|permitemptypasswords)"; echo ---; ls ~/.ssh/authorized_keys 2>/dev/null && wc -l < ~/.ssh/authorized_keys; echo ---; systemctl is-active fail2ban 2>/dev/null || echo "fail2ban: chưa cài"; echo ---; sudo ss -tlnp | grep -v 127.0.0.1'
```

Đọc kết quả trước khi làm tiếp:
- `passwordauthentication yes` → đây là thứ cần tắt.
- `authorized_keys` phải có **ít nhất 1 dòng**. Nếu 0 dòng mà tắt password là
  khoá luôn — dừng lại, thêm key trước.
- Danh sách port đang mở cho biết còn service nào phơi ra ngoài ngoài
  n8n/bot/SSH không.

## Bước 2 — Tắt đăng nhập bằng mật khẩu

Chỉ chạy khi bước 1 xác nhận `authorized_keys` có key và bạn đang vào bằng key.

```bash
ssh hungreo-claude-vps 'sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak.$(date +%F) && printf "\nPasswordAuthentication no\nPermitRootLogin prohibit-password\nPubkeyAuthentication yes\n" | sudo tee /etc/ssh/sshd_config.d/99-hardening.conf && sudo sshd -t && sudo systemctl reload ssh'
```

`sshd -t` kiểm cú pháp trước khi reload — sai cú pháp thì lệnh dừng, sshd cũ vẫn
chạy. Dùng `reload` chứ không `restart` để phiên đang mở không bị ngắt.

**Ngay sau đó, mở terminal thứ hai:**

```bash
ssh hungreo-claude-vps 'echo VAO_DUOC_OK'
```

Không vào được thì quay lại terminal 1 và hoàn tác:

```bash
ssh hungreo-claude-vps 'sudo rm /etc/ssh/sshd_config.d/99-hardening.conf && sudo systemctl reload ssh'
```

## Bước 3 — fail2ban chặn brute-force

```bash
ssh hungreo-claude-vps 'sudo apt-get update -qq && sudo apt-get install -y fail2ban && sudo systemctl enable --now fail2ban && sudo fail2ban-client status sshd'
```

## Bước 4 — Kiểm lại n8n và 3 bot vẫn sống

Bắt buộc, vì đây mới là thứ không được sập:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://n8n.hungreo.com/
ssh hungreo-claude-vps 'docker ps --format "{{.Names}}\t{{.Status}}" 2>/dev/null || systemctl --no-pager --type=service --state=running | head -20'
```

n8n phải trả 200/302, và 3 bot phải còn chạy. Nhắn thử một tin cho bot Telegram
là cách xác nhận chắc nhất.

## Không làm

- **Không đổi port SSH** — không tăng bảo mật thật, chỉ làm khó chính mình.
- **Không đụng DNS/nameserver** (cạm bẫy #1 trong `HANDOVER.md`).
- **Không bật firewall chặn hết rồi mới mở** — dễ chặn nhầm n8n webhook. Nếu
  muốn dùng ufw, mở 22/80/443 và các port n8n/bot **trước**, rồi mới `enable`.
