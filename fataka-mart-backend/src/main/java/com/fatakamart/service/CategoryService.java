package com.fatakamart.service;

import com.fatakamart.dto.CategoryDTO;

import java.util.List;

public interface CategoryService {
    List<CategoryDTO> getAllActiveCategories();
    List<CategoryDTO> getAllCategoriesAdmin();
    CategoryDTO getCategoryBySlug(String slug);
    CategoryDTO getCategoryById(Long id);
    CategoryDTO createCategory(CategoryDTO categoryDTO);
    CategoryDTO updateCategory(Long id, CategoryDTO categoryDTO);
    void deleteCategory(Long id);
}
