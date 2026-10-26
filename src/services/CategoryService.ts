import http, { type HttpRequestConfig } from "../infra/Http.ts";

/**
 * 分类列表项
 */
export interface CategoryItem {
    id: string | number;
    name: string;
    url: string;
    color: string;
    icon: string;
    description: string;
    parent_id: string | number;
    status: number;
    user_id?: string | number;
    author?: string;
    article_count: number;
    view_count: number;
    create_time: number;
    update_time: number;
}

/**
 * 查询分类响应类型
 */
export interface CategoryInfo {
    id: any;
    name: any;
    color: string;
    total: number;
    list: CategoryItem[];
}

/**
 * 删除分类请求参数类型
 */
export interface DeleteCategoryParams {
    ids: string; // 逗号分隔的分类id字符串
    user_id?: string | number; // 管理端按用户范围删除
}

/**
 * 删除分类响应类型
 */
export interface DeleteCategoryResponse {
    ids: Array<string | number>;
}

/**
 * 创建分类请求参数类型
 */
export interface CreateCategoryParams {
    id?: string | number;
    user_id?: string | number; // 管理端指定归属用户
    name: string;
    url: string;
    color: string;
    icon: string;
    description?: string;
    parent_id?: string | number;
    status?: number;
}

/**
 * 创建分类响应类型
 */
export interface CreateCategoryResponse {
    id: string | number;
    user_id?: string | number;
    name: string;
    color: string;
    parent_id: string | number;
    status?: number;
}

/**
 * 分类服务类
 * 专门处理分类相关操作
 */
export class CategoryService {
    /**
     * 查询当前登录用户的分类（用户端）
     */
    static async queryMyCategory(config?: HttpRequestConfig): Promise<CategoryInfo> {
        const response = await http.get<CategoryInfo>("/category/query", config);
        return response.data;
    }

    /**
     * 查询指定用户的分类（用户端，只读）
     */
    static async queryCategoriesByUser(userId: string | number, config?: HttpRequestConfig): Promise<CategoryInfo> {
        const response = await http.get<CategoryInfo>("/category/query", {
            ...config,
            params: {
                ...(config?.params ?? {}),
                user_id: userId,
            },
        });
        return response.data;
    }

    /**
     * 查询分类详情（管理端，默认返回全部用户分类）
     */
    static async queryCategory(config?: HttpRequestConfig): Promise<CategoryInfo> {
        const response = await http.get<CategoryInfo>("/category/admin/query", config);
        return response.data;
    }

    /**
     * 删除当前用户的分类（用户端）
     */
    static async deleteMyCategory(params: DeleteCategoryParams): Promise<DeleteCategoryResponse> {
        return CategoryService.deleteCategoryRequest("/category/delete", params);
    }

    /**
     * 删除分类（管理端，可删除任意用户分类）
     */
    static async deleteCategory(params: DeleteCategoryParams): Promise<DeleteCategoryResponse> {
        return CategoryService.deleteCategoryRequest("/category/admin/delete", params);
    }

    /**
     * 创建/编辑当前用户的分类（用户端）
     */
    static async createMyCategory(params: CreateCategoryParams): Promise<CreateCategoryResponse> {
        return CategoryService.createCategoryRequest("/category/create", params);
    }

    /**
     * 创建/编辑分类（管理端，可通过 user_id 指定归属用户）
     */
    static async createCategory(params: CreateCategoryParams): Promise<CreateCategoryResponse> {
        return CategoryService.createCategoryRequest("/category/admin/create", params);
    }

    private static async deleteCategoryRequest(url: string, params: DeleteCategoryParams): Promise<DeleteCategoryResponse> {
        const formData = new URLSearchParams();
        formData.append("ids", params.ids);
        if (params.user_id !== undefined && params.user_id !== null && params.user_id !== "") {
            formData.append("user_id", String(params.user_id));
        }
        const response = await http.postForm<DeleteCategoryResponse>(url, formData);
        return response.data;
    }

    private static async createCategoryRequest(url: string, params: CreateCategoryParams): Promise<CreateCategoryResponse> {
        const formData = new URLSearchParams();
        if (params.id !== undefined && params.id !== null && params.id !== "") {
            formData.append("id", String(params.id));
        }
        if (params.user_id !== undefined && params.user_id !== null && params.user_id !== "") {
            formData.append("user_id", String(params.user_id));
        }
        formData.append("name", params.name);
        formData.append("color", params.color);
        formData.append("icon", params.icon);
        formData.append("url", params.url);
        if (params.description) {
            formData.append("desc", params.description);
        }
        if (params.status !== undefined) {
            formData.append("status", String(params.status));
        }
        if (params.parent_id !== undefined && params.parent_id !== null && params.parent_id !== "") {
            formData.append("parent_id", String(params.parent_id));
        }
        const response = await http.postForm<CreateCategoryResponse>(url, formData);
        return response.data;
    }
}

export default CategoryService;
