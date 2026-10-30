package com.fatakamart.config;

import com.fatakamart.domain.entity.*;
import com.fatakamart.domain.enums.CustomerTier;
import com.fatakamart.domain.enums.Role;
import com.fatakamart.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final CategoryRepository categoryRepository;
    private final BaseProductRepository baseProductRepository;
    private final ShopInventoryRepository shopInventoryRepository;
    private final CustomerRepository customerRepository;
    private final BillRepository billRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.super-admin.email:npratikjagtap2704@gmail.com}")
    private String superAdminEmail;

    @Value("${app.super-admin.default-password:Admin@123}")
    private String superAdminPassword;

    @Value("${app.super-admin.full-name:Pratik Jagtap (Super Admin)}")
    private String superAdminName;

    @Value("${app.super-admin.mobile:+91 91122 33445}")
    private String superAdminMobile;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking Fataka Mart initial master data and Super Admin setup...");

        // 1. Initialize or Synchronize Exactly 2 Sibling Shops
        log.info("Configuring the 2 Fataka Mart branches...");
        
        Shop shop1 = shopRepository.findByBranchCode("FM-BR1")
                .or(() -> shopRepository.findAll().stream().filter(s -> s.getName().toLowerCase().contains("branch 1") || s.getName().contains("Mega")).findFirst())
                .orElse(new Shop());
        shop1.setName("Milind Phataka Mart branch 1");
        shop1.setBranchCode("FM-BR1");
        shop1.setAddress("Kapil vastu Budhha Vihar, Kondhwa Budhruk");
        shop1.setCity("Pune");
        shop1.setState("Maharashtra");
        shop1.setContactPhone("8390608383");
        shop1.setDefaultOverheadPercentage(new BigDecimal("25.00"));
        shop1.setIsActive(true);
        shop1 = shopRepository.save(shop1);

        Shop shop2 = shopRepository.findByBranchCode("FM-BR2")
                .or(() -> shopRepository.findAll().stream().filter(s -> s.getName().toLowerCase().contains("branch 2") || s.getName().contains("Station")).findFirst())
                .orElse(new Shop());
        shop2.setName("Millind Phatakha mart branch 2");
        shop2.setBranchCode("FM-BR2");
        shop2.setAddress("Kanha hotel chowk, Kondhwa budhruk");
        shop2.setCity("Pune");
        shop2.setState("Maharashtra");
        shop2.setContactPhone("8390608383");
        shop2.setDefaultOverheadPercentage(new BigDecimal("25.00"));
        shop2.setIsActive(true);
        shop2 = shopRepository.save(shop2);

        // Deactivate any legacy shops so only the 2 branches are active
        for (Shop s : shopRepository.findAll()) {
            if (!s.getId().equals(shop1.getId()) && !s.getId().equals(shop2.getId())) {
                s.setIsActive(false);
                shopRepository.save(s);
            }
        }

        // 2. Initialize exactly 2 Users: Pratik Jagtap (Super Admin / Both shops) and Raj Lagad (Owner / Shop 1)
        User pratik = userRepository.findByEmail(superAdminEmail)
                .or(() -> userRepository.findByMobile("8390608383"))
                .orElse(new User());
        pratik.setEmail(superAdminEmail);
        pratik.setFullName("Pratik Jagtap");
        pratik.setMobile("8390608383");
        pratik.setRole(Role.SUPER_ADMIN);
        pratik.setShop(shop2);
        pratik.setIsEnabled(true);
        pratik.setPasswordHash(passwordEncoder.encode("admin@123"));
        pratik = userRepository.save(pratik);

        User raj = userRepository.findByMobile("9284255457")
                .or(() -> userRepository.findByEmail("rajlagad@fatakamart.com"))
                .orElse(new User());
        raj.setEmail("rajlagad@fatakamart.com");
        raj.setFullName("Raj Lagad");
        raj.setMobile("9284255457");
        raj.setRole(Role.OWNER);
        raj.setShop(shop1);
        raj.setIsEnabled(true);
        raj.setPasswordHash(passwordEncoder.encode("raj@2307"));
        raj = userRepository.save(raj);

        // Remove any other legacy users so ONLY Pratik Jagtap and Raj Lagad exist in system
        for (User u : userRepository.findAll()) {
            if (!u.getId().equals(pratik.getId()) && !u.getId().equals(raj.getId())) {
                billRepository.reassignBillsUser(u.getId(), pratik);
                userRepository.delete(u);
            }
        }

        // Set Vaibhav Punde's order (7397986043) to PENDING_REVIEW for owner review notification panel
        for (Bill b : billRepository.findAll()) {
            if ("7397986043".equals(b.getCustomerMobile()) && (b.getStatus() == null || b.getStatus() == com.fatakamart.domain.enums.OrderStatus.COMPLETED)) {
                b.setStatus(com.fatakamart.domain.enums.OrderStatus.PENDING_REVIEW);
                billRepository.save(b);
            }
        }

        // 3. Initialize Categories
        if (categoryRepository.count() == 0) {
            log.info("Seeding festival categories...");
            Category c1 = categoryRepository.save(Category.builder()
                    .name("Sparklers (Phooljhadi)")
                    .slug("sparklers")
                    .description("Classic dazzling hand sparklers in gold, electric, and multi-colour variations.")
                    .iconName("Sparkles")
                    .displayOrder(1)
                    .imageUrl("https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80")
                    .isActive(true)
                    .build());

            Category c2 = categoryRepository.save(Category.builder()
                    .name("Ground Chakras (Zameen Chakkar)")
                    .slug("ground-chakras")
                    .description("Spinning circular firewheels generating brilliant golden and silver sparks.")
                    .iconName("Disc")
                    .displayOrder(2)
                    .imageUrl("https://images.unsplash.com/photo-1576400883215-7083980b6197?w=600&auto=format&fit=crop&q=80")
                    .isActive(true)
                    .build());

            Category c3 = categoryRepository.save(Category.builder()
                    .name("Flower Pots (Koti / Anar)")
                    .slug("flower-pots")
                    .description("Towering fountains of golden, silver, crackling, and tri-colour sparks.")
                    .iconName("Flame")
                    .displayOrder(3)
                    .imageUrl("https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=600&auto=format&fit=crop&q=80")
                    .isActive(true)
                    .build());

            Category c4 = categoryRepository.save(Category.builder()
                    .name("Garland / Mala (Ladi Crackers)")
                    .slug("garland-mala")
                    .description("Traditional rapid rhythm celebration string crackers (1000, 2000, 5000 Wala).")
                    .iconName("Layers")
                    .displayOrder(4)
                    .imageUrl("https://images.unsplash.com/photo-1508717272800-9fff97da7e8f?w=600&auto=format&fit=crop&q=80")
                    .isActive(true)
                    .build());

            Category c5 = categoryRepository.save(Category.builder()
                    .name("Multi-Color Sky Shots")
                    .slug("multi-color-sky-shots")
                    .description("Spectacular aerial cake repeaters firing brilliant bursts high into the night sky.")
                    .iconName("Rocket")
                    .displayOrder(5)
                    .imageUrl("https://images.unsplash.com/photo-1533230408708-8f9f91d12368?w=600&auto=format&fit=crop&q=80")
                    .isActive(true)
                    .build());

            Category c6 = categoryRepository.save(Category.builder()
                    .name("Fancy Novelty & Sound Crackers")
                    .slug("fancy-novelty-sound")
                    .description("Hydro bombs, whistling sound crackers, roll caps, and kid-safe novelty items.")
                    .iconName("Zap")
                    .displayOrder(6)
                    .imageUrl("https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80")
                    .isActive(true)
                    .build());

            // 4. Initialize Base Products
            log.info("Seeding master catalog base products...");
            BaseProduct p1 = baseProductRepository.save(BaseProduct.builder()
                    .category(c1)
                    .name("Electric Sparklers 10cm")
                    .companyName("Standard Fireworks")
                    .packDescription("Box of 10 Pcs")
                    .defaultPurchasePrice(new BigDecimal("25.00"))
                    .defaultSellingPrice(new BigDecimal("60.00"))
                    .imageUrl1("https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80")
                    .safetyInstructions("Light at tip using agarbatti. Hold at arm length outdoors. Dip extinguished wire in water.")
                    .isActive(true)
                    .build());

            BaseProduct p2 = baseProductRepository.save(BaseProduct.builder()
                    .category(c2)
                    .name("Ground Chakra Special")
                    .companyName("Standard Fireworks")
                    .packDescription("Box of 10 Pcs")
                    .defaultPurchasePrice(new BigDecimal("60.00"))
                    .defaultSellingPrice(new BigDecimal("150.00"))
                    .imageUrl1("https://images.unsplash.com/photo-1576400883215-7083980b6197?w=600&auto=format&fit=crop&q=80")
                    .safetyInstructions("Place flat on smooth concrete or stone surface with fuse pointing up. Light and retreat 5 meters.")
                    .isActive(true)
                    .build());

            BaseProduct p3 = baseProductRepository.save(BaseProduct.builder()
                    .category(c3)
                    .name("Flower Pot Big (Anar Special)")
                    .companyName("Standard Fireworks")
                    .packDescription("Box of 10 Pcs")
                    .defaultPurchasePrice(new BigDecimal("100.00"))
                    .defaultSellingPrice(new BigDecimal("250.00"))
                    .imageUrl1("https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=600&auto=format&fit=crop&q=80")
                    .safetyInstructions("Place vertically on flat ground. Light fuse tip and step back 5 meters immediately.")
                    .isActive(true)
                    .build());

            BaseProduct p4 = baseProductRepository.save(BaseProduct.builder()
                    .category(c4)
                    .name("1000 Wala Red Mala String")
                    .companyName("Coronation Fireworks")
                    .packDescription("1 Roll Pack")
                    .defaultPurchasePrice(new BigDecimal("120.00"))
                    .defaultSellingPrice(new BigDecimal("300.00"))
                    .imageUrl1("https://images.unsplash.com/photo-1508717272800-9fff97da7e8f?w=600&auto=format&fit=crop&q=80")
                    .safetyInstructions("Unroll completely on open ground away from vehicles. Light fuse end.")
                    .isActive(true)
                    .build());

            BaseProduct p5 = baseProductRepository.save(BaseProduct.builder()
                    .category(c5)
                    .name("12 Shots Multi-Colour Aerial Cake")
                    .companyName("Standard Fireworks")
                    .packDescription("1 Box Cake")
                    .defaultPurchasePrice(new BigDecimal("180.00"))
                    .defaultSellingPrice(new BigDecimal("450.00"))
                    .imageUrl1("https://images.unsplash.com/photo-1533230408708-8f9f91d12368?w=600&auto=format&fit=crop&q=80")
                    .safetyInstructions("Place box upright on flat firm ground. Support sides with bricks. Never lean over the tube.")
                    .isActive(true)
                    .build());

            BaseProduct p6 = baseProductRepository.save(BaseProduct.builder()
                    .category(c6)
                    .name("Hydro Bomb Sound Blast")
                    .companyName("Standard Fireworks")
                    .packDescription("Box of 10 Pcs")
                    .defaultPurchasePrice(new BigDecimal("80.00"))
                    .defaultSellingPrice(new BigDecimal("200.00"))
                    .imageUrl1("https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80")
                    .safetyInstructions("Heavy sound cracker. Light fuse on ground outdoors and retreat immediately.")
                    .isActive(true)
                    .build());

            // 5. Seed Inventory for Both Shops (Branch 1 & Branch 2)
            for (Shop shop : List.of(shop1, shop2)) {
                log.info("Seeding inventory for {}...", shop.getName());
                createInventoryItem(shop, p1, new BigDecimal("25.00"), new BigDecimal("60.00"), 150);
                createInventoryItem(shop, p2, new BigDecimal("60.00"), new BigDecimal("150.00"), 100);
                createInventoryItem(shop, p3, new BigDecimal("100.00"), new BigDecimal("250.00"), 90);
                createInventoryItem(shop, p4, new BigDecimal("120.00"), new BigDecimal("300.00"), 85);
                createInventoryItem(shop, p5, new BigDecimal("180.00"), new BigDecimal("450.00"), 40);
                createInventoryItem(shop, p6, new BigDecimal("80.00"), new BigDecimal("200.00"), 110);
            }
        }

        // Also ensure both shops have inventory even if categories already existed
        List<BaseProduct> allBaseProducts = baseProductRepository.findAll();
        for (Shop shop : List.of(shop1, shop2)) {
            for (BaseProduct bp : allBaseProducts) {
                if (!shopInventoryRepository.existsByShopIdAndBaseProductId(shop.getId(), bp.getId())) {
                    createInventoryItem(shop, bp, bp.getDefaultPurchasePrice(), bp.getDefaultSellingPrice(), 100);
                }
            }
        }

        log.info("Fataka Mart data initialization complete. Ready for operations!");
    }

    private void createInventoryItem(Shop shop, BaseProduct product, BigDecimal purchasePrice, BigDecimal sellingPrice, int stock) {
        ShopInventory inventory = ShopInventory.builder()
                .shop(shop)
                .baseProduct(product)
                .customName(product.getName())
                .purchasePrice(purchasePrice)
                .overheadPercentage(shop.getDefaultOverheadPercentage())
                .sellingPrice(sellingPrice)
                .stockQuantity(stock)
                .lowStockThreshold(15)
                .isActive(true)
                .build();
        inventory.calculatePricingRules();
        shopInventoryRepository.save(inventory);
    }
}
