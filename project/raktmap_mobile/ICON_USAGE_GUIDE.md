# Icon Usage Guide - RaktMap Mobile

## Overview
We've replaced emojis with `@expo/vector-icons` for a more professional and consistent UI across iOS and Android devices.

## Available Icon Libraries

The following icon libraries are included with Expo:

- **Ionicons** - Material Design icons (recommended for most use cases)
- **MaterialCommunityIcons** - Extended Material Design icons
- **FontAwesome** - Popular icon font
- **AntDesign** - Ant Design icons
- **Feather** - Simple and elegant icons

## How to Use Icons

### 1. Import Icons

```tsx
// @ts-ignore - Expo vector icons types
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
```

### 2. Use Icons in Your Component

```tsx
// Simple icon
<Ionicons name="home" size={24} color="#DC2626" />

// Icon with conditional rendering
{item.iconType === 'MaterialCommunityIcons' ? (
  <MaterialCommunityIcons name={item.iconName} size={28} color={item.color} />
) : (
  <Ionicons name={item.iconName} size={28} color={item.color} />
)}

// Icon in a button
<TouchableOpacity style={styles.button}>
  <Ionicons name="call" size={18} color="#FFFFFF" style={styles.icon} />
  <Text style={styles.text}>Call Hospital</Text>
</TouchableOpacity>
```

### 3. Common Icon Names

#### Ionicons
- `home` - Home icon
- `add-circle` - Add/Plus circle
- `list` - List view
- `people` - Multiple people
- `person` - Single person
- `menu` - Hamburger menu
- `call` - Phone call
- `mail` - Email
- `location` - Location pin
- `notifications` - Bell/notifications
- `settings` - Settings gear
- `search` - Search magnifier
- `heart` - Heart (favorite)
- `close` - Close/X
- `chevron-forward` - Right arrow
- `checkmark-circle` - Success check
- `alert-circle` - Warning/Error
- `map` - Map icon
- `water` - Water droplet (blood)

#### MaterialCommunityIcons
- `hospital-building` - Hospital icon
- `account-search` - Search people
- `account-check` - Verified person
- `map-marker` - Location marker
- `qr-code-scanner` - QR scanner
- `history` - History/clock
- `blood-bag` - Blood bag icon
- `heart-pulse` - Heart with pulse
- `phone` - Phone icon
- `email` - Email icon

## Icon Browser

To find more icons, visit:
- **Ionicons**: https://ionic.io/ionicons
- **Material Community Icons**: https://pictogrammers.com/library/mdi/
- **Expo Icons Directory**: https://icons.expo.fyi/

## Styling Icons

### Size
```tsx
size={16}  // Small
size={24}  // Default/Medium
size={32}  // Large
size={48}  // Extra Large
```

### Color
```tsx
color="#DC2626"  // Hex color
color="red"       // Named color
color={theme.primaryColor}  // Dynamic color
```

### Style Prop
```tsx
style={{ marginRight: 8, opacity: 0.8 }}
style={styles.icon}
```

## Updated Screens

The following screens have been updated to use vector icons:

### ✅ AvailableBloodStockScreen.tsx
- Hospital building icon for empty state
- Map marker for location
- Phone icon for call button

### ✅ HospitalDashboard.tsx
- All menu items (8 icons)
- All tab bar icons (5 icons)

### 🔄 Screens Still Using Emojis

You can update these following the same pattern:

1. **HomeScreen.tsx**
   - Blood droplet emoji (🩸) → Use `Ionicons: water` or `MaterialCommunityIcons: blood-bag`
   - Map emoji (🗺️) → Use `Ionicons: map`

2. **SearchDonorsScreen.tsx**
   - Blood droplet emoji (🩸)
   - Phone emoji (📞) → Use `Ionicons: call`
   - Email emoji (✉️) → Use `Ionicons: mail`

3. **DonorsScreen.tsx**
   - Location emoji (📍) → Use `MaterialCommunityIcons: map-marker`

4. **LiveMapScreen.tsx**
   - Hospital emoji (🏥) → Use `MaterialCommunityIcons: hospital-building`
   - Location emoji (📍) → Use `MaterialCommunityIcons: map-marker`

5. **NotificationCenterScreen.tsx**
   - Blood droplet emoji (🩸)
   - Info emoji (ℹ️) → Use `Ionicons: information-circle`

6. **UserDashboard.tsx**
   - Settings emoji (⚙️) → Use `Ionicons: settings`

7. **CreateRequestScreen.tsx**
   - Info emoji (ℹ️) → Use `Ionicons: information-circle`

## Best Practices

1. **Consistency**: Use the same icon library throughout related screens
2. **Size Guidelines**: 
   - Tab bars: 24px
   - Buttons: 18-20px
   - Empty states: 48-64px
   - List items: 20-24px

3. **Color Guidelines**:
   - Use theme colors for consistency
   - Active/selected items: Primary color
   - Inactive items: Gray (#6B7280)
   - Destructive actions: Red (#DC2626)
   - Success: Green (#10B981)

4. **Accessibility**: Always pair icons with text labels for clarity

## Example: Converting Emoji to Icon

### Before (Emoji)
```tsx
<Text style={styles.icon}>📞</Text>
```

### After (Vector Icon)
```tsx
import { Ionicons } from '@expo/vector-icons';

<Ionicons name="call" size={20} color="#DC2626" />
```

## TypeScript Note

If you see TypeScript errors about missing type declarations, add this comment above the import:

```tsx
// @ts-ignore - Expo vector icons types
import { Ionicons } from '@expo/vector-icons';
```

This is safe - the icons will work at runtime even if TypeScript complains about types.

## Need Help?

- Check the icon browsers linked above
- Icons are case-sensitive: use exact names
- Some icon names use dashes: `add-circle`, `chevron-forward`
- Test icons on both iOS and Android - they should look consistent

---

**Updated**: February 14, 2026
**Package**: @expo/vector-icons v15.0.3 (bundled with Expo 54)
