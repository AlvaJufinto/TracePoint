import * as fixtureApi from './trace-fixture-api';
import * as liveApi from './tracepoint-api';

const traceApi = import.meta.env.VITE_TRACE_DATA_SOURCE === 'fixtures'
  ? fixtureApi
  : liveApi;

export const getCompanyOverview = traceApi.getCompanyOverview;
export const getCompanyOwnership = traceApi.getCompanyOwnership;
export const getCompanyManagement = traceApi.getCompanyManagement;
export const getFreeFloat = traceApi.getFreeFloat;
export const getShareholderComposition = traceApi.getShareholderComposition;
export const getCorporateActions = traceApi.getCorporateActions;
export const searchByShareholderName = traceApi.searchByShareholderName;
export const verifyTraceCandidates = traceApi.verifyTraceCandidates;
