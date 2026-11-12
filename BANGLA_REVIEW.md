# Bangla strings for review

Every Bangla string is a draft until Ahmar reviews it. These are the ones the builder is
least sure of. The key points to the entry in `src/i18n/bn.json` unless stated otherwise.

| Key / place | Draft | Question |
|---|---|---|
| `indicator.life_expectancy.name` | জন্মের সময় প্রত্যাশিত গড় আয়ু | Is "প্রত্যাশিত গড় আয়ু" the usual term? |
| `indicator.gdp_pc_taka.name` | মাথাপিছু জিডিপি, বর্তমান মূল্যে টাকায় | Is "বর্তমান মূল্যে" right for "current prices"? Or "চলতি মূল্যে"? |
| `indicator.inflation.name` | মূল্যস্ফীতি, ভোক্তা মূল্য, বার্ষিক | Natural word order? |
| `source.name.wb_wdi` | বিশ্বব্যাংক, ওয়ার্ল্ড ডেভেলপমেন্ট ইন্ডিকেটরস | Transliterate the dataset name, or translate it (বিশ্ব উন্নয়ন সূচক)? |
| `source.retrieved` | সংগ্রহের তারিখ | Clear for "date retrieved"? |
| `home.last_checked` | সর্বশেষ যাচাই | Clear for "last checked"? |
| `source.notes` | উৎসের টীকা | "টীকা" or "নোট"? |
| `note.wb_bgd_national_accounts_fy` | জাতীয় হিসাবের তথ্যের প্রতিবেদনকাল… | Long technical translation of a World Bank note. Check "প্রতিবেদনকাল", "পঞ্জিকাবর্ষ", "প্রাক্কলন", "সরকারি বিনিময় হার". |
| `src/lib/format.ts` (formatUsd) | US$২১.৪ বিলিয়ন | Is "US$" before Bangla digits acceptable, or should it be "২১.৪ বিলিয়ন মার্কিন ডলার"? |
| `site.tagline` | বাংলাদেশ নিয়ে প্রকাশিত পরিসংখ্যান, প্রতিটির সঙ্গে তার উৎস। | Natural? |
