"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Eye, Pencil, Trash2, FileDown, Loader2 } from "lucide-react";
import { formatPKR } from "@/lib/zakatCalculator";
import { generateZakatPDF } from "@/lib/pdfGenerator";
import { useAuth } from "@/providers/AuthProvider";
import api from "@/lib/api";
import { toast } from "sonner";
import type { ZakatRecord } from "@/types";

interface ZakatTableProps {
  records: ZakatRecord[];
  loading: boolean;
  onEdit: (record: ZakatRecord) => void;
  onDelete: (id: string) => Promise<void>;
}

export function ZakatTable({ records, loading, onEdit, onDelete }: ZakatTableProps) {
  const { user } = useAuth();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);

  const handleDownloadPDF = async (recordId: string) => {
    if (!user) return;
    setPdfLoadingId(recordId);
    try {
      const { data } = await api.get(`/zakat/${recordId}`);
      generateZakatPDF(data.data, user.name);
      toast.success("PDF downloaded successfully");
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setPdfLoadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await onDelete(deleteId);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No zakat records found</p>
        <p className="text-sm text-muted-foreground mt-1">Create your first record to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Year (Hijri)</TableHead>
              <TableHead>Year (CE)</TableHead>
              <TableHead className="text-right">Total Assets</TableHead>
              <TableHead className="text-right">Net Assets</TableHead>
              <TableHead className="text-right">Zakat Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{record.yearHijri} AH</TableCell>
                <TableCell>{record.yearGregorian}</TableCell>
                <TableCell className="text-right">{formatPKR(record.totalAssets)}</TableCell>
                <TableCell className="text-right">{formatPKR(record.netAssets)}</TableCell>
                <TableCell className="text-right font-semibold">{formatPKR(record.zakatDue)}</TableCell>
                <TableCell>
                  <Badge variant={record.netAssets >= record.nisabValue ? "default" : "secondary"}>
                    {record.netAssets >= record.nisabValue ? "Payable" : "Exempt"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownloadPDF(record.id)}
                      disabled={pdfLoadingId === record.id}
                      title="Download PDF"
                    >
                      {pdfLoadingId === record.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileDown className="h-4 w-4" />
                      )}
                    </Button>
                    <Link href={`/records/${record.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(record)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeleteId(record.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Record</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">Are you sure you want to delete this zakat record? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
