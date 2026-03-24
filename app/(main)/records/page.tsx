"use client";

import { useState } from "react";
import { useZakat } from "@/hooks/useZakat";
import api from "@/lib/api";
import { ZakatFormModal } from "@/components/zakat/ZakatFormModal";
import { RecordInitModal } from "@/components/zakat/RecordInitModal";
import { ZakatTable } from "@/components/zakat/ZakatTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { ZakatRecord } from "@/types";
import type { ZakatFormData } from "@/schemas/zakat.schema";

export default function RecordsPage() {
  const [yearFilter, setYearFilter] = useState<string>("");
  const [initModalOpen, setInitModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<ZakatRecord | null>(null);
  const [prefillData, setPrefillData] = useState<ZakatFormData | null>(null);

  const filters = yearFilter ? { year: Number(yearFilter) } : undefined;
  const { records, loading, createRecord, updateRecord, deleteRecord } = useZakat(filters);

  // Also fetch ALL records (unfiltered) for the init modal
  const allRecords = useZakat();

  const handleNewRecord = () => {
    setEditRecord(null);
    setPrefillData(null);

    // If no records exist, skip init modal → go straight to empty form
    if (allRecords.records.length === 0) {
      setFormModalOpen(true);
    } else {
      setInitModalOpen(true);
    }
  };

  const handleInitSelect = (prefill: ZakatFormData | null) => {
    setPrefillData(prefill);
    setEditRecord(null);
    setFormModalOpen(true);
  };

  const handleEdit = async (record: ZakatRecord) => {
    try {
      // Fetch the full record with items from the API
      const { data } = await api.get(`/zakat/${record.id}`);
      setEditRecord(data.data);
      setPrefillData(null);
      setFormModalOpen(true);
    } catch {
      toast.error("Failed to load record for editing");
    }
  };

  const handleDelete = async (id: string) => {
    await deleteRecord(id);
    toast.success("Record deleted");
  };

  const handleSubmit = async (data: any) => {
    if (editRecord) {
      await updateRecord(editRecord.id, data);
    } else {
      await createRecord(data);
    }
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormModalOpen(open);
    if (!open) {
      setEditRecord(null);
      setPrefillData(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Zakat Records</h1>
          <p className="text-muted-foreground">Manage your yearly zakat calculations</p>
        </div>
        <Button onClick={handleNewRecord}>
          <Plus className="mr-2 h-4 w-4" /> New Record
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Filter by year (e.g. 2024)"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="max-w-xs"
          type="number"
        />
        {yearFilter && (
          <Button variant="ghost" onClick={() => setYearFilter("")}>Clear</Button>
        )}
      </div>

      <ZakatTable
        records={records}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Init Modal: Choose how to start */}
      <RecordInitModal
        open={initModalOpen}
        onOpenChange={setInitModalOpen}
        records={allRecords.records}
        loading={allRecords.loading}
        onSelect={handleInitSelect}
      />

      {/* Form Modal: Create / Edit */}
      <ZakatFormModal
        open={formModalOpen}
        onOpenChange={handleFormOpenChange}
        record={editRecord}
        prefillData={prefillData}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
