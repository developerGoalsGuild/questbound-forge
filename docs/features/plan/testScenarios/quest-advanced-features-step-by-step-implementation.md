# Quest Advanced Features - Step-by-Step Implementation Guide

## Overview

This guide provides a detailed, step-by-step implementation plan for Quest Advanced Features (6.2-6.4) following the test scenarios. Each step includes specific tasks, code examples, and validation criteria.

---

## Phase 1: Quest Notifications (6.2) - Step-by-Step Implementation

### Step 1.1: Backend Model Extensions

#### Step 1.1.1: Create Notification Preferences Model
**Location**: `backend/services/user-service/app/models.py`

**Tasks**:
1. Add `NotificationPreferences` class
2. Update `UserProfile` model
3. Update `ProfileUpdate` model

**Implementation**:
```python
# Add to models.py
class NotificationPreferences(BaseModel):
    questStarted: bool = True
    questCompleted: bool = True
    questFailed: bool = True
    questProgress: bool = True
    questDeadline: bool = True
    questStreak: bool = True
    questChallenge: bool = True
    
    channels: dict = {
        "inApp": True,
        "email": True,
        "push": False
    }

class UserProfile(BaseModel):
    # ... existing fields ...
    notificationPreferences: Optional[NotificationPreferences] = None

class ProfileUpdate(BaseModel):
    # ... existing fields ...
    notificationPreferences: Optional[NotificationPreferences] = None
```

**Validation**:
- [ ] `NotificationPreferences` class created
- [ ] All 7 notification types defined
- [ ] Channels object with 3 options
- [ ] `UserProfile` includes optional field
- [ ] `ProfileUpdate` includes optional field

#### Step 1.1.2: Update Profile Update Endpoint
**Location**: `backend/services/user-service/app/routes/profile_routes.py`

**Tasks**:
1. Modify profile update logic
2. Handle notification preferences
3. Add validation

**Implementation**:
```python
@router.put("/profile")
async def update_profile(
    profile_update: ProfileUpdate,
    current_user: User = Depends(get_current_user)
):
    try:
        # Update notification preferences if provided
        if profile_update.notificationPreferences:
            # Validate notification preferences
            if not isinstance(profile_update.notificationPreferences, dict):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid notification preferences format"
                )
            
            # Update user profile with notification preferences
            await update_user_notification_preferences(
                current_user.user_id,
                profile_update.notificationPreferences
            )
        
        # ... rest of profile update logic ...
        
        return {"message": "Profile updated successfully"}
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

**Validation**:
- [ ] Notification preferences saved to database
- [ ] Profile retrieval returns updated preferences
- [ ] Partial updates work correctly
- [ ] Invalid values rejected with proper error messages

### Step 1.2: Frontend Notification Preferences UI

#### Step 1.2.1: Create Notification Preferences Component
**Location**: `frontend/src/components/profile/NotificationPreferences.tsx`

**Tasks**:
1. Create component structure
2. Add notification toggles
3. Add language selector
4. Implement form handling

**Implementation**:
```typescript
interface NotificationPreferencesProps {
  preferences: NotificationPreferences;
  onSave: (preferences: NotificationPreferences) => void;
  isLoading: boolean;
}

interface NotificationPreferences {
  questStarted: boolean;
  questCompleted: boolean;
  questFailed: boolean;
  questProgress: boolean;
  questDeadline: boolean;
  questStreak: boolean;
  questChallenge: boolean;
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
  };
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  preferences,
  onSave,
  isLoading
}) => {
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences>(preferences);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const { t } = useTranslation();

  const handleToggle = (key: keyof NotificationPreferences) => {
    setLocalPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleChannelToggle = (channel: keyof NotificationPreferences['channels']) => {
    setLocalPreferences(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: !prev.channels[channel]
      }
    }));
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    // Trigger language change in app
    i18n.changeLanguage(language);
  };

  const handleSave = () => {
    onSave(localPreferences);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          {t('profile.notifications.title')}
        </h3>
        <p className="text-sm text-gray-500">
          {t('profile.notifications.description')}
        </p>
      </div>

      {/* Notification Types */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">
          {t('profile.notifications.types.title')}
        </h4>
        {Object.entries(localPreferences).map(([key, value]) => {
          if (key === 'channels') return null;
          return (
            <div key={key} className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                {t(`profile.notifications.types.${key}`)}
              </label>
              <Switch
                checked={value as boolean}
                onCheckedChange={() => handleToggle(key as keyof NotificationPreferences)}
              />
            </div>
          );
        })}
      </div>

      {/* Channels */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">
          {t('profile.notifications.channels.title')}
        </h4>
        {Object.entries(localPreferences.channels).map(([channel, enabled]) => (
          <div key={channel} className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              {t(`profile.notifications.channels.${channel}`)}
            </label>
            <Switch
              checked={enabled}
              onCheckedChange={() => handleChannelToggle(channel as keyof NotificationPreferences['channels'])}
            />
          </div>
        ))}
      </div>

      {/* Language Selector */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">
          {t('profile.notifications.language.title')}
        </h4>
        <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Español</SelectItem>
            <SelectItem value="fr">Français</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Save Button */}
      <Button 
        onClick={handleSave} 
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            {t('common.saving')}
          </>
        ) : (
          t('common.save')
        )}
      </Button>
    </div>
  );
};
```

**Validation**:
- [ ] All 7 notification types have toggle switches
- [ ] All 3 channels have toggle switches
- [ ] Language selector displays 3 languages
- [ ] UI is responsive and accessible
- [ ] Form validation works correctly

#### Step 1.2.2: Integrate with Profile Page
**Location**: `frontend/src/pages/ProfilePage.tsx`

**Tasks**:
1. Add notification preferences tab
2. Integrate component
3. Handle save operations

**Implementation**:
```typescript
// Add to ProfilePage.tsx
const [activeTab, setActiveTab] = useState<'profile' | 'notifications'>('profile');
const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences | null>(null);
const [isLoading, setIsLoading] = useState(false);

const handleSaveNotificationPreferences = async (preferences: NotificationPreferences) => {
  setIsLoading(true);
  try {
    await updateUserProfile({ notificationPreferences: preferences });
    setNotificationPreferences(preferences);
    toast.success(t('profile.notifications.saved'));
  } catch (error) {
    toast.error(t('profile.notifications.saveError'));
  } finally {
    setIsLoading(false);
  }
};

// Add to JSX
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger value="profile">{t('profile.tabs.profile')}</TabsTrigger>
    <TabsTrigger value="notifications">{t('profile.tabs.notifications')}</TabsTrigger>
  </TabsList>
  
  <TabsContent value="profile">
    {/* Existing profile content */}
  </TabsContent>
  
  <TabsContent value="notifications">
    <NotificationPreferences
      preferences={notificationPreferences}
      onSave={handleSaveNotificationPreferences}
      isLoading={isLoading}
    />
  </TabsContent>
