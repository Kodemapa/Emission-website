import { useMemo, useState } from "react";
import { Box, Button } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import useAppStore from "../useAppStore";

type AnyRow = Record<string, any>;

function TractParametersTable({ trafficState }: { trafficState: any }) {
  const theme = useAppStore((s) => s.theme);

  const headers: string[] = trafficState.trafficMFTParametersHeaders ?? [];
  const rawData = trafficState.trafficMFTParametersData ?? [];

  // Build columns from headers, add S.No column with no header
  const columns: GridColDef[] = useMemo(() => {
    const snoCol: GridColDef = {
      field: 'sno',
      headerName: '',
      width: 60,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      cellClassName: 'sno-cell',
    };
    const baseColumns = headers.map((h) => ({
      field: String(h),
      headerName: h === "R^2" ? "R²" : String(h), // Use unicode superscript 2 for compatibility
      flex: 1,
      minWidth: 120,
      sortable: false,
      headerClassName: 'custom-header',
      align: 'center',
      headerAlign: 'center',
    }));
    return [snoCol, ...baseColumns];
  }, [headers]);

  // Normalize rows (AoA from Handsontable OR AoO), add S.No
  const allRows: AnyRow[] = useMemo(() => {
    if (!rawData?.length) return [];
    if (Array.isArray(rawData[0])) {
      return (rawData as any[][]).map((arr, idx) => {
        const r: AnyRow = { id: idx + 1, sno: idx + 1 };
        headers.forEach((h, i) => (r[String(h)] = arr[i] ?? null));
        return r;
      });
    }
    return (rawData as AnyRow[]).map((r, idx) => {
      return { id: r.id ?? idx + 1, sno: idx + 1, ...r };
    });
  }, [rawData, headers]);

  const [page, setPage] = useState(1);
  const rowsPerPage = 5;
  const pageCount = Math.ceil(allRows.length / rowsPerPage);

  const paginatedRows = allRows.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleNext = async () => {
    // Send all relevant data to backend
    const payload = {
      city: trafficState.city || '',
      base_year: trafficState.baseYear || '',
      mfd_table_data: trafficState.trafficMFTParametersData,
      mfd_table_headers: trafficState.trafficMFTParametersHeaders,
    };
    try {
      const res = await fetch('http://localhost:5003/upload/mfd_params', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      console.log('Backend response:', data);
      window.dispatchEvent(
        new CustomEvent("app-notification", { detail: { text: "Data uploaded successfully!" } })
      );
      // Optionally show a message or move to next page
    } catch (err) {
      window.dispatchEvent(
        new CustomEvent("app-notification", { detail: { text: "Upload failed: " + (err as Error).message } })
      );
    }
    // Don't change pagination here - this is for step progression
  };
  
  // Pagination functions
  const handlePaginationNext = () => setPage((p: number) => Math.min(p + 1, pageCount));
  const handleBack = () => setPage((p: number) => Math.max(p - 1, 1));

  return allRows.length ? (
    <Box
  className="min-w-[60%]"
  sx={{ minHeight: 0 }}                 // IMPORTANT in flex layouts
>
  <div style={{ height: 400, width: "100%" }}>  {/* fixed height, not maxHeight */}
    <DataGrid
      rows={allRows}
      columns={columns}
      getRowId={(r) => r.id}
      disableColumnMenu
      disableRowSelectionOnClick
      checkboxSelection={false}
      slots={{ footer: () => null }}

      // Let DataGrid manage scrolling; no need to force overflow here
      sx={{
        border: '1px solid #ccc',
        borderRadius: 1,
        textAlign: 'center',
        "& .MuiDataGrid-columnHeaders": {
          backgroundColor: '#f3f4f6',
          borderBottom: '1px solid #ccc',
        },
        "& .MuiDataGrid-columnHeader": {
          borderRight: '1px solid #ccc',
          color: '#121315ff',
          fontWeight: 'bold !important',
          fontFamily: 'Segoe UI Bold, Segoe UI, Arial, sans-serif !important',
          textTransform: 'none',
          backgroundColor: '#f3f4f6',
          textAlign: 'center',
        },
        "& .MuiDataGrid-columnHeader:last-child": {
          borderRight: 'none',
        },
        "& .MuiDataGrid-cell": {
          color: theme === "dark" ? "#e5e7eb" : undefined,
          borderRight: '1px solid #eee',
          borderBottom: '1px solid #eee',
          textAlign: 'center',
        },
        "& .sno-cell": {
          color: '#6b7280',
          backgroundColor: '#f3f4f6',
          fontWeight: 500,
        },
        "& .MuiDataGrid-row:last-child .MuiDataGrid-cell": {
          borderBottom: 'none',
        },
        "& .MuiDataGrid-cell:last-child": {
          borderRight: 'none',
        },
        "& .MuiDataGrid-row:hover": {
          backgroundColor: 'inherit',
        },
      }}
    />
  </div>
</Box>
  ) : (
    <div className="min-w-[60%] flex items-center justify-center h-auto text-gray-500">
      No data
    </div>
  );
}

export default TractParametersTable;