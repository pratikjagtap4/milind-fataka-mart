package com.fatakamart.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDTO {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private String iconName;
    private Integer displayOrder;
    private String imageUrl;
    private Long productCount;
    private Boolean isActive;
}
