# Quest Notifications Testing Guide

## Overview

This guide provides comprehensive instructions for testing the quest notification system, including both automated tests and manual testing procedures.

## Notification Types

The system supports the following notification types:

1. **Quest Started** - When a quest is activated
2. **Quest Completed** - When a quest is finished successfully
3. **Quest Failed** - When a quest fails or is cancelled
4. **Progress Milestone** - When quest progress reaches certain percentages
5. **Deadline Warning** - When a quest deadline is approaching
6. **Streak Achieved** - When user achieves quest completion streaks
7. **Challenge Joined** - When user joins a quest challenge

## Automated Testing

### Running Unit Tests

```bash
# Run all notification tests
npm test -- --testPathPattern="notifications"

# Run with coverage
npm test -- --testPathPattern="notifications" --coverage

# Run in watch mode
npm test -- --testPathPattern="notifications" --watch
```

### Test Files

- `frontend/src/__tests__/notifications/QuestNotifications.test.tsx` - Main notification hook tests
- `frontend/src/__tests__/lib/questNotifications.test.ts` - Notification utility tests

### Test Coverage

The automated tests cover:
- ✅ All notification types
- ✅ User preference filtering
- ✅ Error handling
- ✅ Message formatting
- ✅ Translation integration

## Manual Testing

### 1. Setup Test Environment

#### Enable Development Mode
```bash
# Ensure you're in development mode
NODE_ENV=development npm run dev
```

#### Add Notification Tester Component
Add the `NotificationTester` component to any page for easy testing:

```tsx
import { NotificationTester } from '@/components/dev/NotificationTester';

// Add to your component
<NotificationTester />
```

### 2. Test User Preferences

#### Configure Notification Settings
1. Go to **Profile → Edit → Notifications**
2. Configure notification preferences:
   - Enable/disable specific notification types
   - Set notification channels (in-app, email, push)
   - Test different language settings

#### Test Scenarios
- **All Enabled**: Enable all notification types and in-app notifications
- **Selective**: Enable only specific types (e.g., only quest completed)
- **Disabled**: Disable in-app notifications
- **No Preferences**: Test with user having no notification preferences

### 3. Test Notification Types

#### Quest Started Notifications
1. **Create a new quest** in draft status
2. **Start the quest** (change status to active)
3. **Verify notification appears** in top-right corner
4. **Check message content** matches expected format

#### Quest Completed Notifications
1. **Complete a quest** (change status to completed)
2. **Verify notification appears** with success message
3. **Test different quest titles** to verify message formatting

#### Quest Failed Notifications
1. **Fail a quest** (change status to failed)
2. **Verify notification appears** with failure message
3. **Test cancellation scenarios**

#### Progress Milestone Notifications
1. **Update quest progress** to trigger milestones (25%, 50%, 75%, 100%)
2. **Verify notifications appear** with percentage information
3. **Test different milestone thresholds**

#### Deadline Warning Notifications
1. **Set quest deadline** to near future (e.g., 1 hour from now)
2. **Trigger deadline warning** (usually automated)
3. **Verify warning message** appears

#### Streak Achieved Notifications
1. **Complete multiple quests** in sequence
2. **Trigger streak calculation** (usually automated)
3. **Verify streak notification** with day count

#### Challenge Joined Notifications
1. **Join a quest challenge** (if available)
2. **Verify challenge notification** appears
3. **Test different challenge types**

### 4. Test User Preference Filtering

#### Test Disabled Notifications
1. **Disable specific notification types** in user preferences
2. **Trigger those notification types**
3. **Verify notifications are NOT shown**

#### Test Channel Filtering
1. **Disable in-app notifications** in user preferences
2. **Trigger any notification**
3. **Verify no toast notifications appear**

#### Test No Preferences
1. **Remove notification preferences** from user profile
2. **Trigger notifications**
3. **Verify no notifications appear**

### 5. Test Internationalization

#### Test Different Languages
1. **Change user language** to Spanish/French
2. **Trigger notifications**
3. **Verify messages appear in correct language**

#### Test Message Formatting
1. **Use quest titles with special characters**
2. **Test long quest titles**
3. **Verify message truncation and formatting**

### 6. Test Error Handling

#### Test API Failures
1. **Simulate network errors** during quest operations
2. **Verify notifications still work** with cached data
3. **Check error logging** in browser console

#### Test Invalid Data
1. **Test with malformed quest data**
2. **Verify graceful error handling**
3. **Check fallback messages**

## Integration Testing

### 1. Quest Operations Integration

#### Test Quest Lifecycle
1. **Create quest** → Should not trigger notification (draft status)
2. **Start quest** → Should trigger "Quest Started" notification
3. **Update progress** → Should trigger milestone notifications
4. **Complete quest** → Should trigger "Quest Completed" notification

#### Test Quest Management
1. **Edit quest** → Should not trigger notifications
2. **Delete quest** → Should not trigger notifications
3. **Cancel quest** → Should trigger "Quest Failed" notification

