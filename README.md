# Citizen Hub

The Citizen Hub frontend for **hub.citizenbank.co.ls**: the workspace for investors, shareholders, the board, staff
and the back office (subscriptions, board portal, governance, reporting and administration).

**Status: not started in this repository.** Today the Hub screens live inside
[CitizenBankWebsite](https://github.com/citizen-bnk/CitizenBankWebsite) together with the public website and the API, and
run at `citizenbank.co.ls`. This repository is reserved for the split: the Hub frontend moves here, talks to the
website's API, and is deployed as its own Vercel project on `hub.citizenbank.co.ls`. Until then, nothing here needs
deploying and the website's `HUB_URL` setting stays unset.

Sign-in uses Stack Auth, and each person's roles come from the platform schema in the shared Postgres database.

The full map of the six repositories and four hosts is in
[`docs/ECOSYSTEM.md`](https://github.com/citizen-bnk/CitizenBankWebsite/blob/claude/practical-volta-tqe0qk/docs/ECOSYSTEM.md)
in the website repository.

> The previous contents of a repository with this name (an old Firebase export) were moved to a private repository
> because they contained leaked credentials. Do not restore them from history.
