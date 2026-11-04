<script setup lang="ts">
import { useLabOrderList } from "../queries";
import { rollsOnOrder } from "../types";
import type { LabOrder } from "../types";
import { useRouter } from "@tanstack/vue-router";
import { ref } from "vue";
import AddButton from "#/shared/components/AddButton.vue";
import DataTable from "#/shared/components/DataTable.vue";
import type { DataTableColumn } from "#/shared/components/dataTable";
import PageHeader from "#/shared/components/PageHeader.vue";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";
import { mutedCell, primaryText } from "#/shared/components/tableCells";
import { formatDate, formatVnd } from "#/shared/lib/format";
import LabOrderFormDialog from "../components/LabOrderFormDialog.vue";

const router = useRouter();
const orders = useLabOrderList();
const open = ref(false);

const rollCount = (order: LabOrder) => String(rollsOnOrder(order).rolls);

const columns: DataTableColumn<LabOrder>[] = [
  {
    id: "code",
    header: "Order",
    accessorFn: (order) => order.code,
    cell: ({ row }) => primaryText(`#${row.original.code}`),
  },
  {
    id: "lab",
    header: "Lab",
    accessorFn: (order) => order.labName,
    cell: ({ row }) => mutedCell(row.original.labName),
  },
  {
    id: "orderedAt",
    header: "Date",
    accessorFn: (order) => order.orderedAt,
    cell: ({ row }) => mutedCell(formatDate(row.original.orderedAt)),
  },
  {
    id: "dueDate",
    header: "Due",
    accessorFn: (order) => order.dueDate ?? "",
    cell: ({ row }) => mutedCell(formatDate(row.original.dueDate)),
  },
  {
    id: "rolls",
    header: "Rolls",
    accessorFn: rollCount,
    cell: ({ row }) => mutedCell(rollCount(row.original)),
  },
  {
    id: "total",
    header: "Total",
    accessorFn: (order) => order.total,
    cell: ({ row }) => primaryText(formatVnd(row.original.total)),
  },
];
</script>

<template>
  <PageHeader title="Orders" description="What each lab billed, and the rolls on each order.">
    <template #actions><AddButton @click="open = true">Add order</AddButton></template>
  </PageHeader>
  <QueryBoundary :query="orders" :is-empty="() => false">
    <template #default="{ data }">
      <DataTable
        empty-title="No orders"
        empty-text="No orders yet."
        filter-label="Order"
        filter-placeholder="Search by code or lab..."
        :columns="columns"
        :data="data"
        :get-row-id="(order) => order.id"
        :on-select="
          (order) => router.navigate({ to: '/app/orders/$orderId', params: { orderId: order.id } })
        "
        :row-label="(order) => `Open order ${order.code}`"
      />
    </template>
  </QueryBoundary>
  <LabOrderFormDialog
    v-model:open="open"
    @saved="(orderId) => router.navigate({ to: '/app/orders/$orderId', params: { orderId } })"
  />
</template>
