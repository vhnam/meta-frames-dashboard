import { useQuery } from '@tanstack/vue-query';
import { toValue, type MaybeRefOrGetter } from 'vue';

import { cameraKeys } from '#/features/cameras';
import { labOrderKeys } from '#/features/lab-orders/api';
import { rollKeys } from '#/features/rolls/api';
import { useApiMutation } from '#/shared/api/mutation';

import { deleteStock, saveStock, stockKeys, stockQueries } from './api';

export const useStockList = () => useQuery(stockQueries.list());
export const useStockDetail = (id: MaybeRefOrGetter<string>) =>
  useQuery(() => stockQueries.detail(toValue(id)));

export const useSaveStock = () =>
  useApiMutation({
    fn: saveStock,
    // rolls, loaded cameras and lab orders embed the stock name
    invalidates: (variables) =>
      variables.id
        ? [stockKeys.all, rollKeys.all, cameraKeys.lists(), labOrderKeys.all]
        : [stockKeys.all],
    success: (variables) => (variables.id ? 'Stock updated' : 'Stock added'),
  });

export const useDeleteStock = () =>
  useApiMutation({
    fn: deleteStock,
    invalidates: () => [stockKeys.all],
    success: 'Stock deleted',
  });