### 2. Real-time Updates

#### Test Periodic Refresh
1. **Enable auto-refresh** in quest dashboard
2. **Complete quest in another session/tab**
3. **Verify notification appears** when data refreshes

#### Test Manual Refresh
1. **Manually refresh quest data**
2. **Verify notifications trigger** for status changes
3. **Check notification timing**

### 3. Cross-Component Integration

#### Test Dashboard Integration
1. **Use quest dashboard** with notifications enabled
2. **Perform quest operations**
3. **Verify notifications work** in dashboard context

#### Test Quest Details Integration
1. **Use quest details page** with notifications enabled
2. **Update quest status**
3. **Verify notifications work** in details context

## Performance Testing

### 1. Notification Volume

#### Test Multiple Notifications
1. **Trigger many notifications** in quick succession
2. **Verify UI performance** remains good
3. **Check notification queuing** behavior

#### Test Notification Cleanup
1. **Let notifications expire** (5-second duration)
2. **Verify cleanup** happens properly
3. **Check memory usage**

### 2. User Experience

#### Test Notification Timing
1. **Verify notifications appear** at appropriate times
2. **Check notification duration** (5 seconds)
3. **Test notification positioning** (top-right)

#### Test Notification Dismissal
1. **Click on notifications** to dismiss
2. **Verify dismissal** works properly
3. **Test keyboard accessibility**

## Debugging

### 1. Console Logging

#### Enable Debug Logging
```javascript
// In browser console
localStorage.setItem('QUEST_LOG_ENABLED', 'true');
```

#### Check Log Messages
- Look for "Quest notification sent" messages
- Check for "Notification skipped due to user preferences" messages
- Verify error messages for failed notifications

### 2. Network Monitoring

#### Check API Calls
1. **Open browser DevTools** → Network tab
2. **Trigger quest operations**
3. **Verify profile updates** are sent to backend
4. **Check for failed API calls**

### 3. State Inspection

#### Check User Data
```javascript
// In browser console
console.log('User data:', window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
```

#### Check Notification State
```javascript
// In browser console
// Check if notifications are being triggered
```

## Common Issues and Solutions

### Issue: Notifications Not Appearing
**Causes:**
- User preferences disabled
- In-app notifications disabled
- User not authenticated
- Translation errors

**Solutions:**
1. Check user notification preferences
2. Verify in-app notifications are enabled
3. Ensure user is properly authenticated
4. Check browser console for errors

### Issue: Wrong Language in Notifications
**Causes:**
- User language not set correctly
- Translation files missing
- Language detection failing

**Solutions:**
1. Check user profile language setting
2. Verify translation files are loaded
3. Test language switching functionality

### Issue: Notifications Appearing Too Often
**Causes:**
- Duplicate event triggers
- Incorrect change detection
- Race conditions

**Solutions:**
1. Check for duplicate API calls
2. Verify change detection logic
3. Add debouncing if needed

### Issue: Performance Problems
**Causes:**
- Too many notifications
- Memory leaks
- Inefficient rendering

**Solutions:**
1. Limit notification frequency
2. Implement notification queuing
3. Optimize rendering performance

## Test Checklist

### Pre-Testing Setup
- [ ] Development environment running
- [ ] User authenticated and logged in
- [ ] Notification preferences configured
- [ ] Browser console open for debugging

### Basic Functionality
- [ ] Quest started notifications work
- [ ] Quest completed notifications work
- [ ] Quest failed notifications work
- [ ] Progress milestone notifications work
- [ ] Deadline warning notifications work
- [ ] Streak achieved notifications work
- [ ] Challenge joined notifications work

### User Preferences
- [ ] Disabled notification types are skipped
- [ ] In-app notifications can be disabled
- [ ] No preferences = no notifications
- [ ] Language changes affect notification messages

### Error Handling
- [ ] API failures don't break notifications
- [ ] Invalid data is handled gracefully
- [ ] Error messages are logged properly
- [ ] Fallback messages work

### Performance
- [ ] Multiple notifications don't break UI
- [ ] Notifications auto-dismiss after 5 seconds
- [ ] Memory usage remains stable
- [ ] No memory leaks detected

### Integration
- [ ] Notifications work in quest dashboard
- [ ] Notifications work in quest details
- [ ] Real-time updates trigger notifications
- [ ] Manual refresh triggers notifications

## Reporting Issues

When reporting notification issues, include:

1. **Environment details**: Browser, OS, app version
2. **User state**: Authentication status, preferences
3. **Steps to reproduce**: Exact actions taken
4. **Expected behavior**: What should happen
5. **Actual behavior**: What actually happened
6. **Console logs**: Any error messages
7. **Screenshots**: If applicable

## Conclusion

This testing guide provides comprehensive coverage of the quest notification system. Regular testing ensures the notification system works reliably and provides a good user experience.

For additional support or questions, refer to the development team or check the project documentation.
