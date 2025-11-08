# Inventory Management - Screen States & Wireframe Specifications

## Screen Architecture Overview

The inventory management interface consists of five primary screen categories, each designed to reduce cognitive load while providing comprehensive inventory oversight. All screens follow the psychology-based design principles of certainty creation and stress signal mitigation.

### Navigation Structure
```
Dashboard → Inventory → Shopping → Analytics → Settings
    ↓         ↓         ↓         ↓         ↓
 Overview   Stock    Orders   Insights  Config
 Alerts     Search   Lists    Reports   Profiles
 Quick      Scan     Compare  Trends    Rules
 Actions    Update   Track    Export    Backup
```

## 1. Dashboard Screen States

### 1.1 Dashboard - Default State

**Layout Structure**: Hierarchical card-based layout with traffic light visual system
**Container**: Full-screen scrollable with 16px margins, 12px card spacing

#### Visual Design Specifications
- **Header Section** (80px height)
  - Typography: H2 "Inventory Overview" (24px, Semibold, Primary-900)
  - Right-aligned settings icon (24px, Neutral-600)
  - Background: White with subtle shadow

- **Status Overview Cards** (Grid layout, 2x2 on mobile, 4x1 on tablet+)
  - **Card Dimensions**: 160px height, 8px border radius, 2px border
  - **Critical Items Card** (Red accent border)
    - Typography: H4 number (32px, Bold, Error-600), Caption label (12px, Error-600)
    - Icon: Alert triangle (20px, Error-600)
    - Tap target: Full card (44px+ minimum height)
  
  - **Low Stock Card** (Yellow accent border)
    - Typography: H4 number (32px, Bold, Warning-600), Caption label (12px, Warning-600)
    - Icon: Warning circle (20px, Warning-600)
    - Progress indicator: Thin bar showing collective stock health
  
  - **Well Stocked Card** (Green accent border)
    - Typography: H4 number (32px, Bold, Success-600), Caption label (12px, Success-600)
    - Icon: Checkmark circle (20px, Success-600)
    - Subtle positive reinforcement animation on refresh
  
  - **Pending Orders Card** (Blue accent border)
    - Typography: H4 number (32px, Bold, Primary-600), Caption label (12px, Primary-600)
    - Icon: Truck delivery (20px, Primary-600)
    - Real-time update indicator

- **Quick Actions Section** (120px height)
  - **Scan Barcode Button** (Primary CTA)
    - Dimensions: 140px width, 48px height
    - Typography: Body (16px, Medium, White)
    - Background: Primary-600 with camera icon (20px)
    - Hover state: Primary-700 with subtle scale (1.02x)
  
  - **Add Item Button** (Secondary CTA)
    - Dimensions: 120px width, 48px height
    - Typography: Body (16px, Medium, Primary-600)
    - Background: Primary-50 with plus icon (20px, Primary-600)
    - Border: 1px solid Primary-200

- **Recent Activity Feed** (Scrollable section)
  - **Item height**: 64px with 1px separator
  - **Typography**: Body text (14px) with timestamps (12px, Neutral-500)
  - **Icons**: Category-specific icons (16px) with status indicators
  - **Interaction**: Swipe for quick actions, tap for details

#### Interaction Design Specifications
- **Pull-to-refresh**: Custom animation with inventory sync indicator
- **Card tap actions**: Navigate to detailed views with slide transition
- **Swipe gestures**: Left swipe on activity items reveals quick actions
- **Loading states**: Skeleton screens for data fetching with shimmer effect
- **Error states**: Inline error messages with retry options

#### Animation & Motion Specifications
- **Entry animation**: Staggered fade-in of cards (100ms delay between each)
- **Data updates**: Subtle number counting animation for stock changes
- **Status changes**: Color transition animations (300ms ease-out)
- **Pull refresh**: Custom elastic scroll with loading spinner

### 1.2 Dashboard - Critical Alert State

**Trigger**: When any item reaches 0-24 hours of supply remaining

#### Visual Design Modifications
- **Alert Banner**: Full-width red gradient banner (60px height) at top
  - Typography: H5 "Immediate attention needed" (18px, Bold, White)
  - Background: Linear gradient Error-600 to Error-500
  - Icon: Urgent alert (24px, White)
  - Close button: X icon (20px, White, right-aligned)

