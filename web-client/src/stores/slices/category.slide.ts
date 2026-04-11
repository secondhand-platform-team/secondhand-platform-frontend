"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import http from "@/utils/api";
import type { CategoryType, ItemResponseType } from "@/types/item/item.type";

type CategoryState = {
    loading: boolean;
    error: string | null;
    topCategories: CategoryType[];
    childCategories: CategoryType[];
    productsByCategory: ItemResponseType[];
    productsByParentAndChildren: ItemResponseType[];
    selectedParent: CategoryType | null;
    selectedChild: CategoryType | null;
};

const initialState: CategoryState = {
    loading: false,
    error: null,
    topCategories: [],
    childCategories: [],
    productsByCategory: [],
    productsByParentAndChildren: [],
    selectedParent: null,
    selectedChild: null,
};

const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return fallback;
};

export const fetchTopCategories = createAsyncThunk<
    CategoryType[],
    void,
    { rejectValue: string }
>("category/fetchTopCategories", async (_, { rejectWithValue }) => {
    try {
        return await http.get<CategoryType[]>("/core/api/categories/top-level");
    } catch (error) {
        return rejectWithValue(getErrorMessage(error, "Không thể tải danh mục cấp cao nhất"));
    }
});

export const fetchParentCategoryBySlug = createAsyncThunk<
    CategoryType,
    string,
    { rejectValue: string }
>("category/fetchParentCategoryBySlug", async (slug, { rejectWithValue }) => {
    try {
        return await http.get<CategoryType>(`/core/api/categories/slug/${slug}`);
    } catch (error) {
        return rejectWithValue(getErrorMessage(error, "Không thể tải thông tin danh mục"));
    }
});

export const fetchChildCategoryBySlug = createAsyncThunk<
    CategoryType,
    string,
    { rejectValue: string }
>("category/fetchChildCategoryBySlug", async (slug, { rejectWithValue }) => {
    try {
        return await http.get<CategoryType>(`/core/api/categories/slug/${slug}`);
    } catch (error) {
        return rejectWithValue(getErrorMessage(error, "Không thể tải thông tin danh mục con"));
    }
});

export const fetchChildCategoriesByParentSlug = createAsyncThunk<
    CategoryType[],
    string,
    { rejectValue: string }
>("category/fetchChildCategoriesByParentSlug", async (slug, { rejectWithValue }) => {
    try {
        return await http.get<CategoryType[]>(`/core/api/categories/slug/${slug}/children`);
    } catch (error) {
        return rejectWithValue(getErrorMessage(error, "Không thể tải danh mục con"));
    }
});

export const fetchProductsByCategorySlug = createAsyncThunk<
    ItemResponseType[],
    string,
    { rejectValue: string }
>("category/fetchProductsByCategorySlug", async (slug, { rejectWithValue }) => {
    try {
        return await http.get<ItemResponseType[]>(`/core/api/items/category/slug/${slug}`);
    } catch (error) {
        return rejectWithValue(getErrorMessage(error, "Không thể tải sản phẩm theo danh mục"));
    }
});

export const fetchProductsByParentAndChildrenSlug = createAsyncThunk<
    ItemResponseType[],
    string,
    { rejectValue: string }
>("category/fetchProductsByParentAndChildrenSlug", async (parentSlug, { rejectWithValue }) => {
    try {
        const parent = await http.get<CategoryType>(`/core/api/categories/slug/${parentSlug}`);
        const children = await http.get<CategoryType[]>(`/core/api/categories/slug/${parentSlug}/children`);

        const slugs = [parent.slug, ...children.map((child) => child.slug)].filter(
            (slug): slug is string => Boolean(slug),
        );

        const productsBySlug = await Promise.all(
            slugs.map((slug) => http.get<ItemResponseType[]>(`/core/api/items/category/slug/${slug}`)),
        );

        const merged = productsBySlug.flat();
        const uniqueById = new Map(merged.map((item) => [item.itemId, item]));

        return Array.from(uniqueById.values());
    } catch (error) {
        return rejectWithValue(getErrorMessage(error, "Không thể tải sản phẩm của danh mục"));
    }
});

const categorySlice = createSlice({
    name: "category",
    initialState,
    reducers: {
        clearCategoryError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTopCategories.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTopCategories.fulfilled, (state, action) => {
                state.loading = false;
                state.topCategories = action.payload;
            })
            .addCase(fetchTopCategories.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Không thể tải danh mục cấp cao nhất";
            })

            .addCase(fetchParentCategoryBySlug.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchParentCategoryBySlug.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedParent = action.payload;
            })
            .addCase(fetchParentCategoryBySlug.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Không thể tải thông tin danh mục";
            })

            .addCase(fetchChildCategoryBySlug.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchChildCategoryBySlug.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedChild = action.payload;
            })
            .addCase(fetchChildCategoryBySlug.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Không thể tải thông tin danh mục con";
            })

            .addCase(fetchChildCategoriesByParentSlug.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchChildCategoriesByParentSlug.fulfilled, (state, action) => {
                state.loading = false;
                state.childCategories = action.payload;
            })
            .addCase(fetchChildCategoriesByParentSlug.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Không thể tải danh mục con";
            })

            .addCase(fetchProductsByCategorySlug.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProductsByCategorySlug.fulfilled, (state, action) => {
                state.loading = false;
                state.productsByCategory = action.payload;
            })
            .addCase(fetchProductsByCategorySlug.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Không thể tải sản phẩm theo danh mục";
            })

            .addCase(fetchProductsByParentAndChildrenSlug.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProductsByParentAndChildrenSlug.fulfilled, (state, action) => {
                state.loading = false;
                state.productsByParentAndChildren = action.payload;
            })
            .addCase(fetchProductsByParentAndChildrenSlug.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Không thể tải sản phẩm của danh mục";
            });
    },
});

export const { clearCategoryError } = categorySlice.actions;
export default categorySlice.reducer;
