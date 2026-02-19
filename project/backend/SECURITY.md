# RaktMap Security Features

## Overview
This document outlines the security implementations in the RaktMap backend system.

## Security Measures Implemented

### 1. **Security Headers (Helmet)**
- Content Security Policy (CSP) to prevent XSS attacks
- X-Frame-Options to prevent clickjacking
- Strict-Transport-Security for HTTPS enforcement
- X-Content-Type-Options to prevent MIME sniffing

### 2. **Rate Limiting**
Three levels of rate limiting are implemented:

#### General API Rate Limit
- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Applied to**: All `/blood-requests`, `/donors`, `/hospitals`, `/admin`, etc.

#### Authentication Rate Limit
- **Window**: 15 minutes
- **Max Attempts**: 5 per IP
- **Applied to**: 
  - `/register`
  - `/login`
  - `/verify-registration`
  - `/resend-otp`
  - `/forgot-password`
  - `/verify-reset-otp`
  - `/reset-password`

#### SMS/Notification Rate Limit
- **Window**: 1 hour
- **Max Requests**: 10 per IP
- Prevents abuse of SMS/email services

### 3. **Data Sanitization**

#### NoSQL Injection Prevention (mongo-sanitize)
- Strips out MongoDB operators from user input
- Prevents queries like `{ $ne: null }` in user-submitted data

#### XSS Protection (xss-clean)
- Sanitizes user input to remove malicious scripts
- Prevents stored and reflected XSS attacks

#### HTTP Parameter Pollution (hpp)
- Prevents duplicate parameters in query strings
- Protects against parameter pollution attacks

### 4. **Input Validation**
Express-validator middleware for:
- **Email validation**: Normalized and verified format
- **Phone number validation**: International format (+1234567890)
- **Blood group validation**: Only valid blood types (A+, A-, B+, B-, AB+, AB-, O+, O-)
- **MongoDB ID validation**: Valid ObjectId format
- **Location validation**: Latitude (-90 to 90), Longitude (-180 to 180)
- **Password requirements**: Minimum 8 characters

### 5. **Authentication & Authorization**

#### JWT (JSON Web Tokens)
- Secure token-based authentication
- Tokens expire after 24 hours (configurable)
- Secret key stored in environment variables

#### Role-Based Access Control (RBAC)
Three roles implemented:
1. **Admin**: Full system access
2. **Hospital**: Manage blood requests and stock
3. **Donor**: View requests and respond

Middleware helpers:
- `requireAdmin()` - Admin-only routes
- `requireHospital()` - Hospital-only routes
- `requireDonor()` - Donor-only routes

### 6. **Password Security**
- Passwords hashed using bcrypt (10 salt rounds)
- Never stored in plain text
- Password reset via OTP (One-Time Password)
- OTP expires after 10 minutes

### 7. **CORS Configuration**
- Configured to accept requests from specific origins
- Credentials support enabled for authenticated requests
- Can be restricted in production

### 8. **Environment Variables**
Sensitive data stored in `.env` file:
- JWT_SECRET
- MONGODB_URI
- TWILIO credentials
- Email service credentials
- Never committed to version control

### 9. **Error Handling**
- Production mode hides stack traces
- Generic error messages to prevent information leakage
- Detailed logs for debugging (server-side only)

## Security Checklist for Deployment

### Pre-Deployment
- [ ] Generate strong JWT_SECRET (min 32 characters)
- [ ] Set NODE_ENV=production
- [ ] Configure CORS with specific allowed origins
- [ ] Enable HTTPS/SSL certificate
- [ ] Set up MongoDB IP whitelist
- [ ] Review and secure all environment variables
- [ ] Enable MongoDB authentication
- [ ] Set up firewall rules

### Post-Deployment
- [ ] Monitor rate limit violations
- [ ] Set up logging and monitoring
- [ ] Regular security audits
- [ ] Keep dependencies updated (`npm audit`)
- [ ] Monitor for suspicious activity
- [ ] Set up backup systems
- [ ] Configure alerting for security events

## Environment Variables Required

```env
# Security
JWT_SECRET=<strong-secret-key>
JWT_EXPIRE=24h
NODE_ENV=production
SESSION_SECRET=<another-strong-secret>

# Rate Limiting
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5
SMS_RATE_LIMIT_MAX=10

# CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Database
MONGODB_URI=mongodb+srv://...

# Services
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
EMAIL_USER=...
EMAIL_PASSWORD=...
```

## API Security Best Practices

### For Frontend Developers
1. **Store JWT securely**
   - Web: HttpOnly cookies (preferred) or localStorage
   - Mobile: Secure storage (AsyncStorage with encryption)

2. **Send JWT in headers**
   ```javascript
   headers: {
     'Authorization': `Bearer ${token}`
   }
   ```

3. **Handle rate limiting**
   - Implement retry logic with exponential backoff
   - Show user-friendly messages on rate limit errors

4. **Validate on client side too**
   - Don't rely solely on backend validation
   - Provide immediate feedback to users

5. **Use HTTPS only**
   - Never send sensitive data over HTTP
   - Validate SSL certificates

### For Backend Developers
1. **Always validate input**
   - Use validation middleware
   - Sanitize user input
   - Never trust client data

2. **Use parameterized queries**
   - Mongoose models prevent SQL injection by default
   - Still sanitize input to prevent NoSQL injection

3. **Implement logging**
   - Log security-relevant events
   - Don't log sensitive data (passwords, tokens)

4. **Keep dependencies updated**
   ```bash
   npm audit
   npm audit fix
   ```

5. **Regular security reviews**
   - Review authentication logic
   - Check for exposed endpoints
   - Audit access control

## Common Attack Vectors & Protections

| Attack Type | Protection Implemented |
|------------|----------------------|
| SQL/NoSQL Injection | mongo-sanitize, input validation |
| XSS (Cross-Site Scripting) | xss-clean, CSP headers |
| CSRF (Cross-Site Request Forgery) | JWT tokens, CORS policy |
| Brute Force | Rate limiting on auth routes |
| DDoS | General rate limiting |
| Clickjacking | X-Frame-Options header |
| Man-in-the-Middle | HTTPS enforcement |
| Session Hijacking | JWT tokens with expiry |
| Information Disclosure | Error handling, no stack traces in prod |

## Testing Security

### Manual Testing
```bash
# Test rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:3000/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done

# Test XSS protection
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(1)</script>","email":"test@example.com"}'

# Test NoSQL injection
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":{"$ne":null},"password":{"$ne":null}}'
```

### Automated Security Testing
```bash
# Run npm audit
npm audit

# Install and run OWASP Dependency Check
npm install -g auditjs
auditjs ossi
```

## Incident Response

1. **Suspected Breach**
   - Rotate all secrets immediately
   - Invalidate all active sessions
   - Review logs for suspicious activity
   - Notify affected users if data exposed

2. **Rate Limit Violations**
   - Check if legitimate traffic spike
   - Block IP if malicious
   - Adjust rate limits if needed

3. **Authentication Failures**
   - Monitor for patterns
   - Implement IP blocking for repeated failures
   - Alert administrators

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)

## Contact

For security issues, contact: security@raktmap.com
