# 🚀 Deploy Checklist - Before You Push

## Pre-Deploy Checklist

Before deploying these SEO changes, verify:

### 1. Build Check
- [x] `npm run build` completes successfully (✅ VERIFIED)
- [x] No TypeScript errors (✅ VERIFIED)
- [x] All routes generate correctly (✅ 9 pages)

### 2. Files to Deploy
These new/modified files are ready:
- [x] `app/layout.tsx` (meta tags, Schema markup)
- [x] `app/page.tsx` (FAQ Schema)
- [x] `app/explainers/page.tsx` (meta + breadcrumbs)
- [x] `app/privacy/page.tsx` (meta + breadcrumbs)
- [x] `app/terms/page.tsx` (meta + breadcrumbs)
- [x] `app/sitemap.ts` (NEW - dynamic sitemap)
- [x] `app/robots.ts` (NEW - dynamic robots)
- [x] `app/components/Breadcrumbs.tsx` (NEW)
- [x] `app/components/FAQSchema.tsx` (NEW)
- [x] `next.config.ts` (performance optimizations)
- [x] `public/robots.txt` (NEW - static)
- [x] `public/sitemap.xml` (NEW - static)

### 3. Documentation Files (Don't Deploy to Production)
These are guides for YOU (not part of the website):
- `START_HERE.md`
- `IMMEDIATE_ACTION_ITEMS.md`
- `BACKLINK_OPPORTUNITIES.md`
- `SEO_GUIDE.md`
- `SEO_COMPLETION_SUMMARY.md`
- `WHAT_I_NEED_FROM_YOU.md`
- `DEPLOY_CHECKLIST.md`

Optional: Add to `.gitignore` if you don't want them in repo.

---

## After Deploy - Immediate Actions

### 1. Verify Live Site (5 min)
Check these URLs work:
- [ ] https://outlio.io (homepage)
- [ ] https://outlio.io/robots.txt (should show allow rules)
- [ ] https://outlio.io/sitemap.xml (should show 4 URLs)
- [ ] https://outlio.io/explainers (should have breadcrumbs)

### 2. Test Metadata (5 min)
View page source (right-click → View Page Source):
- [ ] Title shows: "Outlio | Proven Sales Systems For Tech Startups and SaaS"
- [ ] Meta description matches new text
- [ ] Schema markup present (search for `application/ld+json`)
- [ ] Open Graph tags present (search for `og:`)

### 3. Test Social Sharing (5 min)
Use these tools:
- [ ] Facebook Debugger: https://developers.facebook.com/tools/debug/
  - Enter: https://outlio.io
  - Should show title, description (image placeholder until you create it)
- [ ] Twitter Card Validator: https://cards-dev.twitter.com/validator
  - Enter: https://outlio.io
  - Should show card preview

### 4. Mobile Check (2 min)
- [ ] Test on your phone
- [ ] Breadcrumbs display correctly
- [ ] All pages load fast

---

## Post-Deploy - Within 24 Hours

### 1. Google Search Console
- [ ] Add property: outlio.io
- [ ] Verify ownership (HTML tag method)
- [ ] Submit sitemap: https://outlio.io/sitemap.xml
- [ ] Request indexing for homepage

### 2. Check Indexing
Test if Google can access your site:
- [ ] Go to: https://search.google.com/search?q=site:outlio.io
- [ ] Should see your pages (might take 24-48 hours)

### 3. Test Structured Data
- [ ] Go to: https://search.google.com/test/rich-results
- [ ] Enter: https://outlio.io
- [ ] Should detect: Organization, FAQPage schemas
- [ ] No errors

---

## Week 1 Tasks

### 1. Create Missing Asset
- [ ] Create OG image (1200x630px)
- [ ] Save as: `public/outlio-og-image.png`
- [ ] Redeploy
- [ ] Test social sharing again (should now show image)

### 2. Submit to Directories
- [ ] Product Hunt
- [ ] Crunchbase
- [ ] AngelList
- [ ] Indie Hackers
- [ ] BetaList

### 3. Get First Backlinks
- [ ] Email 4 clients (see BACKLINK_OPPORTUNITIES.md)
- [ ] Create LinkedIn Company Page
- [ ] Update social profiles with outlio.io link

---

## Common Issues & Fixes

### Issue: robots.txt not working
**Check**: Is it in `/public/robots.txt`?
**Fix**: Clear browser cache, check https://outlio.io/robots.txt

### Issue: Sitemap not found
**Check**: Both `public/sitemap.xml` and `app/sitemap.ts` exist?
**Fix**: Run `npm run build` again

### Issue: Schema errors in Rich Results Test
**Check**: JSON format in `app/layout.tsx`
**Fix**: Validate JSON at https://jsonlint.com/

### Issue: Social sharing shows wrong image
**Check**: Does `public/outlio-og-image.png` exist?
**Fix**: Create the image, redeploy, then re-scrape on Facebook Debugger

### Issue: Breadcrumbs not showing
**Check**: Are you on a subpage? (breadcrumbs don't show on homepage)
**Fix**: Visit /explainers, /privacy, or /terms

---

## Success Criteria

Your deploy is successful if:
- ✅ Site builds without errors
- ✅ All 4 pages load correctly
- ✅ robots.txt is accessible
- ✅ sitemap.xml is accessible  
- ✅ Title changed from "—" to "|"
- ✅ Meta description updated
- ✅ Breadcrumbs appear on subpages
- ✅ No console errors in browser

---

## What to Monitor (Weekly)

### Week 1
- Google Search Console: Is site indexed?
- Site search: `site:outlio.io` on Google
- Any crawl errors?

### Week 2-4
- Ranking for "Outlio" (check manually)
- Backlinks count (use Google Search Console)
- Organic traffic (if GA4 set up)

### Month 2+
- Keyword rankings (use free tools)
- Traffic trends
- Conversion rate from organic

---

## Need Help?

If something breaks:
1. Check browser console for errors (F12)
2. Verify build completed: `npm run build`
3. Check all imports are correct
4. Restart dev server: `npm run dev`

The code is tested and working. If you have issues after deploy:
- Most likely: Caching (clear cache)
- DNS propagation (wait 24 hours)
- CDN cache (if using Vercel/Netlify, purge cache)

---

## Deployment Commands

### If using Vercel (recommended for Next.js):
```bash
git add .
git commit -m "Add comprehensive SEO optimization"
git push origin main
```
Vercel auto-deploys on push.

### If using other platforms:
```bash
npm run build
# Then deploy the .next folder per platform docs
```

---

## Final Pre-Push Check

Run these commands:
```bash
# Test build
npm run build

# Check for TypeScript errors  
npx tsc --noEmit

# Run dev server and manually test
npm run dev
# Visit: http://localhost:3000
```

If all pass → You're ready to deploy! 🚀

---

**Last updated**: 2026-08-01
**Status**: ✅ Ready to deploy
**Estimated deploy time**: 5-10 minutes