</Tabs>
```

**Validation**:
- [ ] Notification preferences tab visible
- [ ] Component integrates correctly
- [ ] Save operations work
- [ ] Error handling works

### Step 1.3: Quest Notification System

#### Step 1.3.1: Create Notification Service
**Location**: `frontend/src/lib/questNotifications.ts`

**Tasks**:
1. Create notification service
2. Implement notification triggers
3. Add localization support

**Implementation**:
```typescript
interface NotificationData {
  type: 'questStarted' | 'questCompleted' | 'questFailed' | 'questProgress' | 'questDeadline' | 'questStreak' | 'questChallenge';
  questId: string;
  questTitle: string;
  message: string;
  timestamp: Date;
}

class QuestNotificationService {
  private notifications: NotificationData[] = [];
  private listeners: ((notifications: NotificationData[]) => void)[] = [];

  addListener(listener: (notifications: NotificationData[]) => void) {
    this.listeners.push(listener);
  }

  removeListener(listener: (notifications: NotificationData[]) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications));
  }

  async triggerNotification(
    type: NotificationData['type'],
    questId: string,
    questTitle: string,
    userPreferences: NotificationPreferences
  ) {
    // Check if user has enabled this notification type
    if (!userPreferences[type]) {
      return;
    }

    // Check if user has enabled any channels
    const hasEnabledChannels = Object.values(userPreferences.channels).some(Boolean);
    if (!hasEnabledChannels) {
      return;
    }

    const message = this.getMessage(type, questTitle);
    const notification: NotificationData = {
      type,
      questId,
      questTitle,
      message,
      timestamp: new Date()
    };

    this.notifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.notifyListeners();

    // Send to enabled channels
    if (userPreferences.channels.inApp) {
      this.showInAppNotification(notification);
    }
    
    if (userPreferences.channels.email) {
      await this.sendEmailNotification(notification);
    }
    
    if (userPreferences.channels.push) {
      await this.sendPushNotification(notification);
    }
  }

  private getMessage(type: NotificationData['type'], questTitle: string): string {
    const messages = {
      questStarted: `Quest "${questTitle}" has started!`,
      questCompleted: `Quest "${questTitle}" completed! Great job!`,
      questFailed: `Quest "${questTitle}" failed. Don't give up!`,
      questProgress: `Quest "${questTitle}" progress updated!`,
      questDeadline: `Quest "${questTitle}" deadline approaching!`,
      questStreak: `Quest "${questTitle}" streak achieved!`,
      questChallenge: `Quest "${questTitle}" challenge updated!`
    };
    
    return messages[type];
  }

  private showInAppNotification(notification: NotificationData) {
    // Show toast notification
    toast.success(notification.message);
  }

  private async sendEmailNotification(notification: NotificationData) {
    // Implement email notification
    console.log('Email notification:', notification);
  }

  private async sendPushNotification(notification: NotificationData) {
    // Implement push notification
    console.log('Push notification:', notification);
  }

  getNotifications(): NotificationData[] {
    return this.notifications;
  }

  clearNotifications() {
    this.notifications = [];
    this.notifyListeners();
  }
}

export const questNotificationService = new QuestNotificationService();
```

**Validation**:
- [ ] Notification service created
- [ ] Notification triggers work
- [ ] User preferences respected
- [ ] Localization support added

#### Step 1.3.2: Integrate with Quest Operations
**Location**: `frontend/src/hooks/useQuestOperations.ts`

**Tasks**:
1. Integrate notification triggers
2. Add to quest operations
3. Handle user preferences

**Implementation**:
```typescript
// Add to useQuestOperations.ts
import { questNotificationService } from '../lib/questNotifications';
import { useUserProfile } from './useUserProfile';

export const useQuestOperations = () => {
  const { userProfile } = useUserProfile();
  const { t } = useTranslation();

  const createQuest = async (questData: CreateQuestPayload) => {
    try {
      const quest = await questService.createQuest(questData);
      
      // Trigger notification
      if (userProfile?.notificationPreferences) {
        await questNotificationService.triggerNotification(
          'questStarted',
          quest.id,
          quest.title,
          userProfile.notificationPreferences
        );
      }
      
      return quest;
    } catch (error) {
      throw error;
    }
  };

  const completeQuest = async (questId: string) => {
    try {
      const quest = await questService.completeQuest(questId);
      
      // Trigger notification
      if (userProfile?.notificationPreferences) {
        await questNotificationService.triggerNotification(
          'questCompleted',
          quest.id,
          quest.title,
          userProfile.notificationPreferences
        );
      }
      
      return quest;
    } catch (error) {
      throw error;
    }
  };

  const updateQuestProgress = async (questId: string, progress: number) => {
    try {
      const quest = await questService.updateQuestProgress(questId, progress);
      
      // Trigger notification for milestones
      if (userProfile?.notificationPreferences && progress > 0) {
        await questNotificationService.triggerNotification(
          'questProgress',
          quest.id,
          quest.title,
          userProfile.notificationPreferences
        );
      }
      
      return quest;
    } catch (error) {
      throw error;
    }
  };

  // ... other quest operations with notifications

  return {
    createQuest,
    completeQuest,
    updateQuestProgress,
    // ... other operations
  };
};
```

**Validation**:
- [ ] Notifications trigger on quest creation
- [ ] Notifications trigger on quest completion
- [ ] Notifications trigger on progress updates
- [ ] User preferences respected
- [ ] Error handling works

### Step 1.4: Integration & Testing

#### Step 1.4.1: Integrate with Periodic Refresh
**Location**: `frontend/src/hooks/useQuestRefresh.ts`

**Tasks**:
1. Integrate notifications with periodic refresh
2. Handle notification triggers
3. Update notification state

**Implementation**:
```typescript
// Add to useQuestRefresh.ts
import { questNotificationService } from '../lib/questNotifications';
import { useUserProfile } from './useUserProfile';

