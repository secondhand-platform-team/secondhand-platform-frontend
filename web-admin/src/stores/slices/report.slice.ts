import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import http from "../../utils/api";
import type { ReportResponse, ReportListResponse } from "../../types/report.type";

interface ReportState {
  reports: ReportResponse[];
  staffReports: ReportResponse[];
  selectedReport: ReportResponse | null;
  pendingCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: ReportState = {
  reports: [],
  staffReports: [],
  selectedReport: null,
  pendingCount: 0,
  loading: false,
  error: null,
};

export const fetchPendingReports = createAsyncThunk<
  ReportListResponse,
  { page: number; size: number },
  { rejectValue: string }
>("report/fetchPendingReports", async ({ page, size }, { rejectWithValue }) => {
  try {
    const response = await http.get(
      `/reports/admin/status/PENDING?page=${page}&size=${size}`,
      { headers: { "X-Service": "core" } }
  
    );
    return response as ReportListResponse;
  } catch (error: any) {
    return rejectWithValue(error.message || "Không thể lấy danh sách báo cáo chờ xử lý");
  }
});

export const fetchReportDetail = createAsyncThunk<
  ReportResponse,
  string,
  { rejectValue: string }
>("report/fetchReportDetail", async (reportId, { rejectWithValue }) => {
  try {
    const response = await http.get(`/reports/admin/${reportId}`, {
      headers: { "X-Service": "core" },
    });
    return response as ReportResponse;
  } catch (error: any) {
    return rejectWithValue(error.message || "Không thể lấy chi tiết báo cáo");
  }
});

export const assignReportToStaff = createAsyncThunk<
  ReportResponse,
  { reportId: string; staffId: string },
  { rejectValue: string }
>("report/assignToStaff", async ({ reportId, staffId }, { rejectWithValue }) => {
  try {
    const response = await http.patch(
      `/reports/admin/${reportId}/assign-staff?staffId=${staffId}`,
      {},
      { headers: { "X-Service": "core" } }
    );
    return response as ReportResponse;
  } catch (error: any) {
    return rejectWithValue(error.message || "Không thể nhận báo cáo");
  }
});

export const updateReportStatus = createAsyncThunk<
  ReportResponse,
  { reportId: string; status: string; adminNote: string },
  { rejectValue: string }
>("report/updateStatus", async ({ reportId, status, adminNote }, { rejectWithValue }) => {
  try {
    const response = await http.patch(
      `/reports/admin/${reportId}/status?status=${status}&adminNote=${encodeURIComponent(adminNote)}`,
      {},
      { headers: { "X-Service": "core" } }
    );
    return response as ReportResponse;
  } catch (error: any) {
    return rejectWithValue(error.message || "Không thể cập nhật trạng thái báo cáo");
  }
});

export const fetchPendingCount = createAsyncThunk<
  number,
  void,
  { rejectValue: string }
>("report/fetchPendingCount", async (_, { rejectWithValue }) => {
  try {
    const response = await http.get("/reports/admin/stats/pending-count", {
      headers: { "X-Service": "core" },
    });
    return response as number;
  } catch (error: any) {
    return rejectWithValue(error.message || "Không thể lấy số báo cáo chờ xử lý");
  }
});

export const fetchStaffReports = createAsyncThunk<
  ReportListResponse,
  { staffId: string; page: number; size: number },
  { rejectValue: string }
>("report/fetchStaffReports", async ({ staffId, page, size }, { rejectWithValue }) => {
  try {
    const response = await http.get(
      `/reports/admin/staff/${staffId}?page=${page}&size=${size}`,
      { headers: { "X-Service": "core" } }
    );
    return response as ReportListResponse;
  } catch (error: any) {
    return rejectWithValue(error.message || "Không thể lấy danh sách báo cáo của nhân viên");
  }
});

const reportSlice = createSlice({
  name: "report",
  initialState,
  reducers: {
    clearSelectedReport: (state) => {
      state.selectedReport = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Pending Reports
      .addCase(fetchPendingReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload.content;
      })
      .addCase(fetchPendingReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi";
      })
      // Fetch Report Detail
      .addCase(fetchReportDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReportDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedReport = action.payload;
      })
      .addCase(fetchReportDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi";
      })
      // Assign to Staff
      .addCase(assignReportToStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignReportToStaff.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.reports.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.reports[index] = action.payload;
        }
        if (state.selectedReport?.id === action.payload.id) {
          state.selectedReport = action.payload;
        }
      })
      .addCase(assignReportToStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi";
      })
      // Update Status
      .addCase(updateReportStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateReportStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.reports.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.reports[index] = action.payload;
        }
        if (state.selectedReport?.id === action.payload.id) {
          state.selectedReport = action.payload;
        }
      })
      .addCase(updateReportStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi";
      })
      // Fetch Pending Count
      .addCase(fetchPendingCount.fulfilled, (state, action) => {
        state.pendingCount = action.payload;
      })
      // Fetch Staff Reports
      .addCase(fetchStaffReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStaffReports.fulfilled, (state, action) => {
        state.loading = false;
        state.staffReports = action.payload.content;
      })
      .addCase(fetchStaffReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi";
      });
  },
});

export const { clearSelectedReport } = reportSlice.actions;
export default reportSlice.reducer;