- **Critical Items Expansion**: Detailed list replaces overview cards
  - **Item cards**: 80px height, Error-50 background, Error-200 border
  - **Urgency indicators**: Time remaining (large, bold), usage rate graph
  - **Action buttons**: "Order Now" (Primary), "Adjust Settings" (Secondary)

#### Interaction Design Specifications
- **Haptic feedback**: Strong vibration pattern on alert appearance
- **Auto-focus**: Scrolls to critical items automatically
- **Quick reorder**: One-tap ordering for pre-configured items
- **Snooze options**: Temporary alert dismissal with reminder scheduling

### 1.3 Dashboard - Loading State

**Skeleton Structure**: Mimics final layout with placeholder elements
- **Cards**: Gray rectangles (Neutral-100) with shimmer animation
- **Text**: Line placeholders of varying widths
- **Icons**: Circular placeholders with pulse animation
- **Duration**: Maximum 3 seconds before error state

### 1.4 Dashboard - Empty State

**First-time user experience**
- **Illustration**: Custom family inventory illustration (200px height)
- **Typography**: H3 "Start tracking your family's supplies" (20px, Semibold)
- **Body text**: Encouraging message about stress reduction benefits
- **CTA Button**: "Add Your First Item" (Primary, full-width on mobile)

## 2. Stock Management Screen States

### 2.1 Current Stock - Default View

**Layout**: List view with category grouping and filter options

#### Visual Design Specifications
- **Search & Filter Header** (120px height)
  - **Search bar**: Full-width input with search icon and voice input option
  - **Filter chips**: Horizontally scrollable tags (Categories, Children, Status)
  - **Sort dropdown**: "Last updated", "Alphabetical", "Stock level", "Expiration"
  - **View toggle**: List/grid view switch (right-aligned)

- **Category Sections**: Collapsible sections with item counts
  - **Section headers** (48px height)
    - Typography: H4 category name (18px, Semibold) + item count (14px, Neutral-600)
    - Background: Neutral-50 with category color accent (4px left border)
    - Expand/collapse chevron (20px, right-aligned)
  
  - **Item rows** (72px height in list view)
    - **Left section**: Product image/icon (48px square) + stock indicator dot
    - **Center section**: 
      - Primary text: Item name (16px, Medium)
      - Secondary text: Current stock + unit (14px, Neutral-600)
      - Tertiary text: "X days remaining" or expiration date (12px)
    - **Right section**: 
      - Stock level indicator (circular progress, 32px)
      - Overflow menu (24px touch target)

#### Stock Level Visual Indicators
- **Critical (0-2 days)**: Red progress circle, red dot indicator
- **Low (3-7 days)**: Yellow progress circle, yellow dot indicator
- **Adequate (8-14 days)**: Green progress circle, green dot indicator
- **Overstocked (30+ days)**: Blue progress circle, blue dot indicator

#### Interaction Design Specifications
- **Long press**: Multi-select mode activation
- **Swipe right**: Quick add stock
- **Swipe left**: Quick actions menu (Edit, Delete, Reorder)
- **Tap**: Navigate to item detail view
- **Pull to refresh**: Update stock levels and predictions

### 2.2 Stock Management - Barcode Scanning State

**Full-screen camera overlay with scanning interface**

#### Visual Design Specifications
- **Camera viewport**: Full screen with overlay frame
- **Scanning frame**: 280px square with animated corners
- **Instructions overlay**: Semi-transparent black (60% opacity)
  - Typography: H4 "Position barcode in frame" (18px, Medium, White)
  - Flashlight toggle (top-right, 44px touch target)
  - Manual entry link (bottom center)

- **Success state**: Green checkmark with item preview
  - Typography: H5 "Item found" + product name
  - Action buttons: "Add to Inventory" (Primary), "Scan Another" (Secondary)

- **Error state**: Red X with retry options
  - Typography: H5 "Barcode not recognized"
  - Action buttons: "Try Again" (Primary), "Enter Manually" (Secondary)

#### Animation Specifications
- **Scanning animation**: Sweeping line with 2-second cycle
- **Corner animation**: Pulsing corner indicators
- **Success animation**: Checkmark scale-in with bounce
- **Error animation**: Shake animation with haptic feedback

### 2.3 Stock Management - Manual Entry State

**Modal/full-screen form for manual item addition**