export const useQuestRefresh = () => {
  const { userProfile } = useUserProfile();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    // Add notification listener
    const handleNotifications = (newNotifications: NotificationData[]) => {
      setNotifications(newNotifications);
    };

    questNotificationService.addListener(handleNotifications);

    return () => {
      questNotificationService.removeListener(handleNotifications);
    };
  }, []);

  const refreshQuests = async () => {
    try {
      const updatedQuests = await questService.getQuests();
      
      // Check for quest status changes and trigger notifications
      if (userProfile?.notificationPreferences) {
        // Compare with previous quest state and trigger notifications
        // This would be implemented based on your specific quest state management
      }
      
      return updatedQuests;
    } catch (error) {
      throw error;
    }
  };

  return {
    refreshQuests,
    notifications
  };
};
```

**Validation**:
- [ ] Periodic refresh detects quest changes
- [ ] Notifications trigger on detected changes
- [ ] No duplicate notifications
- [ ] Performance not degraded

---

## Phase 2: Quest Templates & Sharing (6.3) - Step-by-Step Implementation

### Step 2.1: Backend Template Models

#### Step 2.1.1: Create Template Models
**Location**: `backend/services/quest-service/app/models/quest_template.py`

**Tasks**:
1. Create template data models
2. Add validation
3. Implement database operations

**Implementation**:
```python
# quest_template.py
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from enum import Enum

class QuestTemplatePrivacy(str, Enum):
    PUBLIC = "public"
    FOLLOWERS = "followers"
    PRIVATE = "private"

