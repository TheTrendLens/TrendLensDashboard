# Mass Edit Functionality - Implementation Documentation

## Overview
This document describes the mass edit functionality implemented for the action-required-tables component, allowing users to edit all item costs simultaneously without clicking individual edit buttons.

## Features Implemented

### 1. Mass Edit Button
- Located in the header of the action-required-tables component
- Toggles between "Edit All" and "Save All" states
- Changes color from brand blue to green when in save mode
- Dynamic instruction text that changes based on current mode

### 2. Mass Edit Mode Behavior
When mass edit mode is activated:
- All item cost fields automatically become editable input fields
- Individual edit buttons (tick/cross) are hidden
- Sale cards show "Mass Edit" indicator in blue
- Card navigation is disabled (cards are not clickable)
- Users can edit multiple item costs simultaneously

### 3. Auto-Save Functionality
- Changes are automatically saved when users click away from input fields (blur event)
- Users can also press Enter to save individual fields
- Clicking "Save All" exits mass edit mode and refreshes data

### 4. Visual Indicators
- Cards show "Mass Edit" indicator when in mass edit mode
- Cursor changes to default (not clickable) when in mass edit mode
- Input fields are clearly visible with focus styling

## How to Use

1. Navigate to the Action Required page
2. Click the "Edit All" button in the header
3. All item cost fields become editable
4. Edit the desired item costs directly
5. Changes are saved automatically when clicking away from fields
6. Click "Save All" to exit mass edit mode

## Technical Implementation

### Files Modified
1. `action-required-tables.component.ts` - Added mass edit state and methods
2. `action-required-tables.component.html` - Added mass edit button and updated template
3. `sale-card.component.ts` - Added mass edit input property and updated navigation logic
4. `sale-card.component.html` - Updated template to handle mass edit mode

### Key Features
- Prevents card navigation during mass edit mode
- Hides individual edit buttons during mass edit mode
- Automatically enables all item cost inputs
- Provides clear visual feedback to users
- Maintains existing individual edit functionality