#### Visual Design Specifications
- **Form container**: White background with 16px padding
- **Progress indicator**: Step counter "1 of 4" at top
- **Form fields** (Sequential revelation):
  1. **Item name**: Text input with autocomplete suggestions
  2. **Category**: Picker with child assignment options
  3. **Current stock**: Number input with unit selector
  4. **Thresholds**: Min/max stock levels with visual slider

#### Field Specifications
- **Input height**: 48px minimum for touch accessibility
- **Label typography**: Body Small (14px, Medium, Neutral-700)
- **Input typography**: Body (16px, Regular, Neutral-900)
- **Error states**: Red border with error message below
- **Success states**: Green border with checkmark icon

### 2.4 Stock Management - Multi-Select State

**Batch operations interface activated by long-press**

#### Visual Design Specifications
- **Selection header**: Replaces normal header with count and actions
  - Typography: H4 "X items selected" (18px, Medium)
  - Actions: "Select All", "Delete", "Update Stock", "Create List"
- **Item modification**: Selected items show checkmark overlay
- **Floating action menu**: Bottom sheet with batch operation options

## 3. Shopping & Orders Screen States

### 3.1 Automated Orders - Default View

**Dashboard showing all automated reorder rules and pending orders**

#### Visual Design Specifications
- **Status summary cards** (Top section, 3-card layout)
  - **Active Rules**: Number + "automated items" label
  - **Pending Orders**: Dollar amount + "in transit" label  
  - **This Month**: Total saved + percentage vs manual shopping

- **Active automations list**: Expandable cards showing reorder rules
  - **Card header** (64px height):
    - Item name + category badge
    - Status indicator (Active/Paused) with toggle switch
    - Current stock level with trend arrow
  - **Card expansion**: Reorder thresholds, preferred retailers, next order prediction
  - **Action buttons**: Edit rule, View history, Pause automation

#### Rule Status Indicators
- **Active**: Green switch position with "Auto" label
- **Paused**: Gray switch position with "Manual" label
- **Triggered**: Orange switch with "Ordering" label + spinner
- **Error**: Red switch with warning icon + error message

### 3.2 Shopping Lists - Generation View

**AI-generated shopping lists with manual override options**

#### Visual Design Specifications
- **List header** (100px height):
  - Typography: H3 list name (20px, Semibold) + date generated
  - Metadata: Total items, estimated cost, preferred store
  - Action buttons: "Optimize Route", "Share List", "Start Shopping"

- **Item grouping**: By store section or category
  - **Section headers**: Store section name (Produce, Dairy, etc.)
  - **Item rows** (56px height):
    - Checkbox for completion (24px touch target)
    - Item name + quantity needed
    - Price estimate + "best price at [store]" if applicable
    - Quick add to different quantity

#### Smart Suggestions Section
- **Bulk opportunities**: "Buy 3, save $X" recommendations
- **Seasonal items**: "Consider adding" suggestions with rationale
- **Substitutions**: "Similar item, better price" alternatives

### 3.3 Price Comparison - Analysis View

**Multi-retailer price comparison with historical trends**

#### Visual Design Specifications
- **Item header**: Large product image + name + current stock status
- **Price comparison table**: 
  - Retailer logos (32px) + current prices + stock status
  - Delivery time estimates + delivery cost
  - Member pricing (if applicable) with distinct styling
  - "Best value" badge for optimal choice

- **Price history chart**: 90-day price trend with purchase history overlay
  - Line graph with retailer color coding
  - Purchase points marked with dots
  - Seasonal pattern indicators

- **Bulk analysis section**:
  - Unit price breakdown table
  - Break-even quantity calculations
  - Storage impact assessment

### 3.4 Order Tracking - Status View

**Real-time order status with delivery predictions**

#### Visual Design Specifications
- **Order timeline**: Vertical progress indicator with status nodes
  - Completed steps: Green circles with checkmarks
  - Current step: Blue circle with spinner/progress
  - Future steps: Gray circles with estimated times

- **Delivery map**: Embedded map showing delivery progress (if available)
- **Contact options**: Direct links to retailer customer service
- **Modification options**: Cancel, reschedule, or modify order (if allowed)

## 4. Analytics & Insights Screen States

### 4.1 Usage Analytics - Overview

**Comprehensive dashboard showing consumption patterns and predictions**

