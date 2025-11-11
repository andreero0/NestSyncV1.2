# Component Guidelines

## JSX Structure Best Practices

### Text Content in React Native

**Rule**: All text content MUST be wrapped in `<Text>` components.

React Native requires that all text nodes be wrapped in `<Text>` components. This is enforced by the `react-native/no-raw-text` ESLint rule.

#### ❌ Incorrect

```tsx
// Direct text in View
<View>
  Hello World
</View>

// Variable without Text wrapper
<View>
  {userName}
</View>

// String literal without Text wrapper
<View style={styles.label}>
  Name:
</View>
```

#### ✅ Correct

```tsx
// Text wrapped in Text component
<View>
  <Text>Hello World</Text>
</View>

// Variable wrapped in Text component
<View>
  <Text>{userName}</Text>
</View>

// String literal wrapped in Text component
<View style={styles.label}>
  <Text>Name:</Text>
</View>
```

### Exceptions

The following are valid and do NOT require Text wrappers:

#### JSX Elements
```tsx
// JSX elements can be direct children of View
<View>
  <CustomComponent />
</View>

<View>
  {someCondition && <Text>Conditional text</Text>}
</View>
```

#### Arrays of Components
```tsx
// Mapped components are OK
<View>
  {items.map(item => (
    <Text key={item.id}>{item.name}</Text>
  ))}
</View>
```

#### Children Prop
```tsx
// Children prop is OK
<View>
  {children}
</View>
```

### Why This Rule Exists

1. **Platform Consistency**: React Native's architecture requires text to be in Text components for proper rendering across iOS, Android, and Web
2. **Styling**: Text components have different styling properties than View components
3. **Accessibility**: Text components provide proper accessibility semantics
4. **Performance**: React Native optimizes text rendering when properly wrapped

### Automated Enforcement

This rule is enforced by ESLint:

```json
{
  "rules": {
    "react-native/no-raw-text": ["error", {
      "skip": ["Text"]
    }]
  }
}
```

### Fixing Violations

If you encounter violations:

1. **Automated Fix**: Run the fix script
   ```bash
   node scripts/fix-jsx-violations.js
   ```

2. **Manual Fix**: Wrap text in `<Text>` components
   ```tsx
   // Before
   <View>Some text</View>
   
   // After
   <View><Text>Some text</Text></View>
   ```

3. **Verify**: Run ESLint to check for remaining violations
   ```bash
   npm run lint
   ```

### Common Patterns

#### Labels and Values
```tsx
// ✅ Correct pattern for label-value pairs
<View style={styles.row}>
  <View style={styles.label}>
    <Text style={styles.labelText}>Name:</Text>
  </View>
  <View style={styles.value}>
    <Text style={styles.valueText}>{user.name}</Text>
  </View>
</View>
```

#### Multiline Text
```tsx
// ✅ Correct pattern for multiline text
<View style={styles.container}>
  <Text style={styles.description}>
    This is a longer description that spans
    multiple lines and needs proper formatting.
  </Text>
</View>
```

#### Conditional Text
```tsx
// ✅ Correct pattern for conditional text
<View>
  {isError && <Text style={styles.error}>Error message</Text>}
  {!isError && <Text style={styles.success}>Success message</Text>}
</View>
```

## Additional React Native Best Practices

### Avoid Inline Styles

**Rule**: Prefer StyleSheet.create() over inline styles for better performance.

#### ❌ Avoid
```tsx
<View style={{ padding: 20, backgroundColor: '#fff' }}>
  <Text style={{ fontSize: 16, color: '#000' }}>Hello</Text>
</View>
```

#### ✅ Prefer
```tsx
const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 16,
    color: '#000',
  },
});

<View style={styles.container}>
  <Text style={styles.text}>Hello</Text>
</View>
```

### Remove Unused Styles

**Rule**: Clean up unused style definitions to keep code maintainable.

The `react-native/no-unused-styles` rule will warn about styles that are defined but never used.

### Platform-Specific Components

**Rule**: Split platform-specific code into separate files when appropriate.

```tsx
// Button.ios.tsx
export const Button = () => <IOSButton />;

// Button.android.tsx
export const Button = () => <AndroidButton />;

// Usage (React Native automatically picks the right file)
import { Button } from './Button';
```