class QuestTemplateKind(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    CUSTOM = "custom"

class QuestTemplateCountScope(str, Enum):
    PER_DAY = "per_day"
    PER_WEEK = "per_week"
    PER_MONTH = "per_month"
    TOTAL = "total"

class QuestTemplateCreatePayload(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    category: str = Field(..., min_length=1, max_length=50)
    difficulty: str = Field(..., min_length=1, max_length=20)
    reward_xp: int = Field(..., ge=0, le=1000)
    tags: List[str] = Field(default_factory=list, max_items=10)
    privacy: QuestTemplatePrivacy = QuestTemplatePrivacy.PRIVATE
    kind: QuestTemplateKind = QuestTemplateKind.DAILY
    target_count: int = Field(..., ge=1, le=1000)
    count_scope: QuestTemplateCountScope = QuestTemplateCountScope.PER_DAY

    @validator('tags')
    def validate_tags(cls, v):
        if len(v) > 10:
            raise ValueError('Maximum 10 tags allowed')
        return v

class QuestTemplateResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    category: str
    difficulty: str
    reward_xp: int
    tags: List[str]
    privacy: QuestTemplatePrivacy
    kind: QuestTemplateKind
    target_count: int
    count_scope: QuestTemplateCountScope
    created_at: str
    updated_at: str
    created_by: str
    usage_count: int = 0

class QuestTemplateUpdatePayload(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    difficulty: Optional[str] = Field(None, min_length=1, max_length=20)
    reward_xp: Optional[int] = Field(None, ge=0, le=1000)
    tags: Optional[List[str]] = Field(None, max_items=10)
    privacy: Optional[QuestTemplatePrivacy] = None
    kind: Optional[QuestTemplateKind] = None
    target_count: Optional[int] = Field(None, ge=1, le=1000)
    count_scope: Optional[QuestTemplateCountScope] = None
```

**Validation**:
- [ ] All models defined correctly
- [ ] Validation rules implemented
- [ ] Privacy levels defined
- [ ] Required fields enforced

#### Step 2.1.2: Implement Database Operations
**Location**: `backend/services/quest-service/app/database/quest_template_db.py`

**Tasks**:
1. Create database operations
2. Implement CRUD functions
3. Add privacy enforcement

**Implementation**:
```python
# quest_template_db.py
import boto3
from botocore.exceptions import ClientError
from typing import Optional, List, Dict, Any
from datetime import datetime
import json

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('GoalsGuildTable')

async def create_template(
    template_data: QuestTemplateCreatePayload,
    user_id: str
) -> QuestTemplateResponse:
    template_id = f"TEMPLATE#{user_id}#{datetime.now().isoformat()}"
    
    item = {
        'PK': f"USER#{user_id}",
        'SK': template_id,
        'GSI1PK': f"TEMPLATE#{template_data.privacy.value}",
        'GSI1SK': f"{template_data.category}#{template_data.difficulty}#{datetime.now().isoformat()}",
        'template_id': template_id,
        'title': template_data.title,
        'description': template_data.description,
        'category': template_data.category,
        'difficulty': template_data.difficulty,
        'reward_xp': template_data.reward_xp,
        'tags': template_data.tags,
        'privacy': template_data.privacy.value,
        'kind': template_data.kind.value,
        'target_count': template_data.target_count,
        'count_scope': template_data.count_scope.value,
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'created_by': user_id,
        'usage_count': 0
    }
    
    try:
        table.put_item(Item=item)
        
        return QuestTemplateResponse(
            id=template_id,
            title=template_data.title,
            description=template_data.description,
            category=template_data.category,
            difficulty=template_data.difficulty,
            reward_xp=template_data.reward_xp,
            tags=template_data.tags,
            privacy=template_data.privacy,
            kind=template_data.kind,
            target_count=template_data.target_count,
            count_scope=template_data.count_scope,
            created_at=item['created_at'],
            updated_at=item['updated_at'],
            created_by=user_id,
            usage_count=0
        )
    except ClientError as e:
        raise Exception(f"Error creating template: {str(e)}")

async def get_template(
    template_id: str,
    user_id: str,
    requesting_user_id: Optional[str] = None
) -> Optional[QuestTemplateResponse]:
    try:
        response = table.get_item(
            Key={
                'PK': f"USER#{user_id}",
                'SK': template_id
            }
        )
        
        if 'Item' not in response:
            return None
            
        item = response['Item']
        
        # Check privacy
        if item['privacy'] == 'private' and requesting_user_id != user_id:
            return None
            
        if item['privacy'] == 'followers' and requesting_user_id != user_id:
            # Check if requesting user follows the template creator
            # This would need to be implemented based on your follower system
            pass
        
        return QuestTemplateResponse(
            id=item['template_id'],
            title=item['title'],
            description=item.get('description'),
            category=item['category'],
            difficulty=item['difficulty'],
            reward_xp=item['reward_xp'],
            tags=item.get('tags', []),
            privacy=QuestTemplatePrivacy(item['privacy']),
            kind=QuestTemplateKind(item['kind']),
            target_count=item['target_count'],
            count_scope=QuestTemplateCountScope(item['count_scope']),
            created_at=item['created_at'],
            updated_at=item['updated_at'],
            created_by=item['created_by'],
            usage_count=item.get('usage_count', 0)
        )
    except ClientError as e:
        raise Exception(f"Error getting template: {str(e)}")

async def update_template(
    template_id: str,
    user_id: str,
    update_data: QuestTemplateUpdatePayload
) -> Optional[QuestTemplateResponse]:
    try:
        # Get existing template
        existing_template = await get_template(template_id, user_id, user_id)
        if not existing_template:
            return None
        
        # Build update expression
        update_expression = "SET updated_at = :updated_at"
        expression_values = {":updated_at": datetime.now().isoformat()}
        
        if update_data.title is not None:
            update_expression += ", title = :title"
            expression_values[":title"] = update_data.title
            
        if update_data.description is not None:
            update_expression += ", description = :description"
            expression_values[":description"] = update_data.description
            
        # ... add other fields as needed
        
        table.update_item(
            Key={
                'PK': f"USER#{user_id}",
                'SK': template_id
            },
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values
        )
        
        # Return updated template
        return await get_template(template_id, user_id, user_id)
        
    except ClientError as e:
        raise Exception(f"Error updating template: {str(e)}")

async def delete_template(
    template_id: str,
    user_id: str
) -> bool:
    try:
        table.delete_item(
            Key={
                'PK': f"USER#{user_id}",
                'SK': template_id
            }
        )
        return True
    except ClientError as e:
        raise Exception(f"Error deleting template: {str(e)}")

async def get_user_templates(
    user_id: str,
    requesting_user_id: Optional[str] = None
) -> List[QuestTemplateResponse]:
    try:
        response = table.query(
            KeyConditionExpression='PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues={
                ':pk': f"USER#{user_id}",
                ':sk': 'TEMPLATE#'
            }
        )
        
        templates = []
        for item in response['Items']:
            # Check privacy
            if item['privacy'] == 'private' and requesting_user_id != user_id:
                continue
                
            if item['privacy'] == 'followers' and requesting_user_id != user_id:
                # Check follower relationship
                continue
            
            templates.append(QuestTemplateResponse(
                id=item['template_id'],
                title=item['title'],
                description=item.get('description'),
                category=item['category'],
                difficulty=item['difficulty'],
                reward_xp=item['reward_xp'],
                tags=item.get('tags', []),
                privacy=QuestTemplatePrivacy(item['privacy']),
                kind=QuestTemplateKind(item['kind']),
                target_count=item['target_count'],
                count_scope=QuestTemplateCountScope(item['count_scope']),
                created_at=item['created_at'],
                updated_at=item['updated_at'],
                created_by=item['created_by'],
                usage_count=item.get('usage_count', 0)
            ))
        
        return templates
        
    except ClientError as e:
        raise Exception(f"Error getting user templates: {str(e)}")
```

**Validation**:
- [ ] Template CRUD operations work
- [ ] Privacy enforcement works
- [ ] Database keys follow single-table design
- [ ] Error handling appropriate

### Step 2.2: Frontend Template Management

#### Step 2.2.1: Create Template Management Component
**Location**: `frontend/src/components/quests/templates/TemplateManagement.tsx`

**Tasks**:
1. Create template list component
2. Add template creation form
3. Implement template operations

**Implementation**:
```typescript
interface TemplateManagementProps {
  userId: string;
  isOwner: boolean;
}

export const TemplateManagement: React.FC<TemplateManagementProps> = ({
  userId,
  isOwner
}) => {
  const [templates, setTemplates] = useState<QuestTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuestTemplate | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    loadTemplates();
  }, [userId]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const userTemplates = await questTemplateService.getUserTemplates(userId);
      setTemplates(userTemplates);
    } catch (error) {
      toast.error(t('templates.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = async (templateData: QuestTemplateCreatePayload) => {
    try {
      const newTemplate = await questTemplateService.createTemplate(templateData);
      setTemplates(prev => [newTemplate, ...prev]);
      setShowCreateForm(false);
      toast.success(t('templates.created'));
    } catch (error) {
      toast.error(t('templates.createError'));
    }
  };

  const handleUpdateTemplate = async (templateId: string, updateData: QuestTemplateUpdatePayload) => {
    try {
      const updatedTemplate = await questTemplateService.updateTemplate(templateId, updateData);
      setTemplates(prev => prev.map(t => t.id === templateId ? updatedTemplate : t));
      setEditingTemplate(null);
      toast.success(t('templates.updated'));
    } catch (error) {
      toast.error(t('templates.updateError'));
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await questTemplateService.deleteTemplate(templateId);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      toast.success(t('templates.deleted'));
    } catch (error) {
      toast.error(t('templates.deleteError'));
    }
  };

  if (isLoading) {
    return <TemplateListSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {t('templates.title')}
        </h2>
        {isOwner && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('templates.create')}
          </Button>
        )}
      </div>

      {showCreateForm && (
        <TemplateCreateForm
          onSubmit={handleCreateTemplate}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editingTemplate && (
        <TemplateEditForm
          template={editingTemplate}
          onSubmit={(data) => handleUpdateTemplate(editingTemplate.id, data)}
          onCancel={() => setEditingTemplate(null)}
        />
      )}

      <div className="grid gap-4">
        {templates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            isOwner={isOwner}
            onEdit={() => setEditingTemplate(template)}
            onDelete={() => handleDeleteTemplate(template.id)}
            onUse={(template) => {
              // Navigate to quest creation with template
              navigate('/quests/create', { state: { template } });
            }}
          />
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">{t('templates.empty')}</p>
        </div>
      )}
    </div>
  );
};
```

**Validation**:
- [ ] Template list displays correctly
- [ ] Template creation works
- [ ] Template editing works
- [ ] Template deletion works
- [ ] Error handling works

#### Step 2.2.2: Create Template Card Component
**Location**: `frontend/src/components/quests/templates/TemplateCard.tsx`

**Tasks**:
1. Create template card UI
2. Add action buttons
3. Implement template operations

**Implementation**:
```typescript
interface TemplateCardProps {
  template: QuestTemplate;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onUse: (template: QuestTemplate) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isOwner,
  onEdit,
  onDelete,
  onUse
}) => {
  const { t } = useTranslation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {template.title}
          </h3>
          {template.description && (
            <p className="text-sm text-gray-600 mt-1">
              {template.description}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={template.privacy === 'public' ? 'default' : 'secondary'}>
            {t(`templates.privacy.${template.privacy}`)}
          </Badge>
          <Badge variant="outline">
            {t(`templates.difficulty.${template.difficulty}`)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <span className="text-sm font-medium text-gray-500">
            {t('templates.category')}
          </span>
          <p className="text-sm text-gray-900">{template.category}</p>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-500">
            {t('templates.reward')}
          </span>
          <p className="text-sm text-gray-900">{template.reward_xp} XP</p>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-500">
            {t('templates.target')}
          </span>
          <p className="text-sm text-gray-900">
            {template.target_count} {t(`templates.scope.${template.count_scope}`)}
          </p>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-500">
            {t('templates.usage')}
          </span>
          <p className="text-sm text-gray-900">{template.usage_count}</p>
        </div>
      </div>

      {template.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {template.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          {t('templates.created')}: {new Date(template.created_at).toLocaleDateString()}
        </div>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUse(template)}
          >
            {t('templates.use')}
          </Button>
          {isOwner && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={onEdit}
              >
                {t('templates.edit')}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                {t('templates.delete')}
              </Button>
            </>
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('templates.deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('templates.deleteConfirm.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
```

**Validation**:
- [ ] Template card displays correctly
- [ ] Action buttons work
- [ ] Delete confirmation dialog works
- [ ] Privacy badges display correctly

---

## Phase 3: Quest Analytics (6.4) - Step-by-Step Implementation

### Step 3.1: Backend Analytics Models

#### Step 3.1.1: Create Analytics Models
**Location**: `backend/services/quest-service/app/models/quest_analytics.py`

**Tasks**:
1. Create analytics data models
2. Add calculation functions
3. Implement caching

**Implementation**:
```python
# quest_analytics.py
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from enum import Enum

class AnalyticsPeriod(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    ALL_TIME = "allTime"

class QuestAnalytics(BaseModel):
    period: AnalyticsPeriod
    start_date: str
    end_date: str
    completion_rate: float = Field(..., ge=0, le=100)
    xp_earned: int = Field(..., ge=0)
    current_streak: int = Field(..., ge=0)
    best_streak: int = Field(..., ge=0)
    average_completion_time: float = Field(..., ge=0)
    trend_data: List[Dict[str, Any]] = Field(default_factory=list)
    category_performance: Dict[str, float] = Field(default_factory=dict)
    productivity_by_hour: Dict[str, int] = Field(default_factory=dict)
    created_at: str
    expires_at: str

class AnalyticsCalculationService:
    def __init__(self, quest_db_service):
        self.quest_db = quest_db_service
        self.cache_ttl = {
            AnalyticsPeriod.DAILY: 24 * 60 * 60,  # 24 hours
            AnalyticsPeriod.WEEKLY: 7 * 24 * 60 * 60,  # 7 days
            AnalyticsPeriod.MONTHLY: 30 * 24 * 60 * 60,  # 30 days
            AnalyticsPeriod.ALL_TIME: 30 * 24 * 60 * 60  # 30 days
        }

    async def calculate_analytics(
        self,
        user_id: str,
        period: AnalyticsPeriod,
        force_refresh: bool = False
    ) -> QuestAnalytics:
        # Check cache first
        if not force_refresh:
            cached_analytics = await self.get_cached_analytics(user_id, period)
            if cached_analytics:
                return cached_analytics

        # Calculate fresh analytics
        analytics = await self._calculate_fresh_analytics(user_id, period)
        
        # Cache the result
        await self.cache_analytics(user_id, period, analytics)
        
        return analytics

    async def _calculate_fresh_analytics(
        self,
        user_id: str,
        period: AnalyticsPeriod
    ) -> QuestAnalytics:
        # Get date range
        end_date = datetime.now()
        start_date = self._get_start_date(end_date, period)
        
        # Get quest data for the period
        quests = await self.quest_db.get_quests_by_date_range(
            user_id, start_date, end_date
        )
        
        # Calculate metrics
        completion_rate = self._calculate_completion_rate(quests)
        xp_earned = self._calculate_xp_earned(quests)
        current_streak = self._calculate_current_streak(quests)
        best_streak = self._calculate_best_streak(quests)
        average_completion_time = self._calculate_average_completion_time(quests)
        trend_data = self._calculate_trend_data(quests, period)
        category_performance = self._calculate_category_performance(quests)
        productivity_by_hour = self._calculate_productivity_by_hour(quests)
        
        return QuestAnalytics(
            period=period,
            start_date=start_date.isoformat(),
            end_date=end_date.isoformat(),
            completion_rate=completion_rate,
            xp_earned=xp_earned,
            current_streak=current_streak,
            best_streak=best_streak,
            average_completion_time=average_completion_time,
            trend_data=trend_data,
            category_performance=category_performance,
            productivity_by_hour=productivity_by_hour,
            created_at=datetime.now().isoformat(),
            expires_at=(datetime.now() + timedelta(seconds=self.cache_ttl[period])).isoformat()
        )

    def _calculate_completion_rate(self, quests: List[Dict]) -> float:
        if not quests:
            return 0.0
        
        completed = sum(1 for quest in quests if quest.get('status') == 'completed')
        return (completed / len(quests)) * 100

    def _calculate_xp_earned(self, quests: List[Dict]) -> int:
        return sum(quest.get('reward_xp', 0) for quest in quests if quest.get('status') == 'completed')

    def _calculate_current_streak(self, quests: List[Dict]) -> int:
        # Implementation for current streak calculation
        # This would depend on your specific streak logic
        return 0

    def _calculate_best_streak(self, quests: List[Dict]) -> int:
        # Implementation for best streak calculation
        # This would depend on your specific streak logic
        return 0

    def _calculate_average_completion_time(self, quests: List[Dict]) -> float:
        completed_quests = [q for q in quests if q.get('status') == 'completed']
        if not completed_quests:
            return 0.0
        
        total_time = sum(
            self._get_completion_time(quest) for quest in completed_quests
        )
        return total_time / len(completed_quests)

    def _calculate_trend_data(self, quests: List[Dict], period: AnalyticsPeriod) -> List[Dict[str, Any]]:
        # Implementation for trend data calculation
        # This would group quests by time periods and calculate metrics
        return []

    def _calculate_category_performance(self, quests: List[Dict]) -> Dict[str, float]:
        # Implementation for category performance calculation
        # This would group quests by category and calculate completion rates
        return {}

    def _calculate_productivity_by_hour(self, quests: List[Dict]) -> Dict[str, int]:
        # Implementation for productivity by hour calculation
        # This would group quest completions by hour of day
        return {}

    async def get_cached_analytics(self, user_id: str, period: AnalyticsPeriod) -> Optional[QuestAnalytics]:
        # Implementation for getting cached analytics
        # This would check DynamoDB for cached analytics
        return None

    async def cache_analytics(self, user_id: str, period: AnalyticsPeriod, analytics: QuestAnalytics):
        # Implementation for caching analytics
        # This would store analytics in DynamoDB with TTL
        pass
```

**Validation**:
- [ ] Analytics models defined correctly
- [ ] Calculation functions implemented
- [ ] Caching system works
- [ ] All metrics calculated correctly

### Step 3.2: Frontend Analytics Dashboard

#### Step 3.2.1: Create Analytics Dashboard Component
**Location**: `frontend/src/components/quests/analytics/AnalyticsDashboard.tsx`

**Tasks**:
1. Create analytics dashboard
2. Add period selector
3. Implement charts

**Implementation**:
```typescript
interface AnalyticsDashboardProps {
  userId: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ userId }) => {
  const [analytics, setAnalytics] = useState<QuestAnalytics | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>('weekly');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    loadAnalytics();
  }, [userId, selectedPeriod]);

  const loadAnalytics = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      const data = await questAnalyticsService.getAnalytics(userId, selectedPeriod, forceRefresh);
      setAnalytics(data);
    } catch (error) {
      toast.error(t('analytics.loadError'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handlePeriodChange = (period: AnalyticsPeriod) => {
    setSelectedPeriod(period);
  };

  const handleRefresh = () => {
    loadAnalytics(true);
  };

  if (isLoading) {
    return <AnalyticsDashboardSkeleton />;
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('analytics.noData')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {t('analytics.title')}
        </h2>
        <div className="flex items-center space-x-4">
          <PeriodSelector
            selectedPeriod={selectedPeriod}
            onPeriodChange={handlePeriodChange}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={t('analytics.completionRate')}
          value={`${analytics.completion_rate.toFixed(1)}%`}
          trend={analytics.trend_data}
          trendKey="completion_rate"
        />
        <MetricCard
          title={t('analytics.xpEarned')}
          value={analytics.xp_earned.toString()}
          trend={analytics.trend_data}
          trendKey="xp_earned"
        />
        <MetricCard
          title={t('analytics.currentStreak')}
          value={analytics.current_streak.toString()}
          trend={analytics.trend_data}
          trendKey="current_streak"
        />
        <MetricCard
          title={t('analytics.bestStreak')}
          value={analytics.best_streak.toString()}
          trend={analytics.trend_data}
          trendKey="best_streak"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart
          title={t('analytics.completionRateTrend')}
          data={analytics.trend_data}
          dataKey="completion_rate"
          color="#3b82f6"
        />
        <TrendChart
          title={t('analytics.xpEarnedTrend')}
          data={analytics.trend_data}
          dataKey="xp_earned"
          color="#10b981"
        />
        <CategoryPerformanceChart
          title={t('analytics.categoryPerformance')}
          data={analytics.category_performance}
        />
        <ProductivityHeatmap
          title={t('analytics.productivityByHour')}
          data={analytics.productivity_by_hour}
        />
      </div>
    </div>
  );
};
```

**Validation**:
- [ ] Analytics dashboard displays correctly
- [ ] Period selector works
- [ ] Charts render correctly
- [ ] Refresh functionality works
- [ ] Loading states work

#### Step 3.2.2: Create Trend Chart Component
**Location**: `frontend/src/components/quests/analytics/TrendChart.tsx`

**Tasks**:
1. Create trend chart component
2. Add chart library integration
3. Implement responsive design

**Implementation**:
```typescript
interface TrendChartProps {
  title: string;
  data: Array<{
    date: string;
    [key: string]: any;
  }>;
  dataKey: string;
  color: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  title,
  data,
  dataKey,
  color
}) => {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      formattedDate: new Date(item.date).toLocaleDateString()
    }));
  }, [data]);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {title}
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="formattedDate"
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px'
              }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
```

**Validation**:
- [ ] Chart renders correctly
- [ ] Data displays properly
- [ ] Responsive design works
- [ ] Tooltips work
- [ ] Colors applied correctly

---

## Integration Steps

### Step 4.1: Cross-Feature Integration

#### Step 4.1.1: Integrate Notifications with Templates
**Location**: `frontend/src/hooks/useQuestTemplates.ts`

**Tasks**:
1. Add notification triggers to template operations
2. Integrate with notification service
3. Handle user preferences

**Implementation**:
```typescript
export const useQuestTemplates = () => {
  const { userProfile } = useUserProfile();
  const { t } = useTranslation();

  const createTemplate = async (templateData: QuestTemplateCreatePayload) => {
    try {
      const template = await questTemplateService.createTemplate(templateData);
      
      // Trigger notification
      if (userProfile?.notificationPreferences) {
        await questNotificationService.triggerNotification(
          'questTemplate',
          template.id,
          template.title,
          userProfile.notificationPreferences
        );
      }
      
      return template;
    } catch (error) {
      throw error;
    }
  };

  const useTemplate = async (templateId: string) => {
    try {
      const template = await questTemplateService.getTemplate(templateId);
      
      // Trigger notification
      if (userProfile?.notificationPreferences) {
        await questNotificationService.triggerNotification(
          'questTemplateUsed',
          template.id,
          template.title,
          userProfile.notificationPreferences
        );
      }
      
      return template;
    } catch (error) {
      throw error;
    }
  };

  // ... other template operations with notifications
};
```

**Validation**:
- [ ] Template operations trigger notifications
- [ ] Notifications respect user preferences
- [ ] Error handling works

#### Step 4.1.2: Integrate Analytics with Notifications
**Location**: `frontend/src/hooks/useQuestAnalytics.ts`

**Tasks**:
1. Add notification triggers to analytics updates
2. Integrate with notification service
3. Handle user preferences

**Implementation**:
```typescript
export const useQuestAnalytics = () => {
  const { userProfile } = useUserProfile();
  const { t } = useTranslation();

  const updateAnalytics = async (userId: string, period: AnalyticsPeriod) => {
    try {
      const analytics = await questAnalyticsService.getAnalytics(userId, period, true);
      
      // Trigger notification for significant changes
      if (userProfile?.notificationPreferences && analytics) {
        await questNotificationService.triggerNotification(
          'questAnalytics',
          'analytics',
          'Analytics Updated',
          userProfile.notificationPreferences
        );
      }
      
      return analytics;
    } catch (error) {
      throw error;
    }
  };

  // ... other analytics operations with notifications
};
```

**Validation**:
- [ ] Analytics updates trigger notifications
- [ ] Notifications respect user preferences
- [ ] Error handling works

### Step 4.2: End-to-End Integration

#### Step 4.2.1: Update Quest Dashboard
**Location**: `frontend/src/pages/QuestDashboard.tsx`

**Tasks**:
1. Add analytics section
2. Add templates section
3. Integrate all features

**Implementation**:
```typescript
export const QuestDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'quests' | 'templates' | 'analytics'>('quests');
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quests">{t('dashboard.tabs.quests')}</TabsTrigger>
          <TabsTrigger value="templates">{t('dashboard.tabs.templates')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('dashboard.tabs.analytics')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="quests">
          <QuestList />
        </TabsContent>
        
        <TabsContent value="templates">
          <TemplateManagement userId={currentUser.id} isOwner={true} />
        </TabsContent>
        
        <TabsContent value="analytics">
          <AnalyticsDashboard userId={currentUser.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

**Validation**:
- [ ] All tabs work correctly
- [ ] Features integrate seamlessly
- [ ] Navigation works
- [ ] State management works

---

## Testing Steps

### Step 5.1: Unit Testing

#### Step 5.1.1: Test Notification Service
**Location**: `frontend/src/lib/__tests__/questNotifications.test.ts`

**Tasks**:
1. Test notification triggers
2. Test user preferences
3. Test error handling

**Implementation**:
```typescript
describe('QuestNotificationService', () => {
  let service: QuestNotificationService;
  let mockUserPreferences: NotificationPreferences;

  beforeEach(() => {
    service = new QuestNotificationService();
    mockUserPreferences = {
      questStarted: true,
      questCompleted: true,
      questFailed: false,
      questProgress: true,
      questDeadline: true,
      questStreak: false,
      questChallenge: true,
      channels: {
        inApp: true,
        email: false,
        push: false
      }
    };
  });

  it('should trigger notification when user preferences allow', async () => {
    const mockListener = jest.fn();
    service.addListener(mockListener);

    await service.triggerNotification(
      'questStarted',
      'quest-1',
      'Test Quest',
      mockUserPreferences
    );

    expect(mockListener).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'questStarted',
          questId: 'quest-1',
          questTitle: 'Test Quest'
        })
      ])
    );
  });

  it('should not trigger notification when user preferences disabled', async () => {
    const mockListener = jest.fn();
    service.addListener(mockListener);

    await service.triggerNotification(
      'questFailed',
      'quest-1',
      'Test Quest',
      mockUserPreferences
    );

    expect(mockListener).not.toHaveBeenCalled();
  });

  // ... more tests
});
```

**Validation**:
- [ ] All notification tests pass
- [ ] User preferences respected
- [ ] Error handling works
- [ ] Coverage > 90%

#### Step 5.1.2: Test Template Service
**Location**: `frontend/src/lib/__tests__/questTemplates.test.ts`

**Tasks**:
1. Test template CRUD operations
2. Test privacy enforcement
3. Test error handling

**Implementation**:
```typescript
describe('QuestTemplateService', () => {
  let service: QuestTemplateService;
  let mockTemplate: QuestTemplateCreatePayload;

  beforeEach(() => {
    service = new QuestTemplateService();
    mockTemplate = {
      title: 'Test Template',
      description: 'Test Description',
      category: 'test',
      difficulty: 'easy',
      reward_xp: 100,
      tags: ['test'],
      privacy: 'public',
      kind: 'daily',
      target_count: 1,
      count_scope: 'per_day'
    };
  });

  it('should create template successfully', async () => {
    const result = await service.createTemplate(mockTemplate);
    
    expect(result).toEqual(
      expect.objectContaining({
        title: 'Test Template',
        description: 'Test Description',
        category: 'test',
        difficulty: 'easy',
        reward_xp: 100,
        tags: ['test'],
        privacy: 'public',
        kind: 'daily',
        target_count: 1,
        count_scope: 'per_day'
      })
    );
  });

  it('should enforce privacy restrictions', async () => {
    const privateTemplate = { ...mockTemplate, privacy: 'private' };
    const result = await service.createTemplate(privateTemplate);
    
    expect(result.privacy).toBe('private');
  });

  // ... more tests
});
```

**Validation**:
- [ ] All template tests pass
- [ ] Privacy enforcement works
- [ ] Error handling works
- [ ] Coverage > 90%

### Step 5.2: Integration Testing

#### Step 5.2.1: Test Cross-Feature Integration
**Location**: `frontend/src/__tests__/integration/questFeatures.test.ts`

**Tasks**:
1. Test notifications with templates
2. Test analytics with notifications
3. Test complete user flows

**Implementation**:
```typescript
describe('Quest Features Integration', () => {
  let mockUser: User;
  let mockPreferences: NotificationPreferences;

  beforeEach(() => {
    mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User'
    };
    
    mockPreferences = {
      questStarted: true,
      questCompleted: true,
      questFailed: false,
      questProgress: true,
      questDeadline: true,
      questStreak: false,
      questChallenge: true,
      channels: {
        inApp: true,
        email: false,
        push: false
      }
    };
  });

  it('should trigger notifications when using templates', async () => {
    // Create template
    const template = await questTemplateService.createTemplate({
      title: 'Test Template',
      category: 'test',
      difficulty: 'easy',
      reward_xp: 100,
      privacy: 'public',
      kind: 'daily',
      target_count: 1,
      count_scope: 'per_day'
    });

    // Use template to create quest
    const quest = await questService.createQuestFromTemplate(template.id);

    // Verify notification triggered
    expect(questNotificationService.getNotifications()).toContainEqual(
      expect.objectContaining({
        type: 'questStarted',
        questId: quest.id,
        questTitle: quest.title
      })
    );
  });

  it('should update analytics when quest completed', async () => {
    // Create and complete quest
    const quest = await questService.createQuest({
      title: 'Test Quest',
      category: 'test',
      difficulty: 'easy',
      reward_xp: 100
    });
    
    await questService.completeQuest(quest.id);

    // Verify analytics updated
    const analytics = await questAnalyticsService.getAnalytics('user-1', 'weekly');
    expect(analytics.completion_rate).toBeGreaterThan(0);
    expect(analytics.xp_earned).toBeGreaterThan(0);
  });

  // ... more integration tests
});
```

**Validation**:
- [ ] All integration tests pass
- [ ] Features work together
- [ ] User flows complete
- [ ] Error handling works

### Step 5.3: End-to-End Testing

#### Step 5.3.1: Test Complete User Journey
**Location**: `frontend/src/__tests__/e2e/questJourney.test.ts`

**Tasks**:
1. Test complete quest management journey
2. Test template usage journey
3. Test analytics viewing journey

**Implementation**:
```typescript
describe('Quest Management Journey', () => {
  beforeEach(async () => {
    // Setup test user and data
    await setupTestUser();
    await setupTestData();
  });

  it('should complete full quest management journey', async () => {
    // 1. Navigate to quest dashboard
    await page.goto('/quests');
    await expect(page.locator('[data-testid="quest-dashboard"]')).toBeVisible();

    // 2. Create quest from template
    await page.click('[data-testid="create-quest-button"]');
    await page.click('[data-testid="use-template-button"]');
    await page.click('[data-testid="template-card"]:first-child');
    await page.fill('[data-testid="quest-title"]', 'My Test Quest');
    await page.click('[data-testid="create-quest-submit"]');

    // 3. Verify quest created and notification appears
    await expect(page.locator('[data-testid="quest-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="notification"]')).toContainText('Quest "My Test Quest" has started!');

    // 4. Complete quest
    await page.click('[data-testid="quest-card"] [data-testid="complete-button"]');
    await expect(page.locator('[data-testid="notification"]')).toContainText('Quest "My Test Quest" completed!');

    // 5. View analytics
    await page.click('[data-testid="analytics-tab"]');
    await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="completion-rate"]')).toContainText('100%');

    // 6. Create template from completed quest
    await page.click('[data-testid="quests-tab"]');
    await page.click('[data-testid="quest-card"] [data-testid="save-as-template-button"]');
    await page.fill('[data-testid="template-title"]', 'My Test Template');
    await page.selectOption('[data-testid="template-privacy"]', 'public');
    await page.click('[data-testid="save-template-submit"]');

    // 7. Verify template created
    await page.click('[data-testid="templates-tab"]');
    await expect(page.locator('[data-testid="template-card"]')).toContainText('My Test Template');
  });
});
```

**Validation**:
- [ ] Complete journey works
- [ ] All features integrate
- [ ] Notifications work
- [ ] Analytics update
- [ ] Templates work

---

## Deployment Steps

### Step 6.1: Backend Deployment

#### Step 6.1.1: Deploy User Service Updates
**Location**: `backend/services/user-service/`

**Tasks**:
1. Deploy notification preferences models
2. Update profile endpoints
3. Test API functionality

**Commands**:
```bash
cd backend/services/user-service
npm run build
npm run deploy
```

**Validation**:
- [ ] API endpoints work
- [ ] Models validate correctly
- [ ] Database operations work
- [ ] Error handling works

#### Step 6.1.2: Deploy Quest Service Updates
**Location**: `backend/services/quest-service/`

**Tasks**:
1. Deploy template models
2. Deploy analytics models
3. Update quest endpoints

**Commands**:
```bash
cd backend/services/quest-service
npm run build
npm run deploy
```

**Validation**:
- [ ] Template endpoints work
- [ ] Analytics endpoints work
- [ ] Database operations work
- [ ] Error handling works

### Step 6.2: Frontend Deployment

#### Step 6.2.1: Deploy Frontend Updates
**Location**: `frontend/`

**Tasks**:
1. Build frontend with new features
2. Deploy to staging
3. Test functionality

**Commands**:
```bash
cd frontend
npm run build
npm run deploy:staging
```

**Validation**:
- [ ] Frontend builds successfully
- [ ] All features work
- [ ] Performance acceptable
- [ ] No console errors

#### Step 6.2.2: Deploy to Production
**Location**: `frontend/`

**Tasks**:
1. Deploy to production
2. Monitor performance
3. Handle any issues

**Commands**:
```bash
cd frontend
npm run build
npm run deploy:production
```

**Validation**:
- [ ] Production deployment successful
- [ ] All features work
- [ ] Performance acceptable
- [ ] No errors

---

## Monitoring & Maintenance

### Step 7.1: Set Up Monitoring

#### Step 7.1.1: Configure Error Tracking
**Location**: `frontend/src/lib/monitoring.ts`

**Tasks**:
1. Set up error tracking
2. Configure performance monitoring
3. Set up alerts

**Implementation**:
```typescript
// monitoring.ts
export const setupMonitoring = () => {
  // Error tracking
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Send to error tracking service
  });

  // Performance monitoring
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0];
    console.log('Page load time:', navigation.loadEventEnd - navigation.loadEventStart);
    // Send to performance monitoring service
  });
};
```

**Validation**:
- [ ] Error tracking works
- [ ] Performance monitoring works
- [ ] Alerts configured
- [ ] Data collected

#### Step 7.1.2: Set Up Analytics Monitoring
**Location**: `backend/services/quest-service/app/monitoring/`

**Tasks**:
1. Set up analytics monitoring
2. Configure performance tracking
3. Set up alerts

**Implementation**:
```python
# monitoring.py
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class AnalyticsMonitor:
    def __init__(self):
        self.metrics = {}
    
    def track_analytics_calculation(self, user_id: str, period: str, duration: float):
        logger.info(f"Analytics calculation for user {user_id}, period {period}, duration {duration}s")
        # Send to monitoring service
    
    def track_template_creation(self, user_id: str, template_id: str):
        logger.info(f"Template created: {template_id} by user {user_id}")
        # Send to monitoring service
    
    def track_notification_sent(self, user_id: str, notification_type: str):
        logger.info(f"Notification sent: {notification_type} to user {user_id}")
        # Send to monitoring service
```

**Validation**:
- [ ] Analytics monitoring works
- [ ] Performance tracking works
- [ ] Alerts configured
- [ ] Data collected

### Step 7.2: Maintenance Tasks

#### Step 7.2.1: Set Up Regular Maintenance
**Location**: `scripts/maintenance/`

**Tasks**:
1. Create maintenance scripts
2. Set up scheduled tasks
3. Configure cleanup procedures

**Implementation**:
```bash
#!/bin/bash
# cleanup_old_analytics.sh

# Clean up old analytics data
aws dynamodb scan \
  --table-name GoalsGuildTable \
  --filter-expression "attribute_exists(expires_at) AND expires_at < :now" \
  --expression-attribute-values '{":now":{"S":"'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"}}' \
  --projection-expression "PK,SK" \
  --output json | \
  jq -r '.Items[] | "\(.PK.S) \(.SK.S)"' | \
  while read pk sk; do
    aws dynamodb delete-item \
      --table-name GoalsGuildTable \
      --key "{\"PK\":{\"S\":\"$pk\"},\"SK\":{\"S\":\"$sk\"}}"
  done
```

**Validation**:
- [ ] Maintenance scripts work
- [ ] Scheduled tasks run
- [ ] Cleanup procedures work
- [ ] No data loss

---

## Conclusion

This step-by-step implementation guide provides a comprehensive roadmap for implementing Quest Advanced Features (6.2-6.4). Each step includes:

1. **Specific Tasks**: Clear, actionable tasks for each step
2. **Code Examples**: Detailed code implementations
3. **Validation Criteria**: Clear success criteria
4. **Testing Steps**: Comprehensive testing approach
5. **Deployment Steps**: Production deployment guidance
6. **Monitoring & Maintenance**: Ongoing maintenance procedures

The guide follows the test scenarios and ensures that all features are implemented correctly, tested thoroughly, and deployed safely. Each step builds upon the previous ones, creating a solid foundation for the advanced quest features.

Remember to:
- Follow each step in order
- Validate each step before proceeding
- Test thoroughly at each stage
- Monitor performance and errors
- Maintain documentation
- Keep backups of important data

This implementation will result in a robust, scalable, and user-friendly quest management system with advanced features for notifications, templates, and analytics.
