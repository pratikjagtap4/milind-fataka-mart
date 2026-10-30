package com.fatakamart.service.impl;

import com.fatakamart.domain.entity.Category;
import com.fatakamart.dto.CategoryDTO;
import com.fatakamart.repository.CategoryRepository;
import com.fatakamart.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDTO> getAllActiveCategories() {
        return categoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDTO> getAllCategoriesAdmin() {
        return categoryRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryDTO getCategoryBySlug(String slug) {
        Category category = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Category not found with slug: " + slug));
        return mapToDTO(category);
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryDTO getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        return mapToDTO(category);
    }

    @Override
    @Transactional
    public CategoryDTO createCategory(CategoryDTO dto) {
        String slug = dto.getSlug() != null && !dto.getSlug().isBlank()
                ? dto.getSlug()
                : dto.getName().toLowerCase().replaceAll("[^a-z0-9]+", "-");

        Category category = Category.builder()
                .name(dto.getName())
                .slug(slug)
                .description(dto.getDescription())
                .iconName(dto.getIconName() != null ? dto.getIconName() : "Sparkles")
                .displayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0)
                .imageUrl(dto.getImageUrl())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .build();

        return mapToDTO(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public CategoryDTO updateCategory(Long id, CategoryDTO dto) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

        category.setName(dto.getName());
        if (dto.getSlug() != null && !dto.getSlug().isBlank()) {
            category.setSlug(dto.getSlug());
        }
        category.setDescription(dto.getDescription());
        if (dto.getIconName() != null) {
            category.setIconName(dto.getIconName());
        }
        if (dto.getDisplayOrder() != null) {
            category.setDisplayOrder(dto.getDisplayOrder());
        }
        if (dto.getImageUrl() != null) {
            category.setImageUrl(dto.getImageUrl());
        }
        if (dto.getIsActive() != null) {
            category.setIsActive(dto.getIsActive());
        }

        return mapToDTO(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        category.setIsActive(false); // Soft delete
        categoryRepository.save(category);
    }

    private CategoryDTO mapToDTO(Category entity) {
        return CategoryDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .slug(entity.getSlug())
                .description(entity.getDescription())
                .iconName(entity.getIconName())
                .displayOrder(entity.getDisplayOrder())
                .imageUrl(entity.getImageUrl())
                .isActive(entity.getIsActive())
                .build();
    }
}