## Pre-commit Hooks

JSX structure validation runs automatically before commits. If violations are found:

1. The commit will be blocked
2. You'll see a list of violations
3. Run the fix script: `node scripts/fix-jsx-violations.js`
4. Review the changes
5. Commit again

## Resources

- [React Native Text Component](https://reactnative.dev/docs/text)
- [React Native StyleSheet](https://reactnative.dev/docs/stylesheet)
- [ESLint Plugin React Native](https://github.com/Intellicode/eslint-plugin-react-native)
- [React Native Best Practices](https://reactnative.dev/docs/performance)

## Questions?

If you have questions about these guidelines or encounter edge cases, please:

1. Check the [React Native documentation](https://reactnative.dev/)
2. Review existing components for examples
3. Ask in the team chat
4. Update this document with new patterns as they emerge


## Shadow and Visual Effects

### Shadow Props (Current API)

**Rule**: Use `boxShadow` for View components and `textShadow` for Text components.

As of November 2025, React Native Web deprecated the multi-property shadow API in favor of CSS-style string properties.

#### View Shadows

**✅ Current API (Use This)**
```tsx
const styles = StyleSheet.create({
  card: {
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3, // Keep for Android Material Design
  },
});
```

**❌ Deprecated API (Do Not Use)**
```tsx
const styles = StyleSheet.create({
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
```

#### Text Shadows

**✅ Current API (Use This)**
```tsx
const styles = StyleSheet.create({
  text: {
    textShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
  },
});
```

**❌ Deprecated API (Do Not Use)**
```tsx
const styles = StyleSheet.create({
  text: {
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
```

### Shadow Syntax

The `boxShadow` and `textShadow` properties use CSS shadow syntax:

```
[offsetX] [offsetY] [blurRadius] [color]
```

**Examples**:
```tsx
// Subtle shadow
boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)'

// Medium shadow
boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'

// Strong shadow
boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)'

// Elevated shadow
boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.2)'

// Negative offset (shadow above)
boxShadow: '0px -2px 4px rgba(0, 0, 0, 0.1)'
```

### Cross-Platform Considerations

#### Android Elevation

Always include `elevation` alongside `boxShadow` for Android Material Design shadows:

```tsx
const styles = StyleSheet.create({
  card: {
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)', // Web & iOS
    elevation: 3, // Android
  },
});
```

**Elevation Values**:
- `elevation: 1` - Subtle elevation (buttons, cards)
- `elevation: 2` - Medium elevation (raised buttons)
- `elevation: 3` - High elevation (floating action buttons)
- `elevation: 4` - Very high elevation (modals, dialogs)

#### Platform-Specific Shadows

For platform-specific shadow behavior:

```tsx
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  card: {
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
      ios: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
      android: {
        elevation: 3,
      },
    }),
  },
});
```

### Color Format

**Always use rgba format** for consistent cross-platform rendering:

```tsx
// ✅ Good - explicit rgba
boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'

// ✅ Good - rgba with color
boxShadow: '0px 2px 4px rgba(59, 130, 246, 0.5)'

// ❌ Avoid - hex colors may render inconsistently
boxShadow: '0px 2px 4px #00000019'
```

### Performance Considerations

1. **Limit Shadow Complexity**: Complex shadows can impact performance
2. **Use Elevation on Android**: Native elevation is more performant than boxShadow
3. **Avoid Animated Shadows**: Animating shadow properties can be expensive
4. **Consider Alternatives**: For simple effects, borders or backgrounds may be more performant

### Migration

If you encounter deprecated shadow props:

```bash
# Run the migration script
node scripts/migrate-deprecated-rn-web-apis.js --dry-run  # Preview
node scripts/migrate-deprecated-rn-web-apis.js            # Apply
```

See [React Native Web API Migration Guide](./react-native-web-api-migration-guide.md) for details.

## Related Documentation

- [React Native Web API Migration Guide](./react-native-web-api-migration-guide.md)
- [JSX Structure Fixes Summary](./jsx-structure-fixes-summary.md)
- [CLAUDE.md](../../CLAUDE.md) - Development workflow patterns
