# Flip-Flop Authentication Feature

## Overview
The login and signup forms now use a smooth 3D flip animation to switch between the two forms, creating a more engaging and modern user experience.

## Features

### 1. **3D Card Flip Animation**
- The form container flips 180 degrees on the Y-axis when switching between login and signup
- Uses CSS 3D transforms with `perspective` and `transform-style: preserve-3d`
- Smooth cubic-bezier easing for natural motion

### 2. **Single Unified Component**
- Both login and signup forms are in one `Auth.jsx` component
- Reduces code duplication and improves maintainability
- Shared state management for better performance

### 3. **Interactive Toggle**
- Click "Don't have an account? Sign up" to flip to signup
- Click "Already have an account? Sign in" to flip back to login
- Prevents multiple clicks during animation with `isFlipping` state

### 4. **Enhanced Animations**
- Box hover effect lifts the form slightly
- Input fields animate on focus
- Error messages shake when displayed
- Shimmer effect on buttons
- Rotating glow lines on button hover

### 5. **Responsive Design**
- Works seamlessly on desktop, tablet, and mobile
- Maintains flip animation across all screen sizes
- Optimized for touch interactions

## Technical Implementation

### Component Structure
```
Auth.jsx
├── StarBackground (no meteors)
├── Header (logo, back button, theme toggle)
└── Flip Container
    ├── Front Card (Login Form)
    └── Back Card (Signup Form)
```

### Key CSS Classes
- `.flip-container` - Provides 3D perspective
- `.flipper` - The rotating element
- `.flipped` - Applied when showing signup form
- `.flip-card.front` - Login form
- `.flip-card.back` - Signup form (rotated 180deg initially)

### Animation Timing
- Flip duration: 0.8s
- Easing: cubic-bezier(0.4, 0, 0.2, 1)
- Hover transitions: 0.3-0.4s
- Shimmer effect: 0.6s

## Routes
All these routes now point to the same Auth component:
- `/auth` - Main auth route
- `/login` - Legacy route (still works)
- `/register` - Legacy route (still works)

## Benefits
1. **Better UX** - Smooth, engaging transition between forms
2. **Less Navigation** - No page reload or route change needed
3. **Modern Design** - 3D effects create a premium feel
4. **Cleaner Code** - Single component instead of two separate ones
5. **Consistent State** - Shared authentication logic

## Browser Support
- Works in all modern browsers that support CSS 3D transforms
- Graceful fallback for older browsers (no flip, instant switch)
