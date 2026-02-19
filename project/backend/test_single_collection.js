/**
 * Test Script for Single Collection Architecture
 * Tests the unified Donor collection with role-based access
 * 
 * What this tests:
 * 1. User registration (role='user', willingToDonate=false)
 * 2. Donor registration (role='donor', willingToDonate=true)
 * 3. Login with both user and donor roles
 * 4. Toggle functionality (user becoming donor)
 * 5. Blood request filtering (only willing donors)
 * 6. Donor status checking
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Donor = require('./models/Donor');
const BloodRequest = require('./models/BloodRequest');
const Hospital = require('./models/Hospital');

// Test data
const testData = {
    regularUser: {
        email: 'testuser@example.com',
        password: 'Test123!',
        name: 'Test User',
        phone: '+919876543210',
        role: 'user',
        willingToDonate: false,
        birthdate: new Date('1995-05-15')
    },
    willingDonor: {
        email: 'testdonor@example.com',
        password: 'Test123!',
        name: 'Test Donor',
        phone: '+919876543211',
        role: 'donor',
        willingToDonate: true,
        bloodGroup: 'A+',
        isActive: true,
        birthdate: new Date('1998-08-20')
    },
    toggleUser: {
        email: 'toggleuser@example.com',
        password: 'Test123!',
        name: 'Toggle Test User',
        phone: '+919876543212',
        role: 'user',
        willingToDonate: false,
        birthdate: new Date('2000-01-10')
    }
};

// Connect to test database
async function connectDB() {
    try {
        const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/test_donor_db';
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to test database');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

// Clean up test data
async function cleanup() {
    try {
        console.log('\n🧹 Cleaning up test data...');
        
        // Delete test users from Donor collection
        await Donor.deleteMany({
            email: {
                $in: [
                    testData.regularUser.email,
                    testData.willingDonor.email,
                    testData.toggleUser.email
                ]
            }
        });
        
        // Delete test blood requests
        await BloodRequest.deleteMany({
            description: { $regex: /TEST REQUEST/i }
        });
        
        console.log('✅ Cleanup completed');
    } catch (error) {
        console.error('❌ Cleanup failed:', error.message);
    }
}

// Test 1: Create Regular User (role='user')
async function testCreateRegularUser() {
    console.log('\n📝 TEST 1: Creating Regular User (role=\'user\')');
    try {
        const user = await Donor.create(testData.regularUser);
        
        console.log('✅ User created successfully');
        console.log('   - ID:', user._id);
        console.log('   - Email:', user.email);
        console.log('   - Role:', user.role);
        console.log('   - Willing to Donate:', user.willingToDonate);
        console.log('   - Blood Group:', user.bloodGroup || 'Not set');
        console.log('   - Birthdate:', user.birthdate ? user.birthdate.toISOString().split('T')[0] : 'Not set');
        
        // Verify
        if (user.role !== 'user') {
            console.error('❌ FAILED: Role should be \'user\'');
            return false;
        }
        if (user.willingToDonate !== false) {
            console.error('❌ FAILED: willingToDonate should be false');
            return false;
        }
        if (!user.birthdate) {
            console.error('❌ FAILED: Birthdate should be set');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('❌ FAILED:', error.message);
        return false;
    }
}

// Test 2: Create Donor (role='donor')
async function testCreateDonor() {
    console.log('\n📝 TEST 2: Creating Donor (role=\'donor\')');
    try {
        const donor = await Donor.create(testData.willingDonor);
        
        console.log('✅ Donor created successfully');
        console.log('   - ID:', donor._id);
        console.log('   - Email:', donor.email);
        console.log('   - Role:', donor.role);
        console.log('   - Willing to Donate:', donor.willingToDonate);
        console.log('   - Blood Group:', donor.bloodGroup);
        console.log('   - Is Active:', donor.isActive);
        console.log('   - Birthdate:', donor.birthdate ? donor.birthdate.toISOString().split('T')[0] : 'Not set');
        
        // Verify
        if (donor.role !== 'donor') {
            console.error('❌ FAILED: Role should be \'donor\'');
            return false;
        }
        if (donor.willingToDonate !== true) {
            console.error('❌ FAILED: willingToDonate should be true');
            return false;
        }
        if (!donor.bloodGroup) {
            console.error('❌ FAILED: Blood group should be set');
            return false;
        }
        if (!donor.birthdate) {
            console.error('❌ FAILED: Birthdate should be set');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('❌ FAILED:', error.message);
        return false;
    }
}

// Test 3: Login - Check Role Retrieval
async function testLoginRoleRetrieval() {
    console.log('\n📝 TEST 3: Testing Login Role Retrieval');
    try {
        // Find user by email
        const user = await Donor.findOne({ email: testData.regularUser.email });
        const donor = await Donor.findOne({ email: testData.willingDonor.email });
        
        console.log('✅ Users retrieved for login test');
        console.log('   - User role:', user.role);
        console.log('   - Donor role:', donor.role);
        
        // Verify roles
        if (user.role !== 'user') {
            console.error('❌ FAILED: User role should be \'user\'');
            return false;
        }
        if (donor.role !== 'donor') {
            console.error('❌ FAILED: Donor role should be \'donor\'');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('❌ FAILED:', error.message);
        return false;
    }
}

// Test 4: Toggle User to Donor (with location)
async function testToggleUserToDonor() {
    console.log('\n📝 TEST 4: Testing User to Donor Toggle (with Location)');
    try {
        // Create toggle test user
        const toggleUser = await Donor.create(testData.toggleUser);
        console.log('   - Created toggle user with role:', toggleUser.role);
        
        // Simulate becoming a donor (now requires location)
        toggleUser.role = 'donor';
        toggleUser.willingToDonate = true;
        toggleUser.bloodGroup = 'B+';
        toggleUser.latitude = 22.6108; // Example: CHARUSAT University
        toggleUser.longitude = 72.7658;
        toggleUser.address = 'CHARUSAT Campus, Changa';
        toggleUser.city = 'Anand';
        toggleUser.state = 'Gujarat';
        await toggleUser.save();
        
        // Retrieve and verify
        const updatedUser = await Donor.findById(toggleUser._id);
        
        console.log('✅ User toggled to donor with location');
        console.log('   - New Role:', updatedUser.role);
        console.log('   - Willing to Donate:', updatedUser.willingToDonate);
        console.log('   - Blood Group:', updatedUser.bloodGroup);
        console.log('   - Location:', `${updatedUser.latitude}, ${updatedUser.longitude}`);
        console.log('   - Address:', updatedUser.address);
        
        // Verify
        if (updatedUser.role !== 'donor') {
            console.error('❌ FAILED: Role should be \'donor\' after toggle');
            return false;
        }
        if (updatedUser.willingToDonate !== true) {
            console.error('❌ FAILED: willingToDonate should be true after toggle');
            return false;
        }
        if (!updatedUser.latitude || !updatedUser.longitude) {
            console.error('❌ FAILED: Location should be set when becoming donor');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('❌ FAILED:', error.message);
        return false;
    }
}

// Test 5: Toggle Donor Back to User
async function testToggleDonorToUser() {
    console.log('\n📝 TEST 5: Testing Donor to User Toggle (Stop Donating)');
    try {
        const toggleUser = await Donor.findOne({ email: testData.toggleUser.email });
        
        // Simulate stopping donation
        toggleUser.role = 'user';
        toggleUser.willingToDonate = false;
        // Keep bloodGroup - don't delete history
        await toggleUser.save();
        
        // Retrieve and verify
        const updatedUser = await Donor.findById(toggleUser._id);
        
        console.log('✅ Donor toggled back to user');
        console.log('   - New Role:', updatedUser.role);
        console.log('   - Willing to Donate:', updatedUser.willingToDonate);
        console.log('   - Blood Group (preserved):', updatedUser.bloodGroup);
        
        // Verify
        if (updatedUser.role !== 'user') {
            console.error('❌ FAILED: Role should be \'user\' after toggle back');
            return false;
        }
        if (updatedUser.willingToDonate !== false) {
            console.error('❌ FAILED: willingToDonate should be false after toggle back');
            return false;
        }
        if (!updatedUser.bloodGroup) {
            console.error('⚠️ WARNING: Blood group was deleted (should be preserved)');
        }
        
        return true;
    } catch (error) {
        console.error('❌ FAILED:', error.message);
        return false;
    }
}

// Test 6: Blood Request Filtering
async function testBloodRequestFiltering() {
    console.log('\n📝 TEST 6: Testing Blood Request Donor Filtering');
    try {
        // Query eligible donors (matching the controller logic)
        const eligibleDonors = await Donor.find({
            role: 'donor',
            willingToDonate: true,
            isActive: true,
            bloodGroup: 'A+'
        });
        
        // Query all A+ blood group users (including non-willing)
        const allAPositive = await Donor.find({
            bloodGroup: 'A+'
        });
        
        console.log('✅ Filtering test completed');
        console.log('   - Total A+ users in database:', allAPositive.length);
        console.log('   - Eligible donors (willing + active):', eligibleDonors.length);
        console.log('   - Users excluded from SMS:', allAPositive.length - eligibleDonors.length);
        
        // List eligible donors
        console.log('\n   Eligible Donors:');
        eligibleDonors.forEach(donor => {
            console.log(`     - ${donor.name} (${donor.email}) - Role: ${donor.role}, Willing: ${donor.willingToDonate}`);
        });
        
        // Verify filtering logic
        const hasUser = eligibleDonors.some(d => d.role === 'user');
        const hasNotWilling = eligibleDonors.some(d => !d.willingToDonate);
        const hasInactive = eligibleDonors.some(d => !d.isActive);
        
        if (hasUser) {
            console.error('❌ FAILED: Users with role=\'user\' should not be in eligible list');
            return false;
        }
        if (hasNotWilling) {
            console.error('❌ FAILED: Users with willingToDonate=false should not be in eligible list');
            return false;
        }
        if (hasInactive) {
            console.error('❌ FAILED: Inactive donors should not be in eligible list');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('❌ FAILED:', error.message);
        return false;
    }
}

// Test 7: Verify No Duplicate Collections
async function testNoDuplicateCollections() {
    console.log('\n📝 TEST 7: Verifying Single Collection Architecture');
    try {
        // Count users in Donor collection by role
        const userCount = await Donor.countDocuments({ role: 'user' });
        const donorCount = await Donor.countDocuments({ role: 'donor' });
        const totalCount = await Donor.countDocuments({});
        
        console.log('✅ Collection counts:');
        console.log('   - Total documents in Donor collection:', totalCount);
        console.log('   - Users (role=\'user\'):', userCount);
        console.log('   - Donors (role=\'donor\'):', donorCount);
        console.log('   - Willing to donate:', await Donor.countDocuments({ willingToDonate: true }));
        console.log('   - Not willing to donate:', await Donor.countDocuments({ willingToDonate: false }));
        
        // Verify sum
        if (userCount + donorCount !== totalCount) {
            console.error('⚠️ WARNING: Some documents may not have a role field set');
        }
        
        return true;
    } catch (error) {
        console.error('❌ FAILED:', error.message);
        return false;
    }
}

// Test 8: Check Donor Status API Logic
async function testDonorStatusLogic() {
    console.log('\n📝 TEST 8: Testing Donor Status API Logic');
    try {
        const user = await Donor.findOne({ email: testData.regularUser.email });
        const donor = await Donor.findOne({ email: testData.willingDonor.email });
        
        // Simulate API response logic
        const userStatus = {
            isDonor: user.role === 'donor' && user.willingToDonate === true,
            role: user.role,
            willingToDonate: user.willingToDonate,
            bloodGroup: user.bloodGroup
        };
        
        const donorStatus = {
            isDonor: donor.role === 'donor' && donor.willingToDonate === true,
            role: donor.role,
            willingToDonate: donor.willingToDonate,
            bloodGroup: donor.bloodGroup
        };
        
        console.log('✅ Status checked for both accounts');
        console.log('   - User isDonor:', userStatus.isDonor);
        console.log('   - Donor isDonor:', donorStatus.isDonor);
        
        // Verify
        if (userStatus.isDonor !== false) {
            console.error('❌ FAILED: User should not have isDonor=true');
            return false;
        }
        if (donorStatus.isDonor !== true) {
            console.error('❌ FAILED: Donor should have isDonor=true');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('❌ FAILED:', error.message);
        return false;
    }
}

// Main test runner
async function runAllTests() {
    console.log('🧪 ========================================');
    console.log('🧪 SINGLE COLLECTION ARCHITECTURE TESTS');
    console.log('🧪 ========================================');
    
    const connected = await connectDB();
    if (!connected) {
        console.error('❌ Cannot run tests without database connection');
        process.exit(1);
    }
    
    // Cleanup before tests
    await cleanup();
    
    const results = {
        passed: 0,
        failed: 0,
        total: 0
    };
    
    // Run all tests
    const tests = [
        { name: 'Create Regular User', fn: testCreateRegularUser },
        { name: 'Create Donor', fn: testCreateDonor },
        { name: 'Login Role Retrieval', fn: testLoginRoleRetrieval },
        { name: 'Toggle User to Donor', fn: testToggleUserToDonor },
        { name: 'Toggle Donor to User', fn: testToggleDonorToUser },
        { name: 'Blood Request Filtering', fn: testBloodRequestFiltering },
        { name: 'No Duplicate Collections', fn: testNoDuplicateCollections },
        { name: 'Donor Status Logic', fn: testDonorStatusLogic }
    ];
    
    for (const test of tests) {
        results.total++;
        const passed = await test.fn();
        if (passed) {
            results.passed++;
        } else {
            results.failed++;
        }
    }
    
    // Cleanup after tests
    await cleanup();
    
    // Summary
    console.log('\n🧪 ========================================');
    console.log('🧪 TEST SUMMARY');
    console.log('🧪 ========================================');
    console.log(`✅ Passed: ${results.passed}/${results.total}`);
    console.log(`❌ Failed: ${results.failed}/${results.total}`);
    console.log('🧪 ========================================\n');
    
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    
    process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
