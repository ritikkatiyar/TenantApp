package com.livic.architecture;

import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.domain.JavaAnnotation;
import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.domain.JavaField;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.lang.ArchCondition;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.ConditionEvents;
import com.tngtech.archunit.lang.SimpleConditionEvent;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.fields;

class ModuleBoundaryTest {

    private static JavaClasses classes;

    private static final String[] MODULES = {
            "auth", "user", "property", "finance", "billing", "payment", "notification", "announcement", "analytics", "issue"
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
                .and().doNotHaveFullyQualifiedName("com.livic.auth.service.CustomUserDetailsService")
                .should().dependOnClassesThat().resideInAnyPackage(
                        "com.livic.user.service.interfaces..",
                        "com.livic.user.service.impl.."
                )
                .because("Outside modules must access user capabilities strictly through com.livic.user.facade or DTOs (except CustomUserDetailsService)");

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

    @Test
    @DisplayName("No class in a module's domain package should depend on classes in another module's domain package")
    void noCrossModuleDomainAccess() {
        for (String module : MODULES) {
            String targetDomainPackage = "com.livic." + module + ".domain..";

            ArchRule rule = noClasses()
                    .that().resideInAPackage("com.livic..domain..")
                    .and().resideOutsideOfPackage("com.livic." + module + "..")
                    .and().doNotHaveFullyQualifiedName("com.livic.property.domain.PropertyJoinCodeTbl")
                    .and().doNotHaveFullyQualifiedName("com.livic.property.domain.PropertyJoinCodeTbl$PropertyJoinCodeTblBuilder")
                    .and().doNotHaveFullyQualifiedName("com.livic.auth.domain.MembershipTbl")
                    .and().doNotHaveFullyQualifiedName("com.livic.auth.domain.MembershipTbl$MembershipTblBuilder")
                    .and().doNotHaveFullyQualifiedName("com.livic.announcement.domain.AnnouncementReceiptTbl")
                    .and().doNotHaveFullyQualifiedName("com.livic.announcement.domain.AnnouncementReceiptTbl$AnnouncementReceiptTblBuilder")
                    .should().dependOnClassesThat().resideInAPackage(targetDomainPackage)
                    .because("Domain entities should not have cross-module dependencies (target module: " + module + ")");

            rule.check(classes);
        }
    }

    @Test
    @DisplayName("No domain entity field should be a JPA relationship into another module's domain class")
    void noCrossModuleEntityRelationships() {
        // The four JPA multiplicity annotations we forbid pointing across module boundaries
        Set<String> JPA_RELATION_ANNOTATIONS = Set.of(
                "jakarta.persistence.ManyToOne",
                "jakarta.persistence.OneToMany",
                "jakarta.persistence.OneToOne",
                "jakarta.persistence.ManyToMany"
        );

        for (String module : MODULES) {
            // Trailing dot-less prefix so .startsWith() covers sub-packages (e.g. domain.enums)
            final String ownDomainPrefix = "com.livic." + module + ".domain";

            // fields().that(inDomain).and(hasJpaAnnotation).should(notPointElsewhere)
            // Using fields() (not noFields()) so that violated events in should() correctly
            // mean "this field breaks the rule" — with noFields() the semantics are inverted.
            ArchRule rule = fields()
                    // Select fields that are DECLARED INSIDE this module's own domain package …
                    .that(new DescribedPredicate<>("are declared in " + ownDomainPrefix) {
                        @Override
                        public boolean test(JavaField field) {
                            return field.getOwner().getPackageName().startsWith(ownDomainPrefix);
                        }
                    })
                    // … and carry at least one JPA relationship annotation
                    .and(new DescribedPredicate<>("are annotated with a JPA relationship annotation") {
                        @Override
                        public boolean test(JavaField field) {
                            for (JavaAnnotation<?> ann : field.getAnnotations()) {
                                if (JPA_RELATION_ANNOTATIONS.contains(ann.getRawType().getFullName())) {
                                    return true;
                                }
                            }
                            return false;
                        }
                    })
                    // … excluding known bridge/association entities that are exempted by architectural decision
                    // (same entities already excluded in noCrossModuleDomainAccess — pre-standard JPA relations
                    //  that require a dedicated migration to UUID columns; new code must NOT add to this list)
                    .and(new DescribedPredicate<>("are not in a known exempted bridge entity") {
                        private static final Set<String> EXEMPTED_OWNERS = Set.of(
                                "com.livic.auth.domain.MembershipTbl",
                                "com.livic.property.domain.PropertyJoinCodeTbl"
                        );
                        @Override
                        public boolean test(JavaField field) {
                            return !EXEMPTED_OWNERS.contains(field.getOwner().getName());
                        }
                    })
                    // … should NOT resolve to a class living in a DIFFERENT module's domain package
                    .should(new ArchCondition<>("not reference another module's domain class via a JPA relationship") {
                        @Override
                        public void check(JavaField field, ConditionEvents events) {
                            // toErasure() gives us the raw declared type:
                            //   @ManyToOne  SomeTbl          → SomeTbl
                            //   @OneToMany  List<SomeTbl>    → List  (raw erasure of generic)
                            // For collection fields we need to inspect the actual generic argument.
                            // We check both: the erased type and every actual type argument.
                            Set<JavaClass> typesToCheck = new java.util.LinkedHashSet<>();
                            typesToCheck.add(field.getType().toErasure());
                            field.getType().getAllInvolvedRawTypes().forEach(typesToCheck::add);

                            for (JavaClass candidate : typesToCheck) {
                                String pkg = candidate.getPackageName();
                                boolean isOtherModuleDomain = pkg.startsWith("com.livic.")
                                        && pkg.contains(".domain")
                                        && !pkg.startsWith(ownDomainPrefix);

                                if (isOtherModuleDomain) {
                                    events.add(SimpleConditionEvent.violated(field, String.format(
                                            "Field [%s.%s] has a JPA relationship annotation and its type [%s] " +
                                            "belongs to a different module's domain package [%s]. " +
                                            "Replace with a UUID column and call the owning module's Facade.",
                                            field.getOwner().getName(), field.getName(),
                                            candidate.getFullName(), pkg)));
                                    return; // report once per field
                                }
                            }
                        }
                    })
                    .because("Cross-module JPA relationships (@ManyToOne/@OneToMany/@OneToOne/@ManyToMany) create "
                            + "compile-time and schema-level coupling that breaks if a module "
                            + "is ever extracted into a separate service — use a UUID column "
                            + "and the owning module's Facade instead (module: " + module + ")")
                    .allowEmptyShould(true); // a module with no cross-module JPA fields is already compliant

            rule.check(classes);
        }
    }
}
