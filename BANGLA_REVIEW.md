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

## Added in Milestone 3

| Key / place | Draft | Question |
|---|---|---|
| `peers.context_note` | বেশি না কম হওয়া কাম্য, তা পরিস্থিতির ওপর নির্ভর করে। | Natural? ("Whether higher or lower is preferable depends on the situation.") |
| `peers.target_lower` / `_higher` | লক্ষ্যের দিক: কম / বেশি | Clear? |
| `badge.ahead` / `badge.behind` | {m}টি তুলনার দেশের মধ্যে {n}টির চেয়ে এগিয়ে / পিছিয়ে | Natural word order? |
| `badge.level` | মাঝামাঝি অবস্থানে | OK for "Level with the middle"? |
| `badge.formula_*` | Long sentences explaining the count | Clear at class-8 level? |
| `unit.per_1000_live_births.label` | ৩০.৫ প্রতি ১,০০০ জন্মে | **Changed by Ahmar:** "জীবিত" removed everywhere (also in the under-5 and maternal explanations and the SDG 3.2 target). |
| `unit.dollar_amount` | ৩.০০ ডলার | OK for the poverty line "$3.00"? |
| `caveat.consumption` / `caveat.income` | ব্যয় (ভোগ) দিয়ে মাপা / আয় দিয়ে মাপা | Natural? |
| `caveat.gross` | মোট হিসাব: এটি ১০০%-এর বেশি হতে পারে | OK? |
| `chart.show_as` | যেভাবে দেখাবে | Label for the Chart / Table switch. Natural? |
| `money.show_in` | যে মুদ্রায় দেখাবে | Natural? |
| `design.*` | Design preview page text | Low priority: the page is for review only. |
| `nav.skip` | মূল লেখায় যান | OK for "Skip to content"? |
| `notfound.*` | এই পাতাটি নেই … হোম পেজে যান | Natural? |
| `money.intl` | ডলার (English: Dollars) | **Changed by Ahmar:** short label on the switch. |
| `explain.official_definition`, `direction.target_label`, `badge.formula_*` | অফিশিয়াল সংজ্ঞা / অফিশিয়াল লক্ষ্য | **Changed by Ahmar:** "অফিশিয়াল" replaces "দাপ্তরিক" everywhere. |

## Added in Milestone 4

| Key / place | Draft | Question |
|---|---|---|
| `indicator.*.short` (24 short names) | e.g. মাথাপিছু জিডিপি, শিশুদের খাটো হওয়া, স্বাস্থ্যে নিজের পকেটের খরচ | Natural short labels? |
| `indicator.{gdp_total_taka, electricity, safe_water, pm25, hdi_rank, cpi_rank, whr_rank}.name` | জিডিপি: গোটা অর্থনীতির আকার; বিদ্যুৎ সুবিধা; নিরাপদ খাবার পানি; বায়ুদূষণ (সূক্ষ্ম ধূলিকণা, PM২.৫); মানব উন্নয়ন সূচক, অবস্থান; দুর্নীতির ধারণা সূচক, অবস্থান; বিশ্ব সুখ প্রতিবেদন, অবস্থান | Usual names? |
| `explain.{same seven}` | New definitions (not in section 11) | Clear and neutral? |
| `direction.target.{electricity, safe_water, pm25}` | Translations of SDG 6.1, 7.1 and the WHO guideline | OK? |
| `rank.short` / `rank.calculated` / `rank.formula` | বিশ্বে ১২৮/১৮৫ … (১ = সর্বোচ্চ মান) | Is "বিশ্বে {rank}/{n}" understood as a world rank? |
| `unit.rank.number` / `unit.rank.of` | ১৩০তম (১৯৩টি দেশের মধ্যে) | OK? |
| `status.count` / `status.none` / `status.formula` | অফিশিয়াল লক্ষ্যওয়ালা {m}টির {a}টিতে বেশিরভাগ দেশের চেয়ে এগিয়ে | Natural? ("লক্ষ্যওয়ালা" is informal; is that fine?) |
| `area.equality` | সমতা | OK for the "Equality" tile? |
| `slicer.*` | তুলনা করুন; সব দেশ; টেনে, ক্লিক করে বা তীরচিহ্ন বোতাম দিয়ে … | Natural? |
| `view.summary` / `view.details` | সারসংক্ষেপ / বিস্তারিত | OK? |
| `side.title` | এক নজরে বাংলাদেশ | OK? |
| `goal.short` / `target.short.*` | লক্ষ্য ২৫; জাতিসংঘের ২০৩০ সালের লক্ষ্য …; বিশ্ব স্বাস্থ্য সংস্থার নির্দেশিকা … | OK? |
| `source.short.*`, `source.compact_*`, `month.short.*` | বিশ্বব্যাংক (WDI); তথ্য ২০২৫; সংগ্রহ ১৩ নভে. ২০২৬; জানু., ফেব্রু., … | Are these month abbreviations standard? |
| `number.lakh_crore`, `number.trillion` | লাখ কোটি; ট্রিলিয়ন | OK? |
| `unit.ug_m3.*` | µg/m³ (symbol kept) and মাইক্রোগ্রাম/ঘনমিটার in full text | Keep the symbol in rows? |

## Added in Milestone 4, second review

