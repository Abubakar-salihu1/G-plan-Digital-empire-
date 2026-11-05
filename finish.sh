#!/usr/bin/env bash
cd /workspaces/G-plan-Digital-empire- || { echo "FAIL: folder not found"; exit 1; }

echo "== 1/7 Database"
docker compose -p g-plan-digital-empire up -d || { echo "FAIL: docker"; exit 1; }

echo "== 2/7 Cleaning .env"
python3 - << 'EOF'
lines = open(".env").read().splitlines()
best = {}
for i, l in enumerate(lines):
    if l.strip() and not l.lstrip().startswith("#") and "=" in l:
        k, v = l.split("=", 1)
        if k not in best or v.strip() or not best[k][1].strip():
            best[k] = (i, v)
out = []
for i, l in enumerate(lines):
    if l.strip() and not l.lstrip().startswith("#") and "=" in l:
        if best[l.split("=", 1)[0]][0] != i:
            continue
    out.append(l)
open(".env", "w").write("\n".join(out) + "\n")
EOF
grep -q '^ADMIN_KEY=.\{16,\}' .env || echo "ADMIN_KEY=$(openssl rand -hex 16)" >> .env
grep -q '^BREVO_API_KEY=.\+' .env || {
  sed -i '/^BREVO_API_KEY=/d' .env
  read -rsp "Paste Brevo key, then press Enter: " K; echo
  echo "BREVO_API_KEY=$K" >> .env; unset K
}
grep -q '^NOTIFY_EMAIL=.\+' .env || { sed -i '/^NOTIFY_EMAIL=/d' .env; echo "NOTIFY_EMAIL=talk2abubakarsalihu1992@gmail.com" >> .env; }
grep -q '^MAIL_FROM=.\+' .env || { sed -i '/^MAIL_FROM=/d' .env; echo "MAIL_FROM=talk2abubakarsalihu1992@gmail.com" >> .env; }
ln -sf ../../.env apps/web/.env
ln -sf ../../.env apps/api/.env
echo "BREVO lines: $(grep -c '^BREVO_API_KEY=' .env) (should be 1)"

echo "== 3/7 Restarting app"
pkill -f concurrently; pkill -f next-server; pkill -f "tsx watch"; sleep 2
rm -rf apps/web/.next
nohup npm run dev > /tmp/gplan.log 2>&1 &
for i in $(seq 1 40); do
  curl -s localhost:4000/api/v1/ready | grep -q ready && break
  sleep 2
done
curl -s localhost:4000/api/v1/ready; echo

echo "== 4/7 Database tables"
npm run db:push 2>&1 | grep -i "sync\|error" 

echo "== 5/7 Type check"
npm run build --workspace @gplan/api 2>&1 | grep -i "error" || echo "API type check OK"

echo "== 6/7 Email test"
curl -s -X POST localhost:4000/api/v1/enquiries -H "content-type: application/json" -d '{"name":"Final Test","email":"test@example.com","service":"AI Marketing","message":"Final test of the email alert."}'; echo
sleep 6
if grep -q "Brevo email" /tmp/gplan.log; then echo "EMAIL PROBLEM:"; grep -A2 "Brevo email" /tmp/gplan.log | head -8; else echo "No email errors. Check Gmail (and Spam) for: New enquiry from Final Test"; fi

echo "== 7/7 Saving to GitHub"
for p in .env node_modules .next apps/web/.env; do
  git check-ignore -q "$p" || { echo "$p" >> .gitignore; }
done
if git ls-files | grep -qE '(^|/)\.env$'; then echo "STOP: .env is tracked by git, not pushing"; exit 1; fi
git add -A
git commit -m "Move to repo root, enquiry form feedback, admin page, email alerts, Express type fix" || echo "(nothing new to commit)"
git push && echo "PUSHED TO GITHUB" || echo "PUSH FAILED - send me a screenshot"
echo "== DONE"
