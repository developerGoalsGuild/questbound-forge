# Quest API Postman Testing Guide

This guide explains how to use the Quest API Postman collection to test all Quest endpoints comprehensively.

## 📋 **Collection Overview**

The Quest API Tests collection includes:
- **Authentication Tests** - JWT token setup
- **Quest Creation Tests** - Various quest creation scenarios
- **Quest Retrieval Tests** - Get quest by ID and list quests
- **Quest Status Management Tests** - Start, cancel, fail quests
- **Quest Update Tests** - Update quest properties
- **Quest Deletion Tests** - Delete quests
- **Security Tests** - XSS, SQL injection, authentication
- **Performance Tests** - Response time validation

## 🚀 **Setup Instructions**

### 1. **Import the Collection**
1. Open Postman
2. Click "Import" button
3. Select `Quest_API_Tests.postman_collection.json`
4. The collection will be imported with all test cases

### 2. **Configure Environment Variables**
Create a new environment in Postman with these variables:

```json
{
  "base_url": "http://localhost:8000",
  "auth_url": "https://your-auth-provider.com",
  "jwt_token": "",
  "quest_id": "",
  "quantitative_quest_id": ""
}
```

### 3. **Start the Quest Service**
```bash
cd backend/services/quest-service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## 🧪 **Running the Tests**

### **Option 1: Run Individual Tests**
1. Select the Quest API Tests collection
2. Choose a specific test folder (e.g., "Quest Creation Tests")
3. Click "Send" to run individual requests
4. Check the "Test Results" tab for validation results

### **Option 2: Run Collection Runner**
1. Click the "..." menu next to the collection
2. Select "Run collection"
3. Choose which tests to run
4. Click "Run Quest API Tests"
5. Review the test results summary

### **Option 3: Run All Tests in Sequence**
1. Select the collection root
2. Click "Run" button
3. All tests will run in sequence
4. Review the comprehensive test report

## 📊 **Test Categories Explained**

### **1. Authentication Tests**
- **Get JWT Token**: Obtains authentication token
- **Purpose**: Sets up authentication for all other tests
- **Expected**: 200 status, token saved to environment

### **2. Quest Creation Tests**
- **Create Linked Quest**: Tests basic quest creation
- **Create Quantitative Quest**: Tests quantitative quest creation
- **Validation Errors**: Tests input validation
- **Authentication Required**: Tests security

**Test Data Examples:**
```json
// Linked Quest
{
  "title": "Test Linked Quest",
  "category": "Health",
  "difficulty": "medium",
  "kind": "linked"
}

