import jsPDF from 'jspdf';

export function generatePDF(tour, expenses) {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 250],
  });

  const margin = 5;
  let y = 8;
  const lineH = 4;
  const width = 70;

  // Monospace font
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);

  // Title
  const title = tour.name || 'Tour Summary';
  const titleLines = doc.splitTextToSize(title, width);
  titleLines.forEach(line => {
    doc.text(line, 40, y, { align: 'center' });
    y += lineH + 1;
  });

  y += 1;

  // Separator
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text('--------------------------------', 40, y, { align: 'center' });
  y += lineH + 1;

  // Expense items
  doc.setFontSize(7);
  expenses.forEach(exp => {
    const name = exp.title || 'Item';
    const amt = `BDT ${(exp.total_amount || 0).toLocaleString()}`;
    
    // Truncate name if too long
    const maxNameW = width - doc.getTextWidth(amt) - 4;
    let displayName = name;
    while (doc.getTextWidth(displayName) > maxNameW && displayName.length > 3) {
      displayName = displayName.slice(0, -1);
    }
    if (displayName !== name) displayName += '..';

    doc.text(displayName, margin, y);
    doc.text(amt, margin + width, y, { align: 'right' });
    y += lineH;

    if (y > 240) {
      doc.addPage([80, 250]);
      y = 8;
    }
  });

  y += 1;

  // Separator
  doc.text('--------------------------------', 40, y, { align: 'center' });
  y += lineH + 1;

  // Summary
  const totalCost = expenses.reduce((s, e) => s + (e.total_amount || 0), 0);
  const memberCount = tour.members?.length || 1;
  const perPerson = Math.round(totalCost / memberCount);

  doc.setFontSize(8);
  doc.setFont('courier', 'bold');

  doc.text('TOTAL COST:', margin, y);
  doc.text(`BDT ${totalCost.toLocaleString()}`, margin + width, y, { align: 'right' });
  y += lineH;

  doc.setFont('courier', 'normal');
  doc.text('Tourmates:', margin, y);
  doc.text(`${memberCount}`, margin + width, y, { align: 'right' });
  y += lineH;

  doc.setFont('courier', 'bold');
  doc.text('PER PERSON:', margin, y);
  doc.text(`BDT ${perPerson.toLocaleString()}`, margin + width, y, { align: 'right' });
  y += lineH + 2;

  // Footer
  doc.setFont('courier', 'normal');
  doc.setFontSize(6);
  doc.text('--- Thank You ---', 40, y, { align: 'center' });

  doc.save(`${tour.name || 'tour'}_summary.pdf`);
}