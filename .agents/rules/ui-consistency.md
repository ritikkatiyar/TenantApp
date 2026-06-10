# UX/UI Consistency Standards: Tenant Living Frontend (React Native & Expo)

This workspace rule file defines the strict design architecture, styling guidelines, and UX patterns required to maintain a premium, high-fidelity user interface across the **Tenant Living** mobile and web applications. All frontend developments, refactorings, and feature additions must strictly adhere to these specifications.

---

## 1. Core Design Tokens & Theme Integration

The project utilizes a centralized theme structure defined in `TenantAppFE/src/theme/Theme.js`. Direct inline hex codes, arbitrary sizes, or unmapped font-families are strictly prohibited.

### A. Color Palette Rules
- **Primary Color (`#006875`)**: Used for branding, dominant UI elements, active icons, and primary category headings.
- **Secondary Color (`#4648d4`)**: Reserved for primary action buttons, save endpoints, and focal interactive elements.
- **Tertiary Color (`#765a00`)**: Used selectively for warning states, pending actions, and highlights.
- **Error Colors (`#ba1a1a` / `#ffdad6`)**: Used exclusively for destructive actions, validation errors, and critical alerts.
- **Background Gradient**: All full-screen screens must render inside a standard page wrapper utilizing the `backgroundGradient`: `["#f4faff", "#ecf5fb", "#d8e2ff"]`.
- **Accent Gradients**: Key visual triggers (active segment selections, call-to-action buttons) must use `accentGradientStart` (`#00e0ff`) to `accentGradientEnd` (`#0070ea`).

### B. Typography Hierarchy
All text components must select from the predefined typography styles. Default system font references are banned.

| Token | Family | Size | Weight | Line Height | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `displayMetrics` | `Manrope` | 48px | 800 (ExtraBold) | 56px | Large layout display figures |
| `headlineXl` | `Manrope` | 32px | 800 (ExtraBold) | 38px | Screen title headers |
| `headlineLg` | `Manrope` | 24px | 700 (Bold) | 31px | Section headers |
| `bodyLg` | `Inter` | 18px | 400 (Regular) | 28px | Interactive body/readable text |
| `bodyMd` | `Inter` | 16px | 400 (Regular) | 24px | Standard paragraphs |
| `labelCaps` | `JetBrains Mono` | 12px | 700 (Bold) | 14px | Form field labels (uppercase) |
| `buttonText` | `Manrope` | 14px | 700 (Bold) | 14px | Primary actions |
| `labelMuted` | `Inter` | 14px | 400 (Regular) | 20px | Descriptive hints, secondary labels |

### C. Spacing & Borders
- **Spacing Unit (`Spacing.unit = 8`)**: Margins, paddings, and gap configurations must be multiples of 8 (`stackSm` = 8px, `stackMd` = 16px, `containerPadding` = 20px, `stackLg` = 32px).
- **Rounding Tokens (`Rounded`)**:
  - `sm` (4px): Small badges, mini overlays.
  - `default` (8px): Action tags, secondary buttons.
  - `md` (12px): Standard form inputs, segmented pill-containers.
  - `lg` (16px): Content containers, action modals.
  - `xl` (24px): Primary feature cards, bottom sheets.
  - `full` (9999px): Circle buttons, pill segments.

---

## 2. Component Design & Structural Patterns

### A. Glassmorphic Cards (The "Glass" Container)
Cards and form wrappers must implement a cohesive glassmorphic look using `expo-blur`.
```tsx
import { BlurView } from 'expo-blur';
import { Colors, Rounded } from '@/src/theme/Theme';

// Rule: Ensure BlurView is configured with intensity=40 and tint="light"
<BlurView intensity={40} tint="light" style={styles.card}>
  {/* Content */}
</BlurView>

// Accompanying Styles
const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: Rounded.xl,
    padding: Spacing.containerPadding,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
    // Soft shadow
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    elevation: 3,
  }
});
```

### B. Form Fields & Input Standards
Inputs must reside inside stylized containers to maintain structural consistency:
1. **Container**: Soft white background `rgba(255, 255, 255, 0.6)`, high-transparency white borders `rgba(255, 255, 255, 0.9)`, border radius `12px` (`Rounded.md`), padding matching standard inputs.
2. **Text Input**: Font style matching body copy, placeholder text styled using `#849495`.
3. **Prefix / Suffix**: Icons (e.g. search, user, currency symbols like ₹) must be consistently aligned in the row layout.
4. **Validation States**: Fail state overlays must transition borders to `Colors.error` (`#ba1a1a`) and present immediate warning sub-labels.

