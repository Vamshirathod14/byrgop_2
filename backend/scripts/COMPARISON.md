/**
 * COMPARISON: Atlas vs Local Domain Ownership
 * 
 * Atlas authoritative mapping:
 * - Services (services): financial-services, fitness-gym-wellness-operations, 
 *   franchise-multi-unit, healthcare-life-sciences, hospitality-food-beverage,
 *   professional-services, retail-e-commerce, supply-chain-logistics, technology-saas
 * - Manufacture (manufacture): automotive_heavy_engineering, cpg_food_processing,
 *   manufacturing, pharmaceuticals_biomanufacturing, raw_materials_mining_metallurgy,
 *   real_estate_construction
 * - Unlinked: humanitarian_aid_relief_logistics
 * 
 * Local current state (MISMATCHES):
 * 
 * ❌ Services domains incorrectly assigned to Manufacturing (product):
 * 1. fitness-gym-wellness-operations → Atlas: Services, Local: product
 * 2. franchise_multi_unit (Atlas: franchise-multi-unit) → Atlas: Services, Local: product
 * 3. retail_ecommerce (Atlas: retail-e-commerce) → Atlas: Services, Local: product
 * 4. supply_chain_logistics (Atlas: supply-chain-logistics) → Atlas: Services, Local: product
 * 5. technology_saas (Atlas: technology-saas) → Atlas: Services, Local: product
 * 
 * ✅ Already correct Services domains (local btKey=service):
 * - financial-services (btKey=service) ✓
 * - healthcare_wellness (btKey=service) ✓ 
 * - hospitality-food-beverage (btKey=service) ✓
 * - professional-services (btKey=service) ✓
 * 
 * ✅ Correct Manufacturing domains (local btKey=product):
 * - automotive_heavy_engineering ✓
 * - cpg_food_processing ✓
 * - manufacturing (19 q: 10 local + 9 Atlas) ✓
 * - pharmaceuticals_biomanufacturing ✓
 * - raw_materials_mining_metallurgy ✓
 * - real_estate_construction ✓
 * 
 * ⚠️ Slug mismatches (same _id, different slug - keep local underscore):
 * - franchise_multi_unit (local) vs franchise-multi-unit (Atlas) - SAME _id
 * - retail_ecommerce (local) vs retail-e-commerce (Atlas) - SAME _id
 * - supply_chain_logistics (local) vs supply-chain-logistics (Atlas) - SAME _id
 * - technology_saas (local) vs technology-saas (Atlas) - SAME _id
 * - fitness-gym-wellness-operations - SAME _id (already correct slug)
 * 
 * ⚠️ Different _id records created during sync (keep hyphen slugs):
 * - financial-services (separate from financial_services) - btKey=service ✓
 * - professional-services (separate from professional_services) - btKey=service ✓
 * - hospitality-food-beverage (separate from hospitality_food_beverage) - btKey=service ✓
 */