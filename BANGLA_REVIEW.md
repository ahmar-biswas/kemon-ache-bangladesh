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

## Added in Milestone 2 (reviewed by Ahmar on 2026-11-13: all accepted, with the four changes below)

| Key / place | Draft | Question |
|---|---|---|
| `indicator.gdp_pc_taka_constant.name` | মাথাপিছু জিডিপি, স্থির মূল্যে টাকায় | Is "স্থির মূল্যে" the usual term for "constant prices"? |
| `indicator.gdp_pc_ppp.name` | …আন্তর্জাতিক ডলারে (ক্রয়ক্ষমতার সমতা) | Is "ক্রয়ক্ষমতার সমতা" clear for PPP? |
| `indicator.youth_unemployment.name` | যুব বেকারত্ব… (আইএলওর মডেলভিত্তিক হিসাব) | "মডেলভিত্তিক হিসাব" for "modelled estimate"? |
| `indicator.stunting.name` | পাঁচ বছরের কম বয়সী শিশুদের বয়সের তুলনায় খাটো হওয়া | **Changed by Ahmar:** "বয়সের তুলনায় খাটো হওয়া" instead of "খর্বতা" (also in `direction.target.stunting`). |
| `indicator.oop.name` | স্বাস্থ্য ব্যয়ে মানুষের নিজের পকেট থেকে সরাসরি খরচ | Natural for "out-of-pocket"? |
| `indicator.secondary_enrol_*` | মাধ্যমিক বিদ্যালয়ে ভর্তির হার (মোট) | "মোট" for "gross"? "মেয়ে / ছেলে" or "ছাত্রী / ছাত্র"? |
| `median.label` | নিম্ন-মধ্যম আয়ের দেশগুলোর মিডিয়ান | **Changed by Ahmar:** the English word "median" written in Bangla (মিডিয়ান) instead of "মধ্যমা". |
| `derived.calculated_by_site` | এই সাইটের হিসাব | Clear for "Calculated by this site"? |
| `derived.median_formula` | … {count}টি দেশের মাঝের মান | Natural? |
| `direction.target.*` (4 SDG targets) | Long translations of UN target texts | Is there an official Bangla version of the SDG targets we should copy instead? |
| `explain.*` (32 texts) | From section 11 (draft) | Already listed as drafts in the spec; review all. |
| `countries.bn.json`: CIV | আইভরি কোস্ট | **Changed by Ahmar:** "Ivory Coast" in Bangla. |
| `countries.bn.json`: STP | সাঁউ তুমি ও প্রিন্সিপি | Spelling? |
| `countries.bn.json`: TLS | তিমুর-লেস্তে | Or "পূর্ব তিমুর"? |
| `countries.bn.json`: PSE | ফিলিস্তিন | **Changed by Ahmar:** "Filistin" in Bangla (the World Bank's English name is "West Bank and Gaza"). |
| `countries.bn.json`: COG | কঙ্গো প্রজাতন্ত্র | World Bank name "Congo, Rep.". OK? |
| `countries.bn.json`: SWZ | এসওয়াতিনি | Spelling? |
| `note.pip_*` (4 keys) | {survey} জরিপের তথ্যের ভিত্তিতে। প্রতিটি খানার আলাদা / শ্রেণিবদ্ধ ভোগব্যয়ের (আয়ের) তথ্য থেকে হিসাব করা। | Is this clear for "unit-record" vs "grouped" data? Is "ভোগব্যয়" right for "consumption"? |
| `note.uncertainty_bound` | অনিশ্চয়তার সীমা {low} - {high} | Natural? |
| `note.source_citation` | উৎস (প্রকাশিত শিরোনাম অনুযায়ী): {citation} | The report title stays in English. OK? |
| `note.wb_alternative_conversion` | Long translation of a World Bank note on exchange rates (Cambodia) | Check "বিকল্প রূপান্তর হার", "ভারযুক্ত গড়". |
| `note.uis_estimation` | ইউনেস্কো পরিসংখ্যান ইনস্টিটিউটের (UIS) প্রাক্কলন | OK? |
