# Investment experience follow-up

The cap table and personal portfolio use existing records and do not mutate ownership, payments or commercial terms. Confirmed holdings and SAFE subscriptions remain separate. Unlinked register rows are not silently treated as unique people. Currency totals are separate and outstanding amounts are calculated per subscription before aggregation.

## Remaining business capabilities

- **Transfers:** The old website created Class C subscriptions from its transfer form. Do not restore this assumption. A future transfer workflow needs source holding, recipient identity, authorised quantity, evidence, effective date, corresponding debit/credit and history. Existing bonus-offer controls are not a complete transfer register.
- **Dividends:** Restore the visual summary only after an approved declaration and allocation/payment ledger exists. Do not manufacture yield or dividend records from subscription payments.
- **Valuation and dilution:** The previous portfolio used invested cost as current value and left performance history empty. Fully diluted ownership needs approved class rights, conversion assumptions and outstanding instruments; valuation needs a dated approved basis. These metrics are intentionally absent from the new dashboard.
- **Document packs:** AI review is now advisory; approved templates and canonical records determine generation. Missing source details, Drive/API configuration and template checks remain actionable failures. Full live document generation still needs end-to-end verification.

## Current presentation

Administrators have a filtered cap-table grid, class distribution, reconciliation counts, and modal record actions. Investors have a concise personal portfolio with payment progress and direct links to subscriptions, holdings and documents. Administrative subscriptions and personal subscriptions remain separate views, including for users with administrator roles.
