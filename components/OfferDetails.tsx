import {readOfferDisclosure} from '@/lib/offer-disclosure';
export function OfferDetails({disclosure}:{disclosure:unknown}){
 const facts=readOfferDisclosure(disclosure);
 if(!facts)return null;
 return <div className="offer-facts">
  <dl><dt>Issuer</dt><dd>{facts.issuer}</dd><dt>Share class on conversion</dt><dd>{facts.share_class}</dd><dt>Subscription instrument</dt><dd>SAFE — Simple Agreement for Future Equity</dd><dt>Terms checked against Citizen Digital documents</dt><dd>{facts.reviewed_on}</dd></dl>
  <p>A SAFE gives a conditional right to future shares. It does not give voting or dividend rights before conversion. Signing and paying alone do not issue ordinary shares.</p>
  <details><summary>Share availability and existing share classes</summary>
   <p>The register dated {facts.register_as_of} records {facts.register_unissued.toLocaleString('en-ZA')} unissued shares. The register is uncertified and pending reconciliation. Outstanding SAFE conversions and allocations must be reviewed before an allocation is confirmed. This figure is not a live stock balance or a reservation of shares.</p>
   <p>Ordinary Class A is identified in the SAFE as the founders’ class. This subscription offer is for future {facts.share_class}; it does not offer founder shares, preference shares or a guaranteed return.</p>
   <p>Existing signed instruments keep their original terms. The expired early-commitment price does not apply to new subscriptions.</p>
  </details>
 </div>;
}