// Quantitative Quest
{
  "title": "Test Quantitative Quest",
  "category": "Work",
  "kind": "quantitative",
  "targetCount": 10,
  "countScope": "any",
  "startAt": 1704067200000,
  "periodSeconds": 86400
}
```

### **3. Quest Retrieval Tests**
- **Get Quest by ID**: Retrieves specific quest
- **Not Found**: Tests error handling
- **List User Quests**: Gets all user's quests

### **4. Quest Status Management Tests**
- **Start Quest**: Changes status from draft to active
- **Cancel Quest**: Changes status to cancelled
- **Fail Quest**: Changes status to failed
- **Invalid Transitions**: Tests error scenarios

### **5. Quest Update Tests**
- **Update Quest**: Modifies quest properties
- **Not Found**: Tests error handling
- **Validation**: Tests update validation

### **6. Quest Deletion Tests**
- **Delete Draft Quest**: Removes draft quests
- **Not Found**: Tests error handling
- **Authentication**: Tests security

### **7. Security Tests**
- **XSS Prevention**: Tests cross-site scripting protection
- **SQL Injection**: Tests database injection protection
- **Invalid JWT**: Tests authentication security

### **8. Performance Tests**
- **Response Time**: Validates performance benchmarks
- **Multiple Requests**: Tests concurrent operations

## 🔧 **Environment Configuration**

### **Local Development**
```json
{
  "base_url": "http://localhost:8000",
  "auth_url": "http://localhost:3000/auth",
  "jwt_token": "",
  "quest_id": "",
  "quantitative_quest_id": ""
}
```

### **Staging Environment**
```json
{
  "base_url": "https://staging-api.goalsguild.com",
  "auth_url": "https://staging-auth.goalsguild.com",
  "jwt_token": "",
  "quest_id": "",
  "quantitative_quest_id": ""
}
```

### **Production Environment**
```json
{
  "base_url": "https://api.goalsguild.com",
  "auth_url": "https://auth.goalsguild.com",
  "jwt_token": "",
  "quest_id": "",
  "quantitative_quest_id": ""
}
```

## 📈 **Test Validation**

### **Automatic Validations**
Each test includes automatic validations:

1. **Status Code Validation**
   ```javascript
   pm.test('Status code is 201', function () {
       pm.response.to.have.status(201);
   });
   ```

2. **Response Structure Validation**
   ```javascript
   pm.test('Response has quest ID', function () {
       const response = pm.response.json();
       pm.expect(response).to.have.property('id');
   });
   ```

3. **Data Validation**
   ```javascript
   pm.test('Quest status is active', function () {
       const response = pm.response.json();
       pm.expect(response).to.have.property('status', 'active');
   });
   ```

4. **Performance Validation**
   ```javascript
   pm.test('Response time is acceptable', function () {
       pm.expect(pm.response.responseTime).to.be.below(5000);
   });
   ```

### **Manual Validations**
Review these aspects manually:

1. **Database State**: Check DynamoDB for created/updated records
2. **Logs**: Review application logs for errors
3. **Authentication**: Verify JWT token validity
4. **Data Integrity**: Ensure data consistency

## 🐛 **Troubleshooting**

### **Common Issues**

#### **1. Authentication Errors (401)**
- **Problem**: JWT token is invalid or expired
- **Solution**: 
  - Update the `jwt_token` environment variable
  - Check if the auth service is running
  - Verify token format and expiration

#### **2. Connection Errors**
- **Problem**: Cannot connect to the API
- **Solution**:
  - Verify the `base_url` is correct
  - Ensure the Quest service is running
  - Check network connectivity

#### **3. Validation Errors (400/422)**
- **Problem**: Request data is invalid
- **Solution**:
  - Check request body format
  - Verify required fields are present
  - Validate data types and constraints

#### **4. Not Found Errors (404)**
- **Problem**: Quest ID doesn't exist
- **Solution**:
  - Ensure quest was created successfully
  - Check if quest ID is correct
  - Verify quest belongs to the authenticated user

### **Debug Steps**

1. **Check Service Status**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Verify Database Connection**
   ```bash
   # Check DynamoDB table exists
   aws dynamodb describe-table --table-name gg_core
   ```

3. **Test Authentication**
   ```bash
   curl -X POST "http://localhost:8000/quests/createQuest" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"title": "Test", "category": "Health"}'
   ```

4. **Review Logs**
   ```bash
   # Check application logs
   tail -f logs/quest-service.log
   ```

## 📊 **Test Results Interpretation**

### **Success Indicators**
- ✅ All tests pass (green checkmarks)
- ✅ Response times under 5 seconds
- ✅ No authentication errors
- ✅ Data validation successful

### **Warning Indicators**
- ⚠️ Some tests fail intermittently
- ⚠️ Response times above 3 seconds
- ⚠️ Validation errors for edge cases

### **Failure Indicators**
- ❌ Multiple test failures
- ❌ Authentication errors
- ❌ Database connection issues
- ❌ Response times above 10 seconds

## 🔄 **Continuous Testing**

### **Pre-commit Testing**
```bash
# Run Postman collection via Newman
newman run Quest_API_Tests.postman_collection.json \
  --environment local.postman_environment.json \
  --reporters cli,json
```

### **CI/CD Integration**
```yaml
# GitHub Actions example
- name: Run Quest API Tests
  run: |
    newman run Quest_API_Tests.postman_collection.json \
      --environment ${{ secrets.POSTMAN_ENV }} \
      --reporters cli,junit
```

### **Scheduled Testing**
- Set up automated runs every hour
- Monitor test results and alerts
- Track performance trends over time

## 📚 **Additional Resources**

- [Postman Documentation](https://learning.postman.com/)
- [Newman CLI Runner](https://github.com/postmanlabs/newman)
- [API Testing Best Practices](https://blog.postman.com/api-testing-best-practices/)
- [Quest API Documentation](../README.md)

## 🎯 **Next Steps After Testing**

1. **Fix Any Issues**: Address failed tests and validation errors
2. **Performance Optimization**: Optimize slow endpoints
3. **Security Hardening**: Address security test failures
4. **Documentation Update**: Update API docs based on test results
5. **Production Deployment**: Deploy to production after all tests pass

---

**Note**: This collection is designed to test the Quest API comprehensively. Run tests regularly to ensure API reliability and catch regressions early.
