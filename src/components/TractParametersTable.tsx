import { useMemo } from "react";
import { Box } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import useAppStore from "../useAppStore";

type AnyRow = Record<string, any>;

function TractParametersTable({ trafficState, alignLeft }: { trafficState: any, alignLeft?: boolean }) {
  const theme = useAppStore((s) => s.theme);

  const headers: string[] = trafficState.trafficMFTParametersHeaders ?? [];
  const rawData = trafficState.trafficMFTParametersData ?? [];

  // Build columns from headers, add S.No column
  const columns: GridColDef[] = useMemo(() => {
    // Default to center unless alignLeft is true
    const align = alignLeft ? 'left' : 'center';
    
    // S.No Column (Grey background to match header)
    const snoCol: GridColDef = {
      field: 'sno',
      headerName: '',
      width: 50,
      sortable: false,
      align: 'center', 
      headerAlign: 'center',
      cellClassName: 'sno-cell',
      resizable: false,
      disableColumnReorder: true,
    };
    
    const baseColumns = headers.map((h) => {
      const name = h === "R^2" ? "R²" : String(h);
      const lowerName = name.toLowerCase();

      // 1. Tract ID column logic
      if (lowerName.includes('tract id')) {
        const width = Math.max(90, Math.min(150, name.length * 10 + 20));
        return {
          field: String(h),
          headerName: name,
          minWidth: width,
          maxWidth: width,
          width,
          sortable: false,
          headerClassName: 'custom-header',
          align,
          headerAlign: align,
          resizable: false,
          disableColumnReorder: true,
        };
      } 
      // 2. Shape Parameter logic - INCREASED WIDTH FIX
      else if (lowerName.includes('shape parameter')) {
        // Increased from 110 to 140 to prevent "Shape Param..." truncation
        const width = 140; 
        return {
          field: String(h),
          headerName: name,
          minWidth: width,
          maxWidth: width,
          width,
          sortable: false,
          headerClassName: 'custom-header',
          align,
          headerAlign: align,
          resizable: false,
          disableColumnReorder: true,
        };
      }
      else {
        // Other columns
        const charWidth = 9;
        const width = Math.max(60, Math.min(200, name.length * charWidth));
        return {
          field: String(h),
          headerName: name,
          minWidth: width,
          maxWidth: width,
          width,
          sortable: false,
          headerClassName: 'custom-header',
          align,
          headerAlign: align,
          resizable: false,
          disableColumnReorder: true,
        };
      }
    });
    return [snoCol, ...baseColumns];
  }, [headers, alignLeft]);

  // Normalize rows
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

  return allRows.length ? (
    <Box
      className="min-w-[60%]"
      sx={{ minHeight: 0 }} 
    >
      <div style={{ height: 400, width: "100%" }}>
        <DataGrid
          rows={allRows}
          columns={columns}
          getRowId={(r) => r.id}
          disableColumnMenu
          disableRowSelectionOnClick
          checkboxSelection={false}
          slots={{ footer: () => null }}
          disableColumnReorder
          disableColumnResize
          
          // --- COMPACT HEIGHTS ---
          rowHeight={28} 
          columnHeaderHeight={30}
          
          sx={{
            border: '1px solid #cccccc',
            borderRadius: 0, 
            
            // --- FONT FIX: SEGOE UI (Flat Top "3") ---
            fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important',
            fontSize: '13px !important',
            letterSpacing: 'normal !important', 
            lineHeight: 'normal !important',
            color: '#000000 !important', 
            
            // --- HEADER ROW STYLING (First Row - GREY) ---
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: theme === "dark" ? "#333" : "#f0f0f0 !important", 
              borderBottom: '1px solid #cccccc',
              minHeight: '30px !important',
              maxHeight: '30px !important',
              lineHeight: '30px !important',
            },
            "& .MuiDataGrid-columnHeader": {
              borderRight: '1px solid #cccccc',
              textTransform: 'none',
              height: '30px !important',
              fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important',
              fontWeight: '700 !important',
              fontSize: '13px !important',
              letterSpacing: 'normal !important',
              color: theme === "dark" ? "#fff" : "#000000 !important",
              backgroundColor: theme === "dark" ? "#333" : "#f0f0f0 !important",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: "700 !important", 
              fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important',
              fontSize: '13px !important',
              letterSpacing: 'normal !important',
              color: theme === "dark" ? "#fff" : "#000000 !important",
            },
            "& .MuiDataGrid-columnHeader:focus": {
              outline: "none",
            },
            "& .MuiDataGrid-columnHeader:last-child": {
              borderRight: 'none',
            },

            // --- FIRST COLUMN (S.No) STYLING (First Col - GREY) ---
            "& .sno-cell": {
              backgroundColor: theme === "dark" ? "#1f2937" : "#f0f0f0 !important", 
              color: theme === "dark" ? "#9ca3af" : "#000000 !important",
              borderRight: '1px solid #cccccc',
              fontWeight: '400 !important', 
              textAlign: 'center !important',
              justifyContent: 'center !important',
              display: 'flex !important',
              letterSpacing: 'normal !important',
            },

            // --- DATA CELL STYLING ---
            "& .MuiDataGrid-cell": {
              borderRight: '1px solid #e5e5e5', 
              borderBottom: '1px solid #e5e5e5',
              textAlign: alignLeft ? 'left' : 'center',
              paddingLeft: '5px !important',
              fontWeight: '400 !important', 
              fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important',
              fontSize: '13px !important',
              letterSpacing: 'normal !important', 
              lineHeight: 'normal !important', 
              color: theme === "dark" ? "#e5e7eb" : "#000000 !important",
            },
            // Explicit White Background for Data Cells (excluding S.No)
            "& .MuiDataGrid-row > .MuiDataGrid-cell:not(.sno-cell)": {
               backgroundColor: theme === "dark" ? "#18181b" : "#ffffff !important",
            },

            "& .MuiDataGrid-cell:focus": {
              outline: "none",
            },
            
            // --- CLEANUP ---
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