#### Visual Design Specifications
- **Time period selector**: Tabs for Last 7 days, Month, Quarter, Year
- **Key metrics grid** (2x2 layout):
  - **Prediction accuracy**: Percentage with trend indicator
  - **Cost savings**: Dollar amount vs estimated retail baseline
  - **Waste reduction**: Percentage of items used before expiration
  - **Time saved**: Hours not spent shopping

- **Usage pattern charts**:
  - **Consumption heatmap**: Calendar view showing high/low usage days
  - **Category breakdown**: Pie chart of spending by category
  - **Child-specific trends**: Line charts for multi-child families
  - **Seasonal predictions**: Forecast charts for upcoming periods

### 4.2 Cost Analysis - Detailed View

**Financial analysis with optimization recommendations**

#### Visual Design Specifications
- **Spending overview**: Monthly spending trend with budget comparison
- **Savings breakdown**: 
  - Bulk purchase savings
  - Sale timing savings
  - Automation efficiency savings
  - Waste reduction savings

- **Optimization opportunities**:
  - "Switch to bulk" recommendations with impact calculations
  - "Try different retailer" suggestions with potential savings
  - "Adjust timing" recommendations for seasonal purchases

## 5. Settings & Configuration Screen States

### 5.1 Automation Rules - Configuration

**Detailed settings for automated reorder system**

#### Visual Design Specifications
- **Master controls**: Global automation toggle with safety settings
- **Rule templates**: Pre-configured rules for common items
- **Custom rule builder**: 
  - Item selection with search/filter
  - Threshold sliders with visual feedback
  - Retailer preference ranking
  - Budget limits and approval requirements

### 5.2 Family Profiles - Management

**Child profile configuration affecting inventory predictions**

#### Visual Design Specifications
- **Profile cards**: Child photo + name + key metrics (age, sizes, preferences)
- **Size tracking**: Current sizes with growth prediction charts
- **Preference management**: Item likes/dislikes affecting automated ordering
- **Special needs**: Medical requirements, allergies, dietary restrictions

### 5.3 Notification Settings - Customization

**Granular control over inventory-related notifications**

#### Visual Design Specifications
- **Notification categories**: Grouped toggles with examples
  - Critical alerts (always on, adjustable timing only)
  - Reorder confirmations
  - Price alerts
  - Delivery updates
  - Weekly summaries

- **Quiet hours**: Time range selector with family schedule awareness
- **Emergency overrides**: Settings for true emergency situations

## Responsive Design Specifications

### Mobile (320-767px)
- **Single column layouts** with full-width cards
- **Thumb-friendly navigation** with bottom tab bar
- **Swipe gestures** for primary interactions
- **Collapsed information** with expand-on-demand

### Tablet (768-1023px)
- **Two-column layouts** with sidebar navigation
- **Hover states** for interactive elements
- **Larger touch targets** (48px minimum)
- **Side-by-side comparisons** for shopping features

### Desktop (1024px+)
- **Multi-column dashboards** with detailed information
- **Keyboard shortcuts** for power users
- **Detailed tooltips** and hover previews
- **Bulk operations** with multi-select interfaces

## Accessibility Specifications

### Screen Reader Support
- **Semantic HTML**: Proper heading hierarchy and landmark roles
- **ARIA labels**: Descriptive labels for complex UI elements
- **Live regions**: Dynamic content updates announced appropriately
- **Alternative text**: Comprehensive alt text for images and icons

### Keyboard Navigation
- **Tab order**: Logical flow through interactive elements
- **Focus indicators**: High contrast focus rings (3px, Primary-600)
- **Keyboard shortcuts**: Configurable shortcuts for common actions
- **Skip links**: Navigation bypass options for efficiency

### Visual Accessibility
- **Color contrast**: WCAG AA compliance (4.5:1 minimum)
- **Color independence**: Status communicated through multiple means
- **Font sizing**: Support for system font scaling
- **Reduced motion**: Alternative animations for motion-sensitive users

## Performance Optimization

### Loading Strategies
- **Progressive loading**: Critical information first, details on demand
- **Image optimization**: WebP format with fallbacks, lazy loading
- **Data caching**: Smart caching of inventory data with sync strategies
- **Offline support**: Core functionality available without connectivity

### Memory Management
- **Virtualized lists**: Efficient rendering of large inventory lists
- **Image cleanup**: Automatic disposal of unused product images
- **Data pagination**: Chunked loading of historical data
- **Background processing**: Off-main-thread calculations for predictions