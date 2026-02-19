/**
 * Diagnostic Script - Check O+ Blood Group Donors
 * 
 * This script checks why O+ donors are not receiving SMS
 * Run: node check_donors_o_plus.js
 */

const mongoose = require('mongoose');
require('dotenv').config();
const Donor = require('./models/Donor');

async function checkOPlusDonors() {
    try {
        // Connect to database
        const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/donor_db';
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to database\n');

        console.log('='.repeat(60));
        console.log('DIAGNOSTIC: O+ BLOOD GROUP DONORS');
        console.log('='.repeat(60));

        // 1. Check all O+ donors (any format)
        console.log('\n📊 STEP 1: Finding all O+ donors in database...\n');
        const allOPlusDonors = await Donor.find({
            $or: [
                { bloodGroup: 'O+' },
                { bloodGroup: 'o+' },
                { bloodGroup: 'O +' },
                { bloodGroup: 'o +' },
                { 'Blood Group': 'O+' },
                { 'Blood Group': 'o+' }
            ]
        });

        console.log(`Found ${allOPlusDonors.length} total O+ donors in database`);

        // 2. Check donors by criteria
        console.log('\n📋 STEP 2: Breaking down by status...\n');

        const byRole = {
            donor: allOPlusDonors.filter(d => d.role === 'donor').length,
            user: allOPlusDonors.filter(d => d.role === 'user').length,
            undefined: allOPlusDonors.filter(d => !d.role).length
        };

        const byWillingToDonate = {
            true: allOPlusDonors.filter(d => d.willingToDonate === true).length,
            false: allOPlusDonors.filter(d => d.willingToDonate === false).length,
            undefined: allOPlusDonors.filter(d => d.willingToDonate === undefined).length
        };

        const byActive = {
            true: allOPlusDonors.filter(d => d.isActive === true).length,
            false: allOPlusDonors.filter(d => d.isActive === false).length,
            undefined: allOPlusDonors.filter(d => d.isActive === undefined).length
        };

        const withPhone = allOPlusDonors.filter(d => d.phone || d.phoneNumber || d["Mobile No"]).length;

        console.log('By Role:');
        console.log(`  - role='donor':     ${byRole.donor}`);
        console.log(`  - role='user':      ${byRole.user}`);
        console.log(`  - role=undefined:   ${byRole.undefined}`);

        console.log('\nBy WillingToDonate:');
        console.log(`  - willingToDonate=true:      ${byWillingToDonate.true}`);
        console.log(`  - willingToDonate=false:     ${byWillingToDonate.false}`);
        console.log(`  - willingToDonate=undefined: ${byWillingToDonate.undefined}`);

        console.log('\nBy isActive:');
        console.log(`  - isActive=true:      ${byActive.true}`);
        console.log(`  - isActive=false:     ${byActive.false}`);
        console.log(`  - isActive=undefined: ${byActive.undefined}`);

        console.log('\nWith Phone Number:');
        console.log(`  - Has phone: ${withPhone}`);
        console.log(`  - No phone:  ${allOPlusDonors.length - withPhone}`);

        // 3. Check eligible donors (what the query actually finds)
        console.log('\n🎯 STEP 3: Finding ELIGIBLE O+ donors (matching query criteria)...\n');

        const eligibleDonors = await Donor.find({
            role: 'donor',
            willingToDonate: true,
            isActive: true
        });

        // Filter for O+ blood group
        const eligibleOPlus = eligibleDonors.filter(donor => {
            const donorBloodGroup = donor.bloodGroup || donor["Blood Group"];
            const normalizedRequested = 'O+'.replace(/\s+/g, '').toUpperCase();
            const normalizedDonor = donorBloodGroup ? donorBloodGroup.replace(/\s+/g, '').toUpperCase() : '';
            return normalizedDonor === normalizedRequested;
        });

        console.log(`✅ Eligible O+ donors found: ${eligibleOPlus.length}`);

        if (eligibleOPlus.length > 0) {
            console.log('\n📱 List of eligible O+ donors:\n');
            eligibleOPlus.forEach((donor, index) => {
                const phone = donor.phone || donor.phoneNumber || donor["Mobile No"] || 'NO PHONE';
                console.log(`${index + 1}. ${donor.name || 'No Name'}`);
                console.log(`   Email: ${donor.email}`);
                console.log(`   Phone: ${phone}`);
                console.log(`   Blood Group: ${donor.bloodGroup || donor["Blood Group"]}`);
                console.log(`   Role: ${donor.role}`);
                console.log(`   Willing: ${donor.willingToDonate}`);
                console.log(`   Active: ${donor.isActive}`);
                console.log('');
            });
        } else {
            console.log('❌ NO ELIGIBLE O+ DONORS FOUND!');
            console.log('\nPossible reasons:');
            console.log('1. All O+ donors have role="user" instead of role="donor"');
            console.log('2. O+ donors have willingToDonate=false');
            console.log('3. O+ donors have isActive=false');
            console.log('4. Blood group format mismatch (e.g., "O +" vs "O+")');
        }

        // 4. Show ineligible O+ donors with reasons
        console.log('\n❌ STEP 4: Ineligible O+ donors and why...\n');

        const ineligibleDonors = allOPlusDonors.filter(donor => {
            return !(donor.role === 'donor' && donor.willingToDonate === true && donor.isActive === true);
        });

        if (ineligibleDonors.length > 0) {
            ineligibleDonors.forEach((donor, index) => {
                console.log(`${index + 1}. ${donor.name || 'No Name'} (${donor.email})`);
                const reasons = [];
                if (donor.role !== 'donor') reasons.push(`role='${donor.role}' (should be 'donor')`);
                if (donor.willingToDonate !== true) reasons.push(`willingToDonate=${donor.willingToDonate} (should be true)`);
                if (donor.isActive !== true) reasons.push(`isActive=${donor.isActive} (should be true)`);
                console.log(`   Reason: ${reasons.join(', ')}`);
                console.log('');
            });
        }

        // 5. Check 3-month rule
        console.log('\n📅 STEP 5: Checking 3-month donation rule...\n');

        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const recentDonors = eligibleOPlus.filter(donor => {
            if (donor.lastDonationDate) {
                const lastDonation = new Date(donor.lastDonationDate);
                return lastDonation > threeMonthsAgo;
            }
            return false;
        });

        console.log(`Donors who donated in last 3 months (ineligible): ${recentDonors.length}`);
        if (recentDonors.length > 0) {
            recentDonors.forEach(donor => {
                console.log(`  - ${donor.name}: Last donated ${new Date(donor.lastDonationDate).toLocaleDateString()}`);
            });
        }

        console.log(`\nDonors eligible after 3-month rule: ${eligibleOPlus.length - recentDonors.length}`);

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total O+ in database:        ${allOPlusDonors.length}`);
        console.log(`Eligible for SMS:            ${eligibleOPlus.length - recentDonors.length}`);
        console.log(`Blocked by 3-month rule:     ${recentDonors.length}`);
        console.log(`Ineligible (role/willing):   ${ineligibleDonors.length}`);
        console.log('='.repeat(60));

        if (eligibleOPlus.length - recentDonors.length === 0) {
            console.log('\n⚠️  ACTION REQUIRED:');
            console.log('No eligible O+ donors found. Please:');
            console.log('1. Check if donors registered with role="donor"');
            console.log('2. Verify willingToDonate=true for all donors');
            console.log('3. Ensure isActive=true');
            console.log('4. Verify blood group format is exactly "O+" (case-insensitive)');
        }

        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run the diagnostic
checkOPlusDonors();
