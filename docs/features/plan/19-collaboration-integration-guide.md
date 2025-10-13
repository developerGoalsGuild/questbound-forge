# Collaboration System Integration Guide

## Quick Integration Steps

### 1. Update GoalDetails.tsx

Add these imports at the top:
```typescript
import { CollaboratorList } from '@/components/collaborations/CollaboratorList';
import { CommentSection } from '@/components/collaborations/CommentSection';
import { InviteCollaboratorModal } from '@/components/collaborations/InviteCollaboratorModal';
```

Add this state in the component:
```typescript
const [showInviteModal, setShowInviteModal] = useState(false);
const [isOwner, setIsOwner] = useState(false);

// Determine ownership (you'll need to implement this logic)
useEffect(() => {
  // Check if current user is the goal owner
  setIsOwner(user?.userId === goal?.userId);
}, [user, goal]);
```

Add this JSX before the closing tag of the main content area:
```typescript
{/* Collaboration Section */}
<div className="mt-8 space-y-6">
  <CollaboratorList
    resourceType="goal"
    resourceId={id}
    resourceTitle={goal?.title || 'Untitled Goal'}
    currentUserId={user?.userId}
    isOwner={isOwner}
    onInviteClick={() => setShowInviteModal(true)}
  />

  <CommentSection
    resourceType="goal"
    resourceId={id}
    className="mt-8"
  />
</div>

{/* Invite Modal */}
{showInviteModal && (
  <InviteCollaboratorModal
    isOpen={showInviteModal}
    onClose={() => setShowInviteModal(false)}
    resourceType="goal"
    resourceId={id}
    resourceTitle={goal?.title || 'Untitled Goal'}
    onInviteSent={() => {
      setShowInviteModal(false);
      // Optionally refresh data
    }}
  />
)}
```

### 2. Update QuestDetails.tsx

Add the same imports and state management as above, then add this JSX:
```typescript
{/* Collaboration Section */}
<div className="mt-8 space-y-6">
  <CollaboratorList
    resourceType="quest"
    resourceId={id}
    resourceTitle={quest?.title || 'Untitled Quest'}
    currentUserId={user?.userId}
    isOwner={isOwner}
    onInviteClick={() => setShowInviteModal(true)}
  />

  <CommentSection
    resourceType="quest"
    resourceId={id}
    className="mt-8"
  />
</div>

{/* Invite Modal */}
{showInviteModal && (
  <InviteCollaboratorModal
    isOpen={showInviteModal}
    onClose={() => setShowInviteModal(false)}
    resourceType="quest"
    resourceId={id}
    resourceTitle={quest?.title || 'Untitled Quest'}
    onInviteSent={() => {
      setShowInviteModal(false);
      // Optionally refresh data
    }}
  />
)}
```

### 3. Add Invite Buttons to Action Bars

In both GoalDetails and QuestDetails, add invite buttons to existing action bars:

```typescript
{isOwner && (
  <Button
    onClick={() => setShowInviteModal(true)}
    className="flex items-center gap-2"
  >
    <UserPlus className="h-4 w-4" />
    Invite Collaborator
  </Button>
)}
```

### 4. Test the Integration

1. Start the development server: `npm run dev`
2. Navigate to a goal or quest details page
3. Verify collaboration components appear
4. Test inviting collaborators
5. Test commenting and reactions

## Files Modified

- `frontend/src/pages/goals/GoalDetails.tsx`
- `frontend/src/pages/quests/QuestDetails.tsx`

## Components Used

- `CollaboratorList` - Shows collaborators and management actions
- `CommentSection` - Full comment and reaction system
- `InviteCollaboratorModal` - Modal for sending invites

## API Endpoints Used

- `POST /collaborations/invites` - Send invites
- `GET /collaborations/resources/{type}/{id}/collaborators` - List collaborators
- `GET /collaborations/resources/{type}/{id}/comments` - List comments
- `POST /collaborations/comments` - Create comments
- `POST /collaborations/comments/{id}/reactions` - Add reactions

## Next Steps

1. Implement the integration as described above
2. Run the test scenarios from the integration test document
3. Fix any issues found during testing
4. Deploy to staging environment
5. Conduct user acceptance testing
6. Production deployment

