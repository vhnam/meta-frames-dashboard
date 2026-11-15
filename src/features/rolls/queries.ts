import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { toValue, type MaybeRefOrGetter } from 'vue';

import { cameraKeys } from '#/features/cameras';
import { stockKeys } from '#/features/film-stocks';
import { labOrderKeys } from '#/features/lab-orders/api';
import { labKeys } from '#/features/labs';
import { useApiMutation } from '#/shared/api/mutation';

import {
  addRolls,
  deleteJob,
  deleteRoll,
  finishRoll,
  handOverRolls,
  loadRoll,
  markRollDeveloped,
  recordNegativesReturned,
  recordScansReceived,
  rollKeys,
  returnHandoff,
  rollQueries,
  sendToLab,
  setRollLenses,
  setRollPlan,
  setScanRequest,
  updateJob,
  updateRoll,
} from './api';
import type { RollFilters } from './types';

export const useRollList = (filters: MaybeRefOrGetter<RollFilters>) =>
  useQuery(() => ({ ...rollQueries.list(toValue(filters)), placeholderData: keepPreviousData }));
export const useRollDetail = (id: MaybeRefOrGetter<string | undefined>) =>
  useQuery(() => ({ ...rollQueries.detail(toValue(id) ?? ''), enabled: !!toValue(id) }));
export const useExpiryReport = () => useQuery(rollQueries.expiry());

export const useAddRolls = () =>
  useApiMutation({
    fn: addRolls,
    // new in-stock rolls change lists, expiry and inventory
    invalidates: () => [rollKeys.lists(), rollKeys.expiry(), stockKeys.all],
    success: (_v, count) => `${count} roll${count === 1 ? '' : 's'} added`,
  });

export const useUpdateRoll = () =>
  useApiMutation({
    fn: updateRoll,
    invalidates: (variables) => [
      rollKeys.detail(variables.row.roll.id),
      rollKeys.lists(),
      rollKeys.expiry(),
      stockKeys.all,
      cameraKeys.lists(),
      // lab order lines show the roll's format and exposures
      labOrderKeys.all,
    ],
    success: 'Roll updated',
  });

export const useLoadRoll = () =>
  useApiMutation({
    fn: loadRoll,
    invalidates: (variables) => [
      rollKeys.detail(variables.id),
      rollKeys.lists(),
      rollKeys.expiry(),
      stockKeys.all,
      cameraKeys.all,
    ],
    success: 'Roll loaded into camera',
  });

export const useSendToLab = () =>
  useApiMutation({
    fn: sendToLab,
    invalidates: (variables) => [
      rollKeys.detail(variables.rollId),
      rollKeys.lists(),
      rollKeys.expiry(),
      labKeys.all,
      labOrderKeys.all,
    ],
    success: (variables) => (variables.input.labId ? 'Roll sent to lab' : 'Processing recorded'),
  });

export const useHandOverRolls = () =>
  useApiMutation({
    fn: handOverRolls,
    // every handed roll changes: lists, each detail, and the labs' in-progress lists
    invalidates: () => [rollKeys.all, labKeys.all, labOrderKeys.all],
    success: (_variables, count) => `${count} roll${count === 1 ? '' : 's'} handed to the lab`,
  });

/** A job change moves the roll status and the lab's in-progress list. */
const jobInvalidates = (variables: { rollId: string }) => [
  rollKeys.detail(variables.rollId),
  rollKeys.lists(),
  rollKeys.expiry(),
  labKeys.all,
  labOrderKeys.all,
];

export const useUpdateJob = () =>
  useApiMutation({ fn: updateJob, invalidates: jobInvalidates, success: 'Processing job updated' });

export const useRecordScansReceived = () =>
  useApiMutation({
    fn: recordScansReceived,
    invalidates: jobInvalidates,
    success: 'Scans marked as received',
  });

export const useRecordNegativesReturned = () =>
  useApiMutation({
    fn: recordNegativesReturned,
    invalidates: jobInvalidates,
    success: 'Negatives marked as returned',
  });

export const useDeleteJob = () =>
  useApiMutation({ fn: deleteJob, invalidates: jobInvalidates, success: 'Processing job deleted' });

export const useMarkDeveloped = () =>
  useApiMutation({
    fn: markRollDeveloped,
    invalidates: jobInvalidates,
    success: 'Marked as developed',
  });

export const useReturnHandoff = () =>
  useApiMutation({
    fn: returnHandoff,
    invalidates: jobInvalidates,
    success: 'Negatives marked as returned',
  });

/** The plan and the scan mark change the roll's stage, filters and badge only. */
const planInvalidates = (variables: { rollId: string }) => [
  rollKeys.detail(variables.rollId),
  rollKeys.lists(),
];

export const useSetRollPlan = () =>
  useApiMutation({ fn: setRollPlan, invalidates: planInvalidates, success: 'Plan saved' });

export const useSetScanRequest = () =>
  useApiMutation({
    fn: setScanRequest,
    invalidates: planInvalidates,
    success: (_variables, needed) => (needed ? 'Marked as needs scan' : 'Needs scan mark removed'),
  });

export const useFinishRoll = () =>
  useApiMutation({
    fn: finishRoll,
    invalidates: ({ id }) => [rollKeys.detail(id), rollKeys.lists(), stockKeys.all, cameraKeys.all],
    success: 'Roll marked as finished',
  });

export const useSetRollLenses = () =>
  useApiMutation({
    fn: setRollLenses,
    // lens pages list rolls filtered by lensId
    invalidates: (variables) => [rollKeys.detail(variables.id), rollKeys.lists()],
    success: 'Lenses updated',
  });

export const useDeleteRoll = () =>
  useApiMutation({
    fn: deleteRoll,
    invalidates: () => [rollKeys.all, stockKeys.all, cameraKeys.lists()],
    success: 'Roll deleted',
  });
