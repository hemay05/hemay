# Google OAuth Testing Checklist

## Pre-Testing Setup
- [ ] Google Cloud Console project created
- [ ] OAuth 2.0 credentials configured
- [ ] Client ID copied to environment.ts
- [ ] Database migration run (google_id column added)
- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 4200

## Frontend Tests

### Sign-In Page
- [ ] Navigate to http://localhost:4200/authentication/signin
- [ ] Verify "Sign in with Google" button is visible
- [ ] Verify button has proper styling
- [ ] Verify "OR" divider is displayed correctly

### Google Sign-In Flow
- [ ] Click "Sign in with Google" button
- [ ] Verify Google OAuth popup appears
- [ ] Select a Google account
- [ ] Verify popup closes after selection
- [ ] Verify loading state is shown
- [ ] Verify redirect to dashboard after successful sign-in

### Error Handling
- [ ] Test with invalid Client ID (should show error)
- [ ] Test with network disconnected (should show error message)
- [ ] Verify error messages are user-friendly

## Backend Tests

### API Endpoint
- [ ] POST /api/auth/google-signin endpoint exists
- [ ] Endpoint accepts credential in request body
- [ ] Endpoint returns success response with token
- [ ] Endpoint returns user data without password

### Database Operations
- [ ] New user created when signing in with new Google account
- [ ] User record includes google_id
- [ ] User record includes profile_image from Google
- [ ] User record includes name from Google
- [ ] Existing user updated when signing in with known email

### Security
- [ ] Google JWT credential is validated
- [ ] Application JWT token is generated
- [ ] Password is hashed (using Google ID)
- [ ] google_id is unique in database

## Integration Tests

### New User Registration via Google
1. [ ] Sign in with Google account (first time)
2. [ ] Verify user created in database
3. [ ] Verify google_id is stored
4. [ ] Verify profile_image is stored
5. [ ] Verify user role is 'user'
6. [ ] Verify user_type is 'customer'
7. [ ] Verify JWT token is returned
8. [ ] Verify redirect to appropriate dashboard

### Existing User Sign-In via Google
1. [ ] Create user with email manually
2. [ ] Sign in with same email via Google
3. [ ] Verify google_id is added to existing user
4. [ ] Verify profile_image is updated
5. [ ] Verify no duplicate user created
6. [ ] Verify JWT token is returned

### Multiple Sign-Ins
1. [ ] Sign in with Google
2. [ ] Sign out
3. [ ] Sign in with Google again
4. [ ] Verify successful sign-in
5. [ ] Verify no errors

## Browser Compatibility
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge
- [ ] Test on mobile browsers

## Console Checks

### Frontend Console
- [ ] No JavaScript errors
- [ ] No 404 errors for Google script
- [ ] No CORS errors
- [ ] Proper API calls logged

### Backend Console
- [ ] No server errors
- [ ] Successful database queries logged
- [ ] JWT generation logged
- [ ] No SQL errors

## Database Verification

### After New User Sign-In
```sql
SELECT id, name, email, google_id, profile_image, user_type, role 
FROM users 
WHERE email = 'test@gmail.com';
```
- [ ] Record exists
- [ ] google_id is populated
- [ ] profile_image URL is valid
- [ ] user_type is 'customer'
- [ ] role is 'user'

### After Existing User Sign-In
```sql
SELECT id, name, email, google_id, profile_image 
FROM users 
WHERE email = 'existing@example.com';
```
- [ ] google_id is now populated
- [ ] profile_image is updated
- [ ] No duplicate records

## Edge Cases

### Email Already Exists
- [ ] User exists with email/password
- [ ] Sign in with Google using same email
- [ ] Verify google_id is added to existing account
- [ ] Verify no duplicate account created

### Google Account Without Profile Picture
- [ ] Sign in with Google account without profile picture
- [ ] Verify user created successfully
- [ ] Verify profile_image is null or default

### Network Issues
- [ ] Disconnect network
- [ ] Try to sign in with Google
- [ ] Verify appropriate error message
- [ ] Reconnect network
- [ ] Verify sign-in works again

## Production Readiness

### Configuration
- [ ] Production domain added to Google Console
- [ ] HTTPS enabled
- [ ] Production Client ID configured
- [ ] Environment variables set correctly

### Security
- [ ] Client ID not committed to repository
- [ ] JWT_SECRET is secure
- [ ] HTTPS enforced
- [ ] CORS properly configured

## Known Issues to Document
- [ ] List any issues found during testing
- [ ] Document workarounds
- [ ] Create tickets for fixes

## Sign-Off
- [ ] All tests passed
- [ ] Documentation updated
- [ ] Team notified
- [ ] Ready for deployment

---

## Test Results

### Date: ___________
### Tester: ___________

### Summary:
- Total Tests: ___
- Passed: ___
- Failed: ___
- Blocked: ___

### Notes:
