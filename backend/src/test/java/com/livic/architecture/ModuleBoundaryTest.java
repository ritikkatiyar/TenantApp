package com.livic.architecture;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

class ModuleBoundaryTest {

    private static JavaClasses classes;

    private static final String[] MODULES = {
            "auth", "user", "property", "finance", "billing", "payment", "notification", "announcement"
    };

    @BeforeAll
    static void setUp() {
        classes = new ClassFileImporter()
                .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
                .importPackages("com.livic");
    }

    @Test
    @DisplayName("No module repository should be accessed from outside its own module package")
    void noCrossModuleRepositoryAccess() {
        for (String module : MODULES) {
            String modulePackage = "com.livic." + module + "..";
            String repositoryPackage = "com.livic." + module + ".repository..";

            ArchRule rule = noClasses()
                    .that().resideOutsideOfPackage(modulePackage)
                    .should().dependOnClassesThat().resideInAPackage(repositoryPackage)
                    .because("Direct repository access across module boundaries violates modular monolith architecture (module: " + module + ")");

            rule.check(classes);
        }
    }

    @Test
    @DisplayName("Finance module internal services must not be accessed from outside finance module")
    void strictFinanceFacadeEnforcement() {
        ArchRule rule = noClasses()
                .that().resideOutsideOfPackage("com.livic.finance..")
                .should().dependOnClassesThat().resideInAnyPackage(
                        "com.livic.finance.service.interfaces..",
                        "com.livic.finance.service.impl..",
                        "com.livic.finance.repository..",
                        "com.livic.finance.domain.."
                )
                .because("Outside modules must access the finance module strictly through com.livic.finance.facade or DTOs");

        rule.check(classes);
    }

    @Test
    @DisplayName("Property module internal services must not be accessed from outside property module")
    void strictPropertyServiceBoundaryEnforcement() {
        ArchRule rule = noClasses()
                .that().resideOutsideOfPackage("com.livic.property..")
                .should().dependOnClassesThat().resideInAnyPackage(
                        "com.livic.property.service.interfaces..",
                        "com.livic.property.service.impl.."
                )
                .because("Outside modules must access property capabilities strictly through com.livic.property.facade or DTOs");

        rule.check(classes);
    }

    @Test
    @DisplayName("User module internal services must not be accessed from outside user module")
    void strictUserServiceBoundaryEnforcement() {
        ArchRule rule = noClasses()
                .that().resideOutsideOfPackage("com.livic.user..")
                .should().dependOnClassesThat().resideInAnyPackage(
                        "com.livic.user.service.interfaces..",
                        "com.livic.user.service.impl.."
                )
                .because("Outside modules must access user capabilities strictly through com.livic.user.facade or DTOs");

        rule.check(classes);
    }

    @Test
    @DisplayName("Payment module internal services must not be accessed from outside payment module")
    void strictPaymentServiceBoundaryEnforcement() {
        ArchRule rule = noClasses()
                .that().resideOutsideOfPackage("com.livic.payment..")
                .should().dependOnClassesThat().resideInAnyPackage(
                        "com.livic.payment.service.interfaces..",
                        "com.livic.payment.service.impl.."
                )
                .because("Outside modules must access payment capabilities strictly through com.livic.payment.facade or DTOs");

        rule.check(classes);
    }

    @Test
    @DisplayName("User facade package boundary check")
    void userFacadePackageStructure() {
        ArchRule rule = noClasses()
                .that().resideInAPackage("com.livic.user.facade..")
                .should().dependOnClassesThat().resideInAnyPackage("com.livic.finance..", "com.livic.property..");

        rule.check(classes);
    }

    @Test
    @DisplayName("Property facade package boundary check")
    void propertyFacadePackageStructure() {
        ArchRule rule = noClasses()
                .that().resideInAPackage("com.livic.property.facade..")
                .should().dependOnClassesThat().resideInAnyPackage("com.livic.finance..", "com.livic.billing..");

        rule.check(classes);
    }

    @Test
    @DisplayName("Auth facade package boundary check")
    void authFacadePackageStructure() {
        ArchRule rule = noClasses()
                .that().resideInAPackage("com.livic.auth.facade..")
                .should().dependOnClassesThat().resideInAnyPackage("com.livic.finance..", "com.livic.billing..");

        rule.check(classes);
    }
}
