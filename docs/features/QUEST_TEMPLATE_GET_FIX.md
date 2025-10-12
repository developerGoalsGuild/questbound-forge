# Quest Template Get Operation Fix

## Problem
The quest template get operation (`/quests/templates/{template_id}`) was returning 404 Not Found even though:
- The list operation (`/quests/templates`) worked correctly and returned 3 templates
- The user had manually added 3 templates to the database
- The database contained the expected data

## Root Cause
The get operation was using the **wrong query approach**:

**❌ Wrong Approach (Get Operation):**
- Used `table.scan()` on the main table
- Scanned for `type = "QuestTemplate"` and `id = template_id`
- Found 0 items because templates are stored with GSI1 pattern

**✅ Correct Approach (List Operation):**
- Used `table.query()` on GSI1 index
- Queried by `GSI1PK = USER#{user_id}` and `GSI1SK begins_with "TEMPLATE#"`
- Found 3 templates successfully

## The Fix
Changed the get operation to use the **same query approach** as the list operation:

### Before (Broken):
```python
# Used scan operation
response = _ddb_call(
    table.scan,
    op="quest_template.scan_by_id",
    FilterExpression=Attr("type").eq("QuestTemplate") & Attr("id").eq(template_id),
    Limit=1
)
```

### After (Fixed):
```python
# Use query operation like list operation
response = _ddb_call(
    table.query,
    op="quest_template.get_by_user_query",
    IndexName="GSI1",
    KeyConditionExpression=Key("GSI1PK").eq(f"USER#{user_id}") & Key("GSI1SK").begins_with("TEMPLATE#"),
    ScanIndexForward=False,
    Limit=50
)

# Filter by template ID
matching_items = [item for item in items if item.get("id") == template_id]
```

## Key Changes

1. **Query Instead of Scan**: Uses `table.query()` on GSI1 index instead of `table.scan()` on main table
2. **Same Pattern as List**: Uses identical query pattern as the working list operation
3. **Filter by Template ID**: Filters query results to find the specific template ID
4. **Enhanced Logging**: Added detailed logging to show query results and available template IDs

## Expected Results

- ✅ **Get operation should work** - Will find templates using the same approach as list operation
- ✅ **Consistent behavior** - Both list and get operations use the same underlying query method
- ✅ **Better performance** - Query is more efficient than scan operation
- ✅ **Proper error handling** - Clear logging shows available template IDs when template not found

## Files Modified

- `backend/services/quest-service/app/db/quest_template_db.py`
  - Replaced scan operation with query operation
  - Added template ID filtering logic
  - Enhanced logging for debugging

## Status

✅ **Fix Implemented** - Ready to test the quest template get operation

