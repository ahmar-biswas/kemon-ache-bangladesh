## 6. Currency, numbers, dates

**Taka first for domestic money values; international dollars only for cross-country comparison.**

- Where the World Bank publishes a **local-currency (taka)** series, show taka. The site never converts dollars to taka itself, because that would be a calculated number with an unstated assumption about the exchange rate.
- **Current taka vs constant taka:** the latest "how much" figure may use current taka. Any chart that shows change over many years must use constant (inflation-adjusted) taka, labelled clearly, because current taka rises over time partly because of price rises.
- **Cross-country comparison** of money values uses **international dollars (PPP)**, because comparing taka with rupees or pesos is meaningless. Label: "Compared in international dollars, which adjust for the fact that things cost different amounts in different countries."
- If a source publishes a money figure **only in US dollars** (e.g., total reserves), show it in US dollars as published and label it. Do not convert.
- Taka format: `৳` symbol. Use the **lakh/crore** grouping in both languages for taka amounts (e.g., 2,73,000 in English mode; ২,৭৩,০০০ in Bangla mode), and the word forms "lakh" and "crore" (লাখ, কোটি) for large amounts. US dollar and international dollar amounts use standard thousands grouping with million/billion in English and the Bangla equivalents (মিলিয়ন, বিলিয়ন) in Bangla mode.
- Bangla mode uses Bangla numerals (০১২৩৪৫৬৭৮৯) everywhere, including charts, tooltips, tables, and years. Use `Intl.NumberFormat('bn-BD', { numberingSystem: 'beng' })` or an equivalent tested approach. Percent signs and decimal separators must be correct in each language.
- Dates: "13 November 2026" / "১৩ নভেম্বর ২০২৬". Always show years as four digits.
