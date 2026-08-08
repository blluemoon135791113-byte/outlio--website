# 🔄 Clear Social Media Cache - ALL PLATFORMS

Your OG image is cached on multiple platforms. Clear them all to show your proper image.

---

## 1. Facebook & Meta (Most Important)

**Facebook Sharing Debugger**
- URL: https://developers.facebook.com/tools/debug/
- Enter: `https://outlio.io`
- Click: **"Scrape Again"** button
- Repeat for: `https://outlio.io/explainers`

**This clears cache for:**
- Facebook
- Instagram
- WhatsApp
- Messenger

---

## 2. LinkedIn Post Inspector

**LinkedIn Inspector**
- URL: https://www.linkedin.com/post-inspector/
- Enter: `https://outlio.io`
- Click: **"Inspect"**
- Wait for new preview to load

---

## 3. Twitter/X Card Validator

**Twitter Card Validator**
- URL: https://cards-dev.twitter.com/validator
- Enter: `https://outlio.io`
- Click: **"Preview card"**
- Should refresh automatically

**Alternative (if validator doesn't work):**
- Tweet the link from your account
- Delete the tweet (cache is cleared when you post)

---

## 4. Telegram

**Telegram doesn't have a debugger tool**

**Manual method:**
1. Share `https://outlio.io` in a message to yourself
2. Wait 24 hours for cache to expire
3. OR use: `https://outlio.io?v=2` (cache buster)

---

## 5. Slack

**Slack Link Unfurling**
- No public cache clearing tool
- Post the link in any Slack channel/DM
- Slack will fetch the latest preview
- If still cached, wait 24 hours

**Force refresh:**
- Share: `https://outlio.io?refresh=1`

---

## 6. Discord

**Discord Embeds**
- No public cache clearing tool
- Post the link in Discord
- If old image shows, wait 24 hours
- OR use cache buster: `https://outlio.io?v=2`

---

## 7. Pinterest

**Pinterest Rich Pins Validator**
- URL: https://developers.pinterest.com/tools/url-debugger/
- Enter: `https://outlio.io`
- Click: **"Validate"**
- Pinterest will refresh the cache

---

## 8. Reddit

**Reddit has no cache clearing tool**

**What happens:**
- When you post a link, Reddit fetches the preview
- If it's already cached, it shows old version
- Wait 24-48 hours for cache to expire

**Workaround:**
- Add query parameter: `https://outlio.io?reddit=1`

---

## 9. iMessage (Apple)

**iMessage Link Previews**
- No cache clearing tool
- Controlled by iOS/macOS
- Send link to yourself: `https://outlio.io`
- Should fetch new preview
- If not, wait 24 hours

---

## 10. Microsoft Teams

**Teams Link Previews**
- No public cache tool
- Post the link in a Teams chat
- Teams will fetch latest preview
- If cached, wait 24 hours

---

## 11. Google Search Console

**Not for social sharing, but important for SEO**

- URL: https://search.google.com/search-console
- Go to: URL Inspection
- Enter: `https://outlio.io`
- Click: **"Request Indexing"**
- Google will re-crawl and update cache

---

## 12. Bing Webmaster Tools

**Bing URL Submission**
- URL: https://www.bing.com/webmasters
- Submit URL: `https://outlio.io`
- Bing will re-crawl

---

## Quick Links (Click All These Now)

**CRITICAL (Do These First):**
1. Facebook: https://developers.facebook.com/tools/debug/
2. LinkedIn: https://www.linkedin.com/post-inspector/
3. Twitter: https://cards-dev.twitter.com/validator
4. Pinterest: https://developers.pinterest.com/tools/url-debugger/

**These 4 cover 90% of social sharing.**

---

## Cache Buster Method (If Nothing Works)

If platforms still show old image, use **query parameters** as cache busters:

- `https://outlio.io?v=1`
- `https://outlio.io?refresh=true`
- `https://outlio.io?update=2024`

When you share the link with `?v=1`, it's treated as a new URL and forces a fresh fetch.

---

## How Long Until Cache Clears?

**Immediate (after using debugger):**
- Facebook/Meta: Instant
- LinkedIn: Instant
- Twitter: Instant
- Pinterest: Instant

**24 Hours (no debugger available):**
- Telegram
- Slack
- Discord
- Reddit
- iMessage
- Teams

**Manual Override:**
Use query parameters: `?v=2` to force fresh fetch

---

## Test After Clearing

**Check each platform:**
1. Share `https://outlio.io` in a test post/message
2. Verify it shows:
   - ✅ Outlio logo (not Addx logo)
   - ✅ Title: "Outlio | Proven Sales Systems..."
   - ✅ Description: "We do research first sales..."

---

## What If It Still Shows Wrong Image?

**Double-check:**
1. Visit directly: https://outlio.io/outlio-og-image.png
2. Should show your Outlio logo (not blank, not Addx)
3. If wrong image shows, the file needs to be replaced

**Then:**
4. Clear browser cache (Ctrl+Shift+R)
5. Wait 5 minutes for CDN to update
6. Try social debuggers again

---

## Automate This (Optional)

**Create a script to hit all debuggers:**

```bash
# Facebook
curl -X POST "https://graph.facebook.com/?id=https://outlio.io&scrape=true"

# Twitter (requires auth)
# Manual only

# LinkedIn (requires auth)  
# Manual only
```

Most require manual clicking, but Facebook can be automated.

---

## Priority Order

**Do these in order:**

1. ✅ Facebook Debugger (most used for sharing)
2. ✅ LinkedIn Inspector (B2B audience)
3. ✅ Twitter Card Validator (tech community)
4. ✅ Pinterest (if you use it)
5. ⏳ Others (wait 24h or use cache busters)

---

## Verification Checklist

After clearing all caches:

- [ ] Facebook shows correct image
- [ ] LinkedIn shows correct image
- [ ] Twitter shows correct image
- [ ] WhatsApp shows correct image
- [ ] iMessage shows correct image
- [ ] Slack shows correct image
- [ ] Discord shows correct image
- [ ] Telegram shows correct image

**If any still show wrong image:**
- Wait 24 hours
- OR use: `https://outlio.io?v=2`

---

## Pro Tip: Prevent Future Issues

**Before launching on new platforms:**
1. Always use social debuggers FIRST
2. Test link before sharing widely
3. Keep OG image file at same path (don't rename)
4. If you update OG image, clear caches again

---

## Need Help?

If after 24 hours any platform still shows wrong image:
1. Check: https://outlio.io/outlio-og-image.png directly
2. Verify file is correct
3. Try cache buster: `?v=3`
4. Contact platform support (rare)

Most issues resolve within 24 hours of clearing cache.

---

**Start with Facebook, LinkedIn, Twitter debuggers NOW.** ⬆️

Those 3 cover most business sharing scenarios.
