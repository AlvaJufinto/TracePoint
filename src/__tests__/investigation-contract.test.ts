import assert from 'node:assert/strict';
import axios from 'axios';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import verify from '../../api/trace-verify';
import ownership from '../../api/company-ownership';
import composition from '../../api/company-composition';

let upstreamCalls = 0;
axios.defaults.adapter = async config => {
  upstreamCalls++;
  const url = config.url || '';
  const payload = url.includes('shareholders-composition') ? {
    data: [{date:'2026-07-31', shares_number:100}, {date:'2026-08-31', shares_number:100, local:{total_l:25}, foreign:{total_f:50}, numbers_of_shareholders:10, change_in_shareholders:-2}]
  } : {company_name:'Test company', ownership:{
    major_shareholders:[{name:'PT Exact Holder', share_percentage:'0.25', share_amount:25}, {name:'Public'}, {name:'Treasury Stock',share_percentage:'0'}],
    conglomerates_group:['Metadata Only'], whale_investors:['Metadata Only']
  }};
  return { data:payload, status:200, statusText:'OK', headers:{}, config };
};
async function call(handler: typeof verify, body?: unknown, ticker = 'TEST.JK') {
  let status = 200;
  let payload: any;
  const res = {status(value: number) {status = value; return this;}, json(value: unknown) {payload = value;}} as VercelResponse;
  await handler({method: body ? 'POST':'GET', body, query:{ticker}, headers:{'x-forwarded-for':'test-client'}} as VercelRequest, res);
  return {status, payload};
}
const candidate = (ticker: string, screenerName: string) => ({ticker, screenerName, companyName:'Test company'});
const checked = await call(verify, {candidates:[candidate('TEST.JK','  pt  exact holder '), candidate('META.JK','Metadata Only'), candidate('PART.JK','PT Exact')]});
assert.equal(checked.payload.results[0].status, 'confirmed');
assert.equal(checked.payload.results[0].sharePercentage, 0.25);
assert.equal(checked.payload.results[1].status, 'mismatch', 'Metadata must never confirm ownership');
assert.equal(checked.payload.results[2].status, 'mismatch', 'Partial names must not be fuzzy-confirmed');
const before = upstreamCalls;
const capped = await call(verify, {maxBatch:200, candidates:['AAAA','BBBB','CCCC','DDDD','EEEE','FFFF'].map(t => candidate(t+'.JK','PT Exact Holder'))});
assert.equal(capped.payload.processed, 5);
assert.equal(capped.payload.limited, true);
assert.equal(upstreamCalls-before, 5, 'Cap must apply before upstream calls');
assert.equal((await call(verify,{candidates:[candidate('BAD/PATH','PT Exact Holder')]})).status,400);
const owners = (await call(ownership)).payload.holders;
assert.equal(owners.length,3,'Keep aggregate holdings visible');
assert.equal(owners[0].shareValue,null);
assert.equal(owners[1].sharePercentage,null,'Missing is not zero');
assert.equal(owners[2].sharePercentage,0,'A reported zero remains zero');
const comp = (await call(composition)).payload.latestSnapshot;
assert.equal(comp.date,'2026-08-31');
assert.equal(comp.local.total,25);
assert.equal(comp.foreign.total,50);
assert.equal(comp.local.insurance,null);
assert.equal(comp.changeInShareholders,-2);
console.log('✓ Exact trace matching, metadata exclusion, batch cap, null preservation, aggregate holdings, nested composition');
