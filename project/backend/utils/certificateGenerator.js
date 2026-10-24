const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a blood donation certificate PDF
 * @param {Object} options 
 * @param {string} options.donorName
 * @param {string} options.donorId
 * @param {string} options.bloodGroup
 * @param {number} options.units
 * @param {Date} options.donationDate
 * @returns {Promise<Buffer>}
 */
async function generateCertificate({ donorName, donorId, bloodGroup, units = 1, donationDate }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 30;

      
      const formattedDate = new Date(donationDate).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      const dayName = new Date(donationDate).toLocaleDateString('en-US', {
        weekday: 'long'
      });
      drawRopeBorder(doc, margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);
      const contentX = margin + 40;
      const contentY = margin + 40;
      const contentWidth = pageWidth - margin * 2 - 80;
      const logoY = contentY + 30;
      doc.circle(pageWidth / 2, logoY, 35)
        .fillAndStroke('#DC2626', '#991B1B');
      doc.fontSize(30)
        .fillColor('#FFFFFF')
        .text('🩸', pageWidth / 2 - 15, logoY - 15, { width: 30, align: 'center' });

      
      doc.fontSize(14)
        .fillColor('#DC2626')
        .font('Helvetica-Bold')
        .text('RaktMap Blood Donation System', contentX, logoY + 50, {
          width: contentWidth,
          align: 'center'
        });

      doc.fontSize(10)
        .fillColor('#666666')
        .font('Helvetica-Oblique')
        .text('Saving Lives, One Donation at a Time', contentX, logoY + 70, {
          width: contentWidth,
          align: 'center'
        });

      // Certificate title
      doc.fontSize(32)
        .fillColor('#1a1a1a')
        .font('Times-Bold')
        .text('Letter of Appreciation', contentX, logoY + 110, {
          width: contentWidth,
          align: 'center',
          characterSpacing: 2
        });

      // Presented to
      doc.fontSize(12)
        .fillColor('#666666')
        .font('Helvetica-Oblique')
        .text('Presented to', contentX, logoY + 160, {
          width: contentWidth,
          align: 'center'
        });

      // Donor name with underline
      const nameY = logoY + 185;
      doc.fontSize(24)
        .fillColor('#DC2626')
        .font('Helvetica-Bold')
        .text(donorName.toUpperCase(), contentX, nameY, {
          width: contentWidth,
          align: 'center'
        });

      // Underline for name
      const nameWidth = doc.widthOfString(donorName.toUpperCase());
      const nameX = (pageWidth - nameWidth) / 2;
      doc.moveTo(nameX - 20, nameY + 30)
        .lineTo(nameX + nameWidth + 20, nameY + 30)
        .lineWidth(2)
        .strokeColor('#DC2626')
        .stroke();

      // Donation details text
      doc.fontSize(13)
        .fillColor('#333333')
        .font('Helvetica')
        .text(
          `for Donating ${units} Unit${units > 1 ? 's' : ''} of ${bloodGroup} Blood`,
          contentX,
          nameY + 60,
          {
            width: contentWidth,
            align: 'center'
          }
        );

      doc.text(`on ${dayName}, ${formattedDate}`, contentX, nameY + 85, {
        width: contentWidth,
        align: 'center'
      });

      // Appreciation message box
      const boxY = nameY + 115;
      doc.roundedRect(contentX + 80, boxY, contentWidth - 160, 50, 5)
        .fillAndStroke('#FEF3C7', '#F59E0B');

      doc.fontSize(11)
        .fillColor('#333333')
        .font('Helvetica-Oblique')
        .text(
          'Your selfless act of donating blood has given someone the precious gift of life.',
          contentX + 90,
          boxY + 10,
          {
            width: contentWidth - 180,
            align: 'center',
            lineGap: 3
          }
        );

      doc.text('Thank you for being a hero!', contentX + 90, boxY + 34, {
        width: contentWidth - 180,
        align: 'center'
      });

      // Donor ID
      doc.fontSize(10)
        .fillColor('#666666')
        .font('Helvetica')
        .text(`Donor ID: ${donorId}`, contentX, boxY + 70, {
          width: contentWidth,
          align: 'center'
        });

      // Date of certificate
      doc.fontSize(10)
        .fillColor('#666666')
        .text(`Certificate Date: ${formattedDate}`, contentX, boxY + 90, {
          width: contentWidth,
        align: 'center'
      });

      // Signatures
      const sigY = pageHeight - margin - 90;
      const sigWidth = 180;
      const sigSpacing = (contentWidth - sigWidth * 2) / 3;

      // Left signature
      const leftSigX = contentX + sigSpacing;
      doc.moveTo(leftSigX, sigY)
        .lineTo(leftSigX + sigWidth, sigY)
        .lineWidth(1)
        .strokeColor('#333333')
        .stroke();

      doc.fontSize(10)
        .fillColor('#333333')
        .font('Helvetica-Bold')
        .text('Medical Director', leftSigX, sigY + 5, {
          width: sigWidth,
          align: 'center'
        });

      doc.fontSize(9)
        .fillColor('#666666')
        .font('Helvetica-Oblique')
        .text('Blood Bank Services', leftSigX, sigY + 20, {
          width: sigWidth,
          align: 'center'
        });

      // Right signature
      const rightSigX = leftSigX + sigWidth + sigSpacing;
      doc.moveTo(rightSigX, sigY)
        .lineTo(rightSigX + sigWidth, sigY)
        .lineWidth(1)
        .strokeColor('#333333')
        .stroke();

      doc.fontSize(10)
        .fillColor('#333333')
        .font('Helvetica-Bold')
        .text('RaktMap Administrator', rightSigX, sigY + 5, {
          width: sigWidth,
          align: 'center'
        });

      doc.fontSize(9)
        .fillColor('#666666')
        .font('Helvetica-Oblique')
        .text('Chief Coordinator', rightSigX, sigY + 20, {
          width: sigWidth,
          align: 'center'
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Draw a decorative rope-style border (similar to the certificate image)
 */
function drawRopeBorder(doc, x, y, width, height) {
  const borderWidth = 15;
  const ropeSegmentSize = 12;

  // Outer border - dark red
  doc.rect(x, y, width, height)
    .lineWidth(2)
    .strokeColor('#7F1D1D')
    .stroke();

  // Create rope pattern effect with alternating colors
  const colors = ['#DC2626', '#991B1B', '#7F1D1D'];
  
  // Top border
  for (let i = 0; i < width / ropeSegmentSize; i++) {
    const segX = x + i * ropeSegmentSize;
    const colorIndex = i % colors.length;
    doc.rect(segX + 2, y + 2, ropeSegmentSize, borderWidth)
      .fill(colors[colorIndex]);
  }

  // Bottom border
  for (let i = 0; i < width / ropeSegmentSize; i++) {
    const segX = x + i * ropeSegmentSize;
    const colorIndex = i % colors.length;
    doc.rect(segX + 2, y + height - borderWidth - 2, ropeSegmentSize, borderWidth)
      .fill(colors[colorIndex]);
  }

  // Left border
  for (let i = 0; i < height / ropeSegmentSize; i++) {
    const segY = y + i * ropeSegmentSize;
    const colorIndex = i % colors.length;
    doc.rect(x + 2, segY + 2, borderWidth, ropeSegmentSize)
      .fill(colors[colorIndex]);
  }

  // Right border
  for (let i = 0; i < height / ropeSegmentSize; i++) {
    const segY = y + i * ropeSegmentSize;
    const colorIndex = i % colors.length;
    doc.rect(x + width - borderWidth - 2, segY + 2, borderWidth, ropeSegmentSize)
      .fill(colors[colorIndex]);
  }

  // Corner decorations
  const cornerSize = 20;
  // Top-left
  doc.circle(x + cornerSize, y + cornerSize, 8)
    .fill('#DC2626');
  // Top-right
  doc.circle(x + width - cornerSize, y + cornerSize, 8)
    .fill('#DC2626');
  // Bottom-left
  doc.circle(x + cornerSize, y + height - cornerSize, 8)
    .fill('#DC2626');
  // Bottom-right
  doc.circle(x + width - cornerSize, y + height - cornerSize, 8)
    .fill('#DC2626');
}

module.exports = { generateCertificate };