| Key / place | Draft | Question |
|---|---|---|
| `home.title` / `home.lede` | কেমন আছে বাংলাদেশ? / দৈনন্দিন জীবনের চারটি দিক, প্রতিটি পাশের ও কাছাকাছি ধরনের সাতটি দেশের পাশে রেখে। | Natural? |
| `glance.lede` | বহুল ব্যবহৃত ছয়টি মাপকাঠিতে বিশ্বে বাংলাদেশের অবস্থান। | OK? |
| `strip.toward_goal` / `strip.lower` / `strip.higher` | লক্ষ্যের দিকে / কম / বেশি | Clear on the strip? |
| `rank.world` | বিশ্বে {n}টির মধ্যে {rank} | Natural for "World rank 107 of 217"? |
| `details.status` | এখানকার অফিশিয়াল লক্ষ্যওয়ালা {m}টি মাপকাঠির {a}টিতে … | OK? |
| `view.full_picture` | পুরো ছবিটা | Ahmar asked for a natural Bangla equivalent of "the full picture", not a literal one. Is "পুরো ছবিটা" right, or something like "আদ্যোপান্ত" / "বিস্তারিত চিত্র"? |
| `details.close` | সারসংক্ষেপে ফিরুন | OK? |

## Added in Milestone 5

| Key / place | Draft | Question |
|---|---|---|
| `measure.compare` | অন্য দেশের সঙ্গে তুলনা | OK? |
| `measure.trend` | সময়ের সঙ্গে বাংলাদেশ | OK? |
| `measure.back` | পুরো ছবিটায় ফিরুন | OK? |
| `picker.preset.south_asia` | দক্ষিণ এশিয়া (সার্ক) | OK? |
| `picker.preset.neighbours` | বঙ্গোপসাগরের প্রতিবেশী (বিমসটেক) | OK? |
| `picker.preset.income` | কাছাকাছি আয়ের দেশ | OK? |
| `picker.why_text` | এগুলো দক্ষিণ ও দক্ষিণ-পূর্ব এশিয়ার কয়েকটি দেশ, যাদের সঙ্গে এই সাইট সব মাপকাঠিতে একইভাবে তুলনা করে। বিশ্বব্যা… | OK? |
| `picker.note_untranslated` | এই মানের সঙ্গে উৎসের যে টীকা আছে তা এখনো বাংলায় নেই, তাই মানটি দেখানো হচ্ছে না | OK? |
| `picker.note.income_trimmed` | বাংলাদেশের সঙ্গে একই আয়ের স্তরের যত দেশের তথ্য আছে, তার সবগুলো এখানে ধরে না। তাই মাথাপিছু জিডিপি (পিপিপি) বাং… | OK? |
| `compare.rank_line` | দেখানো {n}টি দেশের মধ্যে বাংলাদেশ {rank} নম্বরে (১ = সর্বোচ্চ মান)। | OK? |
| `compare.row_label` | {rank} নম্বর: {country}, {value} ({year}) | OK? |
| `compare.read_dots` | প্রতিটি বিন্দু একটি দেশের সর্বশেষ প্রকাশিত মান; সবচেয়ে বেশিটি সবার ওপরে। ছোট পার্থক্যও যাতে চোখে পড়ে, তাই অক… | OK? |
| `trend.in_constant` | দাম বাড়া-কমার প্রভাব বাদ দিয়ে বছরগুলো তুলনা করা যায় বলে এখানে দেখানো হয়েছে {name}। | OK? |
| `trend.gaps` | রেখার ফাঁকগুলো এমন বছর, যার কোনো প্রকাশিত মান নেই। সেগুলো ফাঁকাই রাখা হয়েছে, আন্দাজে পূরণ করা হয়নি। | OK? |
| `events.kind.shock` | বৈশ্বিক ও জাতীয় ধাক্কা | OK? |
| `events.disclaimer` | ঘটনাগুলো প্রেক্ষাপট হিসেবে দেখানো হয়েছে। কোনো ঘটনা কোনো পরিবর্তনের কারণ, চার্টটি তা বলে না। | OK? |
| `note.wb_fiscal_year_cy` | অর্থবছর শেষ: {day} {month}; জাতীয় হিসাবের তথ্যের প্রতিবেদনকাল: পঞ্জিকাবর্ষ (CY)। | OK? |
| `note.wb_emu_multiplier` | ইউরো অঞ্চলের (EMU) সদস্যদের জাতীয় মুদ্রাকে ইউরোতে রূপান্তর করতে একটি সরল গুণক ব্যবহার করা হয়। ইইউ কাউন্সিল {… | OK? |
| `events.kind.shock` | বৈশ্বিক ও জাতীয় ধাক্কা | Is "ধাক্কা" right for "shock", or something like "সংকট" (which may sound like a judgement)? |
| `src/i18n/countries.bn.json` | 167 new country names, e.g. সংযুক্ত আরব আমিরাত, কঙ্গো গণতান্ত্রিক প্রজাতন্ত্র, হংকং (চীনের বিশেষ প্রশাসনিক অঞ্চল), চেকিয়া, তুরস্ক | Usual Bangla spellings? Especially the territories and the two Congos. |
| docs/EVENTS_REVIEW.md | Bangla labels for the candidate events | Neutral and natural? |
