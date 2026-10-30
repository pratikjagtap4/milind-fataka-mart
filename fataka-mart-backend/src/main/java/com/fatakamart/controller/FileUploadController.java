package com.fatakamart.controller;

import com.fatakamart.payload.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/upload")
@PreAuthorize("hasAnyRole('OWNER', 'SUPER_ADMIN')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Image & Media Upload", description = "Endpoints for direct device photo upload for products and categories")
@Slf4j
public class FileUploadController {

    private static final String UPLOAD_DIR = "uploads";

    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload image directly from device camera or photo library")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload an empty file");
        }

        try {
            // Ensure uploads directory exists
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate clean unique filename
            String original = file.getOriginalFilename();
            String ext = ".jpg";
            if (original != null && original.contains(".")) {
                ext = original.substring(original.lastIndexOf(".")).toLowerCase();
            }

            String filename = "photo_" + UUID.randomUUID().toString().substring(0, 10) + ext;
            Path targetLocation = uploadPath.resolve(filename);

            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            log.info("Uploaded file successfully saved to: {}", targetLocation.toAbsolutePath());

            // Accessible via /api/uploads/{filename}
            String fileUrl = "/api/uploads/" + filename;
            return ResponseEntity.ok(ApiResponse.ok("Photo uploaded successfully", Map.of("url", fileUrl, "filename", filename)));

        } catch (IOException ex) {
            log.error("Failed to store uploaded file", ex);
            throw new RuntimeException("Could not save uploaded photo: " + ex.getMessage(), ex);
        }
    }
}