### C. Segment & Toggle Controls
Segmented options (e.g. Billing Frequency, Categories, Recipient Scope, Severity) must be presented inside a unified, long glassmorphic bar containing options as segments.
1. **Container**: Flex row layout, background `rgba(255, 255, 255, 0.6)`, border width `1`, border color `rgba(255, 255, 255, 0.9)`, border radius `12px`, with `padding: 4`.
2. **Segment Button Wrapper**: Equal spacing using `flex: 1`.
3. **Active state (Gradient Pill)**: LinearGradient mapping from `#00d4ff` (cyan) to `#0072ff` (blue) with white bold text, and a border radius of `8px`.
4. **Inactive state**: Solid transparent background with `#151d1e` text color (or specific status color), transitioning opacity on touch.

### D. Pills & Chip Option Lists
When dynamic lists of options (e.g. many properties) cannot fit inside a standard segment bar:
1. **Container**: Always wrap lists in a horizontal `<ScrollView>` using `contentContainerStyle` with `paddingVertical: 6` to avoid clipping borders.
2. **Spacing**: Apply `gap: 10` or `marginRight: 10` between chips.
3. **Chip Sizing & Padding**: Use `paddingVertical: 10` and `paddingHorizontal: 20` with a `borderRadius: 24` (or `Rounded.full`).
4. **Pill Colors**:
   - **Active state**: Solid primary accent blue background (`#0072ff`) with white text (`#ffffff`).
   - **Inactive state**: Semi-translucent white background (`rgba(255, 255, 255, 0.4)`) with standard border (`rgba(255, 255, 255, 0.8)`) and muted text color (`#6b7a7d`).

---

## 3. Responsive Screen & Layout Architecture

The app is deployed across both mobile screens and desktop web viewers. Viewports must adapt using a hard breakpoint: `isDesktop = windowWidth >= 900`.

### A. Desktop Layout Standards
- **Width Management**: Main panels should have constrained reading boundaries or dual-column structures.
- **Side Panels**: Multi-pane layout editors must display sidebars on the right-hand side (e.g., width set to `380px` - `420px`) rather than using screen overlays.
- **Branding Alignment**: Branding elements (Sidebars, Logo tags, footers) must use `TenantApp` and `Management Suite` across all admin/manager screens. `TenantPortal` is reserved for tenant-facing interfaces.
- **Action Button Placement**: Primary actions (e.g. "Save Changes", "Broadcast Now", "Create Property") must reside in the top-right of the page header row on desktop (in a `pageHeaderRow` flex row layout), rather than inside the form container cards themselves.
- **Grid Editors**: Canvas workspaces must configure zoom capabilities (scroll wheel bindings) and support click-and-drag grid selection logic.

### B. Mobile Layout Standards
- **Bottom Sheets**: When presenting side content or forms on mobile, wrap them inside dynamic, slide-up bottom sheets (`FadeInUp` / `FadeOutDown` or gesture-driven panels).
- **Virtual Keyboard Deficits**: All interactive mobile forms must programmatically handle keyboard offset adjustments. Set custom listeners to calculate active height offsets:
  ```tsx
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  ```
- **Safe Areas**: Direct layouts must respect notch overlays using `SafeAreaView` from `react-native-safe-area-context` with configured edges (e.g. `edges={['top']}`).

---

## 4. Native Interactions & Polish

### A. Feedback loop & Haptics
- **Tactile feedback**: Integrate `expo-haptics` on major user actions (successful creations, layout validations, modal triggers).
- **Loading states**: Buttons triggering API operations must render inline spinners (`ActivityIndicator` styled using theme colors) and transition to an inactive opacity of `0.7` to prevent double execution.

### B. Header & Scroll Synchronization
- **Interpolated Headers**: Compact top headers must animate opacity dynamically relative to view offsets, transitioning titles as large scroll banners collapse.
  ```tsx
  const headerOpacity = scrollY.interpolate({
    inputRange: [40, 90],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  ```

---

## 5. Implementation & Code Quality Rules

1. **No Commented Code**: Ensure clean files free of unused, legacy styling definitions.
2. **StyleSheet Encapsulation**: All component styling must be defined in a dedicated `const styles = StyleSheet.create({...})` block at the bottom of the file. No inline styles are permitted for complex properties like layout grid settings, flex containers, or border metrics.
3. **No Unused Imports**: Strip unused React Native components, icons, or router references prior to committing.
4. **SVG and Icon Consistency**: Leverage icons exclusively from `@expo/vector-icons` (`MaterialIcons`, `Feather`, `MaterialCommunityIcons`, `Ionicons`) configured with unified sizes (typically `20` / `24` pixels) matching category headers.